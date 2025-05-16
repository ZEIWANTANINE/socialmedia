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
      return true;
    }

    if (this.client) {
      this.disconnect();
    }

    console.log('Connecting to WebSocket with token...');
    
    // Remove Bearer prefix if it exists
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    
    try {
      // Create WebSocket URL with both token parameters to ensure compatibility
      // Send both token and access_token to support different backend configurations
      const sockJsUrl = `${BASE_URL}/ws?token=${encodeURIComponent(cleanToken)}&access_token=${encodeURIComponent(cleanToken)}`;
      console.log(`WebSocket URL: ${sockJsUrl} (trimmed for privacy)`);
      
      this.setupWebSocket(sockJsUrl, cleanToken);
      return true;
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      return false;
    }
  }

  /**
   * Detailed WebSocket setup with improved error handling and logging
   */
  private setupWebSocket(sockJsUrl: string, token: string) {
    console.log(`Setting up WebSocket connection to: ${sockJsUrl}`);
    this.connectionAttempts++;
    
    try {
      this.client = new Client({
        webSocketFactory: () => {
          console.log('Creating SockJS instance (attempt #' + this.connectionAttempts + ')');
          
          // Create SockJS with proper options for authentication
          const sockjs = new SockJS(sockJsUrl, null, { 
            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
          });
          
          // Debug events with detailed error logging
          sockjs.onopen = () => {
            console.log('SockJS transport connection opened successfully');
          };
          
          sockjs.onclose = (e) => {
            console.log('SockJS transport connection closed:', e);
            console.log('Close code:', e.code, 'reason:', e.reason);
          };
          
          sockjs.onerror = (e) => {
            console.error('SockJS transport error:', e);
          };
          
          return sockjs;
        },
        // Include token in headers (both formats)
        connectHeaders: {
          'Authorization': `Bearer ${token}`,
          'X-Authorization': `Bearer ${token}`
        },
        debug: function(str: string) {
          console.log('STOMP debug: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = (frame: IFrame) => {
        console.log('WebSocket connected successfully', frame);
        this.connected = true;
        this.connectionAttempts = 0; // Reset connection attempts counter
        
        // Thông báo kết nối thành công nếu đang ở trình duyệt
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('WebSocket Connected', {
              body: 'You will now receive real-time notifications and messages.',
              icon: '/favicon.ico',
              tag: 'websocket-connected'
            });
          } catch (e) {
            console.error('Cannot display browser notification:', e);
          }
        }
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Subscribe to personal notifications
        if (this.client) {
          this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
            console.log('Received notification:', message.body);
            this.handleNotification(message);
          });
          
          // Send a PING to test the connection
          this.sendPing();
          
          // Schedule regular pings to maintain connection
          setInterval(() => this.sendPing(), 30000);
        }
      };
      
      // Set up comprehensive error handlers
      this.setupErrorHandlers();
      
      // Activate the client
      this.client.activate();
      console.log('WebSocket client activated');
    } catch (e) {
      console.error('Error creating WebSocket client:', e);
      this.setupReconnect();
    }
  }

  /**
   * Setup comprehensive error handlers for the WebSocket connection
   */
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
   * Send a ping message to keep the connection alive
   */
  sendPing() {
    if (this.client && this.connected) {
      try {
        const message = {
          type: 'PING',
          timestamp: new Date().toISOString(),
          clientId: Math.random().toString(36).substring(2, 9) // Random ID for tracking
        };
        
        console.log('Sending PING message to server');
        this.client.publish({
          destination: '/app/test-ping',
          body: JSON.stringify(message)
        });
      } catch (e) {
        console.error('Error sending ping message:', e);
      }
    }
  }

  /**
   * Setup automatic reconnection mechanism
   */
  private setupReconnect() {
    if (!this.reconnectTimer && this.token) {
      console.log('Setting up reconnect timer');
      this.reconnectTimer = setInterval(() => {
        if (!this.connected && this.token) {
          console.log('Attempting to reconnect WebSocket...');
          
          // Check for token updates in localStorage
          const currentToken = localStorage.getItem('jwtToken');
          if (currentToken && currentToken !== this.token) {
            // Token has changed, update it
            this.token = currentToken;
            this.connectionAttempts = 0; // Reset attempt count with new token
            console.log('Token has been updated since last connection attempt');
          }
          
          if (this.connectionAttempts < this.MAX_RECONNECT_ATTEMPTS) {
            this.connect(this.token);
          } else {
            console.warn('Maximum reconnect attempts reached. Stopping automatic reconnection.');
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
          }
        } else if (this.connected) {
          clearInterval(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      }, 5000); // Try to reconnect every 5 seconds
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.client) {
      console.log('Disconnecting WebSocket client');
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
   * Register a notification handler
   */
  registerNotificationHandler(handler: NotificationHandler) {
    this.notificationHandlers.push(handler);
    return () => {
      this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Handle incoming notifications
   */
  private handleNotification(message: IMessage) {
    try {
      // Parse notification from JSON
      const notification = JSON.parse(message.body);
      console.log('Parsed notification:', notification);
      
      // Dispatch to all registered handlers
      this.notificationHandlers.forEach(handler => {
        try {
          handler(notification);
        } catch (e) {
          console.error('Error in notification handler:', e);
        }
      });
      
      // Show browser notification if applicable
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        this.showBrowserNotification(notification);
      }
    } catch (e) {
      console.error('Error handling notification:', e);
      console.error('Raw message body:', message.body);
    }
  }
  
  /**
   * Display browser notification for different notification types
   */
  private showBrowserNotification(notification: any) {
    try {
      let title = 'New Notification';
      let body = '';
      let icon = '/favicon.ico';
      
      if (notification.type === 'FRIEND_REQUEST') {
        title = 'New Friend Request';
        body = notification.message || `${notification.senderUsername} sent you a friend request`;
      } else if (notification.type === 'NEW_MESSAGE') {
        title = `Message from ${notification.senderUsername}`;
        body = notification.message?.content || 'New message received';
      } else if (notification.type === 'FRIEND_REQUEST_ACCEPTED') {
        title = 'Friend Request Accepted';
        body = notification.message || `${notification.accepterUsername} accepted your friend request`;
      } else if (notification.type === 'PONG') {
        // Don't show notification for PONG responses
        return;
      }
      
      new Notification(title, { body, icon });
    } catch (e) {
      console.error('Error showing browser notification:', e);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Gửi tin nhắn STOMP đến một destination
   */
  sendStompMessage(destination: string, body: any) {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination: destination,
          body: JSON.stringify(body)
        });
        return true;
      } catch (e) {
        console.error('Error sending STOMP message:', e);
        return false;
      }
    } else {
      console.warn('Cannot send STOMP message - WebSocket not connected');
      return false;
    }
  }
}

// Export single instance
const webSocketService = new WebSocketService();
export default webSocketService; 