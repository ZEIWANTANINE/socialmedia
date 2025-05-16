'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import Navbar from '@/app/components/Navbar';
import chatService, { Message } from '@/app/utils/chatService';
import webSocketService from '@/app/utils/webSocketService';
import { Avatar, Button, TextField, Typography, Paper, Box, CircularProgress, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.userId as string, 10);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối danh sách tin nhắn
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Kiểm tra xác thực
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      // Đảm bảo WebSocket được kết nối
      webSocketService.connect(token);
    }
  }, [isAuthenticated, router, token]);

  // Lấy dữ liệu chat
  useEffect(() => {
    const loadChatData = async () => {
      if (!userId || isNaN(userId)) {
        setError('ID người dùng không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null); // Xóa lỗi trước đó
        
        // Đăng ký lắng nghe lỗi từ chatService
        const unregisterError = chatService.addEventListener('error', (event) => {
          console.log('Nhận sự kiện lỗi từ chatService:', event);
          if (event.message) {
            setError(event.message);
          }
        });
        
        console.log('Đang tải dữ liệu chat với userId:', userId);
        
        // Lấy tin nhắn từ API
        const chatData = await chatService.getMessages(userId);
        
        // Nếu không có dữ liệu chat, hiển thị lỗi
        if (!chatData) {
          console.warn('Không thể tải dữ liệu chat - chatData là null');
          if (!error) { // Chỉ đặt lỗi nếu không có lỗi nào được đặt từ sự kiện
            setError('Không thể tải đoạn chat. Vui lòng thử lại hoặc kiểm tra xem bạn đã kết bạn chưa.');
          }
          setLoading(false);
          unregisterError(); // Hủy đăng ký để tránh lỗi
          return;
        }
        
        console.log('Đã nhận dữ liệu chat:', chatData);
        
        // Cập nhật state
        setMessages(chatData.messages || []);
        setUser(chatData.user);
        
        // Đánh dấu tin nhắn là đã đọc nếu có tin nhắn
        if (chatData.messages && chatData.messages.length > 0) {
          await chatService.markAsRead(userId);
        }

        setLoading(false);
        unregisterError(); // Hủy đăng ký để tránh lỗi
      } catch (err: any) {
        console.error('Lỗi không xử lý được khi tải dữ liệu chat:', err);
        setError('Lỗi khi tải dữ liệu chat: ' + (err.message || 'Không xác định'));
        setLoading(false);
      }
    };

    if (isAuthenticated && userId) {
      loadChatData();
    }
  }, [isAuthenticated, userId, error]);

  // Đăng ký lắng nghe tin nhắn mới qua WebSocket
  useEffect(() => {
    if (!userId) return;
    
    // Hàm xử lý khi có tin nhắn mới
    const handleNewMessage = (message: Message) => {
      setMessages(prevMessages => [...prevMessages, message]);
      scrollToBottom();
    };
    
    // Đăng ký handler để nhận tin nhắn từ người này
    const unregister = chatService.registerMessageHandler(userId, handleNewMessage);
    
    // Đăng ký handler cho các sự kiện
    const unregisterError = chatService.addEventListener('error', (event) => {
      setError(event.message || 'Lỗi không xác định');
    });
    
    // Dọn dẹp khi thoát khỏi trang
    return () => {
      unregister();
      unregisterError();
    };
  }, [userId]);

  // Cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
    
    try {
      // Thêm tin nhắn vào danh sách tin nhắn (tối ưu hóa UI)
      const optimisticMessage: Message = {
        id: Date.now(), // ID tạm thời
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        isFromCurrentUser: true
      };
      
      setMessages(prevMessages => [...prevMessages, optimisticMessage]);
      setNewMessage('');
      
      // Nếu WebSocket đang kết nối, hãy sử dụng nó
      if (webSocketService.isConnected()) {
        chatService.sendMessage(userId, newMessage.trim());
      } else {
        // Fallback sang REST API
        await chatService.sendMessageViaRest(userId, newMessage.trim());
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  if (!isAuthenticated) {
    return null; // Sẽ chuyển hướng trong useEffect
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Navbar />
      
      <Box sx={{ maxWidth: 800, margin: '0 auto', pt: 2, px: 2 }}>
        {user && (
          <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar src={user.profilePicture || '/default-avatar.png'} sx={{ mr: 2 }} />
            <Typography variant="h6">{user.username}</Typography>
          </Paper>
        )}
        
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 2, mb: 2, minHeight: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <Typography color="textSecondary">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</Typography>
            </Box>
          ) : (
            <Box sx={{ overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {messages.map((message) => (
                <Box 
                  key={message.id}
                  sx={{
                    alignSelf: message.isFromCurrentUser ? 'flex-end' : 'flex-start',
                    backgroundColor: message.isFromCurrentUser ? '#dcf8c6' : '#fff',
                    borderRadius: 2,
                    p: 1,
                    mb: 1,
                    maxWidth: '70%',
                  }}
                >
                  <Typography variant="body1">{message.content}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.isFromCurrentUser && (
                      <span style={{ marginLeft: 4 }}>
                        {message.isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </Typography>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Paper>
        
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading || !user}
            sx={{ mr: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={loading || !newMessage.trim() || !user}
          >
            Gửi
          </Button>
        </Paper>
      </Box>
    </Box>
  );
} 