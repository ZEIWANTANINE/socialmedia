import SockJS from 'sockjs-client';
import { Client, IMessage, IFrame } from '@stomp/stompjs';
import { apiEndpoints } from './api';
import BASE_URL from './api';

// Interface cho hàm callback xử lý thông báo
export interface NotificationHandler {
  (notification: any): void;
}

class WebSocketService {
  private client: Client | null = null;
  private notificationHandlers: NotificationHandler[] = [];
  private connected: boolean = false;
  private reconnectTimer: any = null;
  private token: string | null = null;
  private connectionAttempts: number = 0;
  private MAX_RECONNECT_ATTEMPTS: number = 10;

  /**
   * Khởi tạo kết nối WebSocket
   * @param token JWT token để xác thực
   */
  connect(token: string) {
    // Lưu token để tái kết nối
    this.token = token;
    
    if (this.client && this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.client) {
      this.disconnect();
    }

    console.log('Connecting to WebSocket with token...');
    
    // Sử dụng URL không có token cho kết nối WebSocket
    const sockJsUrl = `${BASE_URL}${apiEndpoints.ws}`;
    console.log(`WebSocket connection URL: ${sockJsUrl}`);
    
    // Sử dụng hàm mới để thiết lập WebSocket với token trong header
    this.setupWebSocket(sockJsUrl, token);
  }

  /**
   * Thêm một số log để giúp debug
   */
  private setupWebSocket(sockJsUrl: string, token: string) {
    console.log(`Setting up WebSocket connection to: ${sockJsUrl}`);
    this.connectionAttempts++;
    
    try {
      this.client = new Client({
        webSocketFactory: () => {
          console.log('Creating SockJS instance with token (attempt #' + this.connectionAttempts + ')');
          // Tạo SockJS instance mà không có token trong URL
          const sockjs = new SockJS(sockJsUrl);
          
          // Debug events
          sockjs.onopen = () => {
            console.log('SockJS connection opened successfully');
            // Reset connection attempts on successful connection
            this.connectionAttempts = 0;
          };
          
          sockjs.onclose = (e) => {
            console.log('SockJS connection closed:', e);
            this.connected = false;
            
            // Check if we should try reconnecting
            if (this.connectionAttempts < this.MAX_RECONNECT_ATTEMPTS) {
              this.setupReconnect();
            } else {
              console.warn('Maximum reconnect attempts reached. Stopping reconnection attempts.');
            }
          };
          
          sockjs.onerror = (e) => {
            console.error('SockJS error:', e);
          };
          
          return sockjs;
        },
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        debug: function(str: string) {
          console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame: IFrame) => {
        console.log('WebSocket connected successfully', frame);
        this.connected = true;
        
        // Thông báo kết nối thành công nếu đang ở trình duyệt
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Kết nối thông báo', {
              body: 'Đã kết nối thành công. Bạn sẽ nhận được thông báo về lời mời kết bạn và tin nhắn.',
              icon: '/favicon.ico',
              tag: 'websocket-connected'
            });
          } catch (e) {
            console.error('Không thể hiển thị thông báo kết nối thành công:', e);
          }
        }
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Subscribe để nhận thông báo cá nhân
        if (this.client) {
          this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
            console.log('Received notification from WebSocket:', message.body);
            this.handleNotification(message);
          });
          
          // Gửi tin nhắn PING để kiểm tra kết nối
          this.sendPing();
          
          // Schedule regular pings to maintain connection
          setInterval(() => this.sendPing(), 30000);
        }
      };
      
      // Log tất cả các lỗi đầy đủ
      this.setupErrorHandlers();
      
      this.client.activate();
      console.log('WebSocket client activated');
    } catch (e) {
      console.error('Error creating WebSocket client:', e);
      this.setupReconnect();
    }
  }

  private setupErrorHandlers() {
    if (!this.client) return;
    
    this.client.onStompError = (frame: IFrame) => {
      console.error('WebSocket STOMP error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
      this.connected = false;
      this.setupReconnect();
    };
    
    this.client.onWebSocketError = (event: Event) => {
      console.error('WebSocket error event:', event);
      this.connected = false;
      this.setupReconnect();
    };
    
    this.client.onWebSocketClose = (event: CloseEvent) => {
      console.log('WebSocket connection closed', event);
      console.log('Close code:', event.code, 'Close reason:', event.reason);
      this.connected = false;
      this.setupReconnect();
    };
  }

  /**
   * Gửi tin nhắn PING để kiểm tra kết nối
   */
  private sendPing() {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: '/app/ws-ping',
          body: JSON.stringify({ type: 'PING', timestamp: new Date().toISOString() }),
          headers: { 'content-type': 'application/json' }
        });
        console.log('Ping sent to server');
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  }

  /**
   * Thiết lập cơ chế tự động kết nối lại
   */
  private setupReconnect() {
    if (!this.reconnectTimer && this.token) {
      console.log('Setting up reconnect timer');
      this.reconnectTimer = setInterval(() => {
        if (!this.connected && this.token) {
          console.log('Attempting to reconnect WebSocket...');
          // Kiểm tra lại token
          const currentToken = localStorage.getItem('jwtToken');
          if (currentToken && currentToken !== this.token) {
            // Token đã thay đổi, cập nhật
            this.token = currentToken;
            this.connectionAttempts = 0; // Reset attempt count with new token
          }
          this.connect(this.token);
        } else if (this.connected) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      }, 5000); // Thử kết nối lại sau mỗi 5 giây
    }
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
    
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Đăng ký hàm callback để xử lý thông báo
   * @param handler Hàm callback
   */
  registerNotificationHandler(handler: NotificationHandler) {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Xử lý thông báo nhận được từ WebSocket
   * @param message Thông báo từ server
   */
  private handleNotification(message: IMessage) {
    try {
      const notification = JSON.parse(message.body);
      console.log('Received notification:', notification);
      
      // Gọi tất cả các hàm callback đã đăng ký
      this.notificationHandlers.forEach(handler => {
        try {
          handler(notification);
        } catch (e) {
          console.error('Error in notification handler:', e);
        }
      });
    } catch (e) {
      console.error('Error parsing notification:', e);
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this.connected;
  }
}

// Export single instance
const webSocketService = new WebSocketService();
export default webSocketService; 