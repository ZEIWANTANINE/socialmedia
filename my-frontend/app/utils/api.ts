const BASE_URL = "http://localhost:6789";

export const apiEndpoints = {
  register: "/auth/register",
  login: "/auth/login",
  posts: "/posts",
  users: "/auth/users",
  friendRequests: "/api/friendrequests",
  friends: "/api/friends",
  notifications: "/api/notifications",
  ws: "/ws" // WebSocket endpoint
};

export default BASE_URL;
