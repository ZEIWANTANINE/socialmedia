"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../app/utils/axiosInstance";
import { apiEndpoints } from "../app/utils/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Attempting login with username:', username);
      const response = await axiosInstance.post(
        apiEndpoints.login,
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log('Login response:', response.data);

      const { token, userId } = response.data;
      
      if (token && userId) {
        localStorage.setItem("jwtToken", token);
        localStorage.setItem("username", username);
        localStorage.setItem("userId", userId.toString());
        localStorage.setItem("tokenTimestamp", Date.now().toString()); // Record token creation time
        
        console.log('Stored in localStorage:', {
          token: token.substring(0, 15) + '...',
          userId: userId,
          username: username,
          tokenTimestamp: Date.now()
        });
        
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        router.push("/home");
      } else {
        setError("Login failed, please try again!");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      setError("Invalid username or password!");
    } finally {
      setLoading(false);
    }
  };

  // Function to validate token freshness - helps avoid using expired tokens
  const checkTokenFreshness = () => {
    const token = localStorage.getItem("jwtToken");
    const tokenTimestamp = localStorage.getItem("tokenTimestamp");
    
    if (token && tokenTimestamp) {
      const now = Date.now();
      const tokenAge = now - parseInt(tokenTimestamp);
      
      // If token is older than 23 hours (assuming token validity is 24 hours)
      // 23 hours = 82800000 ms
      if (tokenAge > 82800000) {
        console.log("Token is aging. Will need to refresh soon.");
        return false;
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const checkAuthentication = async () => {
      const token = localStorage.getItem("jwtToken");
      if (token) {
        try {
          // Check if token is fresh before using it
          const isFreshToken = checkTokenFreshness();
          if (!isFreshToken) {
            console.log("Token is aging, checking validity...");
          }
          
          const response = await axiosInstance.get('/auth/check-auth');
          if (response.data.isAuthenticated) {
            console.log('Already authenticated, redirecting to home');
            router.push("/home");
          } else {
            // Token không hợp lệ, xóa
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('username');
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          // Xóa token không hợp lệ
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          localStorage.removeItem('tokenTimestamp');
        }
      }
    };
    
    checkAuthentication();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ${
              loading ? 'bg-blue-400' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}