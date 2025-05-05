const BASE_URL = "http://localhost:6789";

export const apiEndpoints = {
  // Auth endpoints
  login: "/auth/login",
  register: "/auth/register",
  checkAuth: "/auth/check-auth",
  
  // User endpoints
  users: "/auth/users",
  userSearch: "/auth/users/search",
  userProfile: (userId: string) => `/auth/users/${userId}`,
  
  // Friend endpoints
  friends: "/api/friends",
  friendRequests: "/api/friendrequests",
  sentFriendRequests: "/api/friendrequests/sent",
  receivedFriendRequests: "/api/friendrequests/received",
  acceptFriendRequest: (requestId: number) => `/api/friendrequests/${requestId}/accept`,
  rejectFriendRequest: (requestId: number) => `/api/friendrequests/${requestId}/reject`,
  
  // Message endpoints
  messages: "/api/messages",
  messageChat: (userId: string) => `/api/messages/chat/${userId}`,
  sendMessage: (receiverId: string) => `/api/messages/send/${receiverId}`,
  markMessagesAsRead: (senderId: string) => `/api/messages/read/${senderId}`,
  deleteMessage: (messageId: string) => `/api/messages/${messageId}`,
  conversations: "/api/messages/conversations",
  
  // Post endpoints
  posts: "/posts",
  userPosts: (userId: string) => `/posts/user/${userId}`,
  
  // Notification endpoints
  notifications: "/api/notifications",
  unreadNotifications: "/api/notifications/me/unread",
  notificationCount: "/api/notifications/me/count",
  
  // WebSocket endpoint
  ws: "/ws"
};

export default BASE_URL;
