import webSocketService from './webSocketService';
import axiosInstance from './axiosInstance';

// Interface cho tin nhắn
export interface Message {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  isFromCurrentUser: boolean;
}

// Interface cho callback xử lý tin nhắn
export interface MessageHandler {
  (message: Message): void;
}

// Interface cho event listener
export interface ChatEventListener {
  (event: any): void;
}

class ChatService {
  private messageHandlers: Map<number, MessageHandler[]> = new Map();
  private eventListeners: Record<string, ChatEventListener[]> = {
    'message': [],
    'error': [],
    'sent': []
  };

  constructor() {
    // Đăng ký listener cho notification từ WebSocket service
    webSocketService.registerNotificationHandler(this.handleWebSocketNotification.bind(this));
  }

  /**
   * Gửi tin nhắn qua WebSocket
   * @param receiverId ID người nhận
   * @param content Nội dung tin nhắn
   */
  sendMessage(receiverId: number, content: string): void {
    if (!webSocketService.isConnected()) {
      console.error('WebSocket không được kết nối');
      this.triggerEvent('error', { message: 'Kết nối WebSocket bị mất, không thể gửi tin nhắn' });
      return;
    }

    // Tạo đối tượng tin nhắn
    const chatMessage = {
      receiverId,
      content,
      timestamp: new Date().toISOString()
    };

    // Gửi tin nhắn qua WebSocket
    webSocketService.sendStompMessage('/app/chat', chatMessage);

    console.log(`Đã gửi tin nhắn đến ${receiverId}: ${content}`);
  }

