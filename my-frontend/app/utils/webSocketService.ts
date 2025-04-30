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

  /**
   * Khởi tạo kết nối WebSocket
   * @param token JWT token để xác thực
   */
  connect(token: string) {
    if (this.client) {
      this.disconnect();
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}${apiEndpoints.ws}`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: function(str: string) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame: IFrame) => {
      console.log('Connected to WebSocket');
      this.connected = true;
      
      // Subscribe để nhận thông báo cá nhân
      if (this.client) {
        this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
          this.handleNotification(message);
        });
      }
    };

    this.client.onStompError = (frame: IFrame) => {
      console.error('WebSocket error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };

    this.client.activate();
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