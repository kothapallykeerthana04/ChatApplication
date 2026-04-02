import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);

    return () => s.disconnect();
  }, []);

  // ⭐ Send online status to backend
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("join-user", user.id);
    }
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