  /**
   * Gửi tin nhắn qua API REST thay vì WebSocket (phương án dự phòng)
   */
  async sendMessageViaRest(receiverId: number, content: string): Promise<Message | null> {
    try {
      const response = await axiosInstance.post(`/api/messages/send/${receiverId}`, { content });
      console.log('Tin nhắn đã được gửi qua REST API:', response.data);
      this.triggerEvent('sent', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn qua REST API:', error);
      this.triggerEvent('error', { message: 'Không thể gửi tin nhắn' });
      return null;
    }
  }

  /**
   * Lấy tin nhắn qua REST API
   */
  async getMessages(userId: number): Promise<{ messages: Message[], user: any } | null> {
    try {
      console.log(`Gọi API lấy tin nhắn với userId=${userId}`);
      
      try {
        // Thử lấy tin nhắn từ API
        const response = await axiosInstance.get(`/api/messages/chat/${userId}`);
        console.log('Nhận được dữ liệu chat:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Lỗi khi lấy tin nhắn ban đầu:', error);
        
        // Kiểm tra các loại lỗi khác nhau
        if (error.response) {
          console.log('Mã lỗi HTTP:', error.response.status);
          console.log('Dữ liệu phản hồi:', error.response.data);
          
          // Lỗi 400 hoặc 403: Có thể là chưa có tin nhắn hoặc chưa kết bạn
          if (error.response.status === 400 || error.response.status === 403) {
            console.warn('Không tìm thấy đoạn chat hiện có hoặc chưa kết bạn. Thử tạo đoạn chat mới...');
            
            // Tự động tạo đoạn chat mới
            try {
              console.log('Gọi API createChat...');
              const chatData = await this.createChat(userId);
              if (chatData) {
                console.log('Tạo đoạn chat mới thành công:', chatData);
                return chatData;
              } else {
                console.error('Tạo đoạn chat trả về null');
                this.triggerEvent('error', { message: 'Không thể tạo đoạn chat. Đảm bảo bạn đã kết bạn với người dùng này.' });
                return null;
              }
            } catch (createError: any) {
              console.error('Lỗi khi tạo đoạn chat mới:', createError);
              
              // Nếu lỗi 403 khi tạo chat, người dùng chưa kết bạn
              if (createError.response && createError.response.status === 403) {
                this.triggerEvent('error', { message: 'Bạn chưa kết bạn với người dùng này' });
                return null;
              }
              
              // Thử lấy thông tin người dùng để hiển thị tên
              try {
                console.log('Thử lấy thông tin người dùng từ API...');
                const userResponse = await axiosInstance.get(`/auth/users/${userId}`);
                const userData = userResponse.data;
                
                // Trả về đoạn chat trống với thông tin người dùng
                return {
                  messages: [], // Không có tin nhắn
                  user: {
                    id: userId,
                    username: userData.username || 'Người dùng',
                    profilePicture: userData.profilePicture || null
                  }
                };
              } catch (userError) {
                console.error('Không thể lấy thông tin người dùng:', userError);
                this.triggerEvent('error', { message: 'Không thể tải thông tin người dùng' });
                return null;
              }
            }
          }
          
          // Các lỗi khác
          this.triggerEvent('error', { message: `Lỗi khi tải tin nhắn: ${error.response.data || error.message}` });
          return null;
        }
        
        // Lỗi không phải HTTP response (network error)
        this.triggerEvent('error', { message: `Lỗi kết nối: ${error.message}` });
        return null;
      }
    } catch (error: any) {
      console.error('Lỗi ngoại lệ:', error);
      this.triggerEvent('error', { message: `Lỗi không xác định: ${error.message || 'Không thể tải tin nhắn'}` });
      return null;
    }
  }

  /**
   * Đánh dấu các tin nhắn là đã đọc
   */
  async markAsRead(senderId: number): Promise<void> {
    try {
      await axiosInstance.put(`/api/messages/read/${senderId}`);
    } catch (error) {
      console.error('Lỗi khi đánh dấu tin nhắn đã đọc:', error);
    }
  }

  /**
   * Đăng ký handler cho tin nhắn từ một người dùng cụ thể
   * @param userId ID người dùng để lắng nghe tin nhắn
   * @param handler Hàm xử lý khi nhận được tin nhắn
   */
  registerMessageHandler(userId: number, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(userId)) {
      this.messageHandlers.set(userId, []);
    }
    
    this.messageHandlers.get(userId)?.push(handler);
    
    // Trả về hàm để hủy đăng ký
    return () => {
      const handlers = this.messageHandlers.get(userId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  /**
   * Đăng ký lắng nghe các sự kiện chat (message, error, sent)
   */
  addEventListener(event: 'message' | 'error' | 'sent', listener: ChatEventListener): () => void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(listener);
    }
    
    return () => {
      const listeners = this.eventListeners[event];
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Trigger một sự kiện cho tất cả listeners
   */
  private triggerEvent(event: string, data: any): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(listener => {
        try {
          listener(data);
        } catch (e) {
          console.error(`Lỗi trong chat event listener cho '${event}':`, e);
        }
      });
    }
  }

  /**
   * Xử lý thông báo từ WebSocket
   * @param notification Thông báo từ WebSocket service
   */
  private handleWebSocketNotification(notification: any): void {
    console.log('Nhận notification:', notification);
    
    // Xử lý các loại thông báo khác nhau
    if (notification.type === 'NEW_MESSAGE') {
      // Chuyển đổi thành định dạng Message
      const message: Message = {
        id: notification.message.id,
        content: notification.message.content,
        createdAt: notification.message.createdAt,
        isRead: notification.message.isRead,
        isFromCurrentUser: false // Từ người khác gửi đến
      };
      
      const senderId = notification.senderId;
      
      // Gọi tất cả các handler đã đăng ký cho người dùng này
      const handlers = this.messageHandlers.get(senderId);
      if (handlers && handlers.length > 0) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (e) {
            console.error('Lỗi trong message handler:', e);
          }
        });
      }
      
      // Trigger sự kiện message cho tất cả listeners
      this.triggerEvent('message', { message, senderId });
      
    } else if (notification.type === 'MESSAGE_SENT') {
      // Xác nhận tin nhắn đã được gửi
      this.triggerEvent('sent', notification);
      
    } else if (notification.type === 'CHAT_ERROR') {
      // Xử lý lỗi chat
      console.error('Lỗi chat:', notification.message);
      this.triggerEvent('error', notification);
    }
  }

  /**
   * Tạo đoạn chat mới
   */
  async createChat(userId: number): Promise<{ messages: Message[], user: any } | null> {
    try {
      console.log(`Tạo đoạn chat mới với userId=${userId}`);
      
      const response = await axiosInstance.post(`/api/messages/create-chat/${userId}`);
      console.log('Đã tạo đoạn chat mới:', response.data);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo đoạn chat mới:', error);
      this.triggerEvent('error', { message: 'Không thể tạo đoạn chat mới' });
      return null;
    }
  }
}

// Export single instance
const chatService = new ChatService();
export default chatService; 