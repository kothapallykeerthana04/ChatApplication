import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "../api/axios";

export default function Chat() {
  const { user, token, logout } = useAuth();
  const socket = useSocket();

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load rooms + users
  useEffect(() => {
    if (!token) return;

    axios
      .get("/rooms", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRooms(res.data))
      .catch(console.error);

    axios
      .get("/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, [token]);

  // Receive messages
  useEffect(() => {
    if (!socket) return;

    const handler = (msg) => {
      if (msg.roomId === activeRoom?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive-message", handler);
    return () => socket.off("receive-message", handler);
  }, [socket, activeRoom]);

  // Online/offline updates
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === data.userId ? { ...u, online: data.online } : u
        )
      );
    };

    socket.on("user-online-status", handler);
    return () => socket.off("user-online-status", handler);
  }, [socket]);

  // Split rooms into public groups vs DMs
  const publicRooms = rooms.filter((r) => r.isPublic);
  const dmRooms = rooms.filter((r) => !r.isPublic);

  // Search filters
  const filteredRooms = publicRooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  // Load messages for a room
  const loadRoomMessages = async (room) => {
    setActiveRoom(room);

    const res = await axios.get(`/messages/${room._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMessages(res.data);
    socket.emit("join-room", room._id);
  };

  // Join a public room
  const joinRoom = async (room) => {
    const res = await axios.post(
      "/rooms/join",
      { roomId: room._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ensure it's in our rooms list
    if (!rooms.some((r) => r._id === res.data._id)) {
      setRooms((prev) => [...prev, res.data]);
    }

    loadRoomMessages(res.data);
  };

  // Create public room
  const handleCreateRoom = async () => {
    const name = prompt("Enter public room name:");
    if (!name) return;

    const res = await axios.post(
      "/rooms",
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setRooms((prev) => [...prev, res.data]);
  };

  // Start DM with user
  const startDMWithUser = async (otherUser) => {
    const res = await axios.post(
      "/rooms/private",
      { otherUserId: otherUser._id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const room = res.data;

    if (!rooms.some((r) => r._id === room._id)) {
      setRooms((prev) => [...prev, room]);
    }

    loadRoomMessages(room);
  };

  // File change
  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  // Send message
  const sendMessage = async () => {
    if (!activeRoom) return;
    if (!text.trim() && !file) return;

    let mediaUrl = null;
    let mediaType = null;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await axios.post("/upload", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        mediaUrl = uploadRes.data.url;
        mediaType = uploadRes.data.type.startsWith("image")
          ? "image"
          : "file";

        setFile(null);
      }

      socket.emit("send-message", {
        roomId: activeRoom._id,
        text: text.trim(),
        mediaUrl,
        mediaType,
      });

      setText("");
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  };

  const firstLetter = (name = "") =>
    name.trim().length ? name.trim()[0].toUpperCase() : "?";

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="app-shell">
      <div className="dm-container">
        {/* SIDEBAR */}
        <aside className="dm-sidebar">
          <div className="dm-sidebar-header">
            <div className="dm-user-info">
              <div className="dm-avatar-circle">
                {firstLetter(user?.username)}
              </div>
              <div className="dm-user-text">
                <span className="dm-user-name">{user?.username}</span>
                <span className="dm-user-status">
                  {users.find((u) => u._id === user.id)?.online
                    ? "Online"
                    : "Offline"}
                </span>
              </div>
            </div>
            <button className="dm-logout-btn" onClick={logout}>
              Logout
            </button>
          </div>

          {/* SEARCH */}
          <div style={{ padding: "0.8rem" }}>
            <input
              placeholder="Search users or rooms..."
              className="dm-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* CREATE PUBLIC ROOM */}
          <div className="dm-sidebar-actions">
            <button
              className="dm-action-btn primary"
              onClick={handleCreateRoom}
            >
              Create Public Room
            </button>
          </div>

          {/* USERS LIST (for DM) */}
          {search && (
            <>
              <div className="dm-sidebar-section-label">Users</div>
              <div className="dm-list">
                {filteredUsers.map((u) => (
                  <div
                    key={u._id}
                    className="dm-list-item"
                    onClick={() => startDMWithUser(u)}
                  >
                    <div className="dm-list-avatar">
                      {firstLetter(u.username)}
                    </div>
                    <div>{u.username}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PUBLIC ROOMS */}
          <div className="dm-sidebar-section-label">Public Rooms</div>
          <div className="dm-list">
            {filteredRooms.map((r) => (
              <div
                key={r._id}
                className={
                  "dm-list-item" + (activeRoom?._id === r._id ? " active" : "")
                }
                onClick={() => joinRoom(r)}
              >
                <div className="dm-list-avatar">{firstLetter(r.name)}</div>
                <div>{r.name}</div>
              </div>
            ))}
          </div>

          {/* DMs */}
          <div className="dm-sidebar-section-label">Direct Messages</div>
          <div className="dm-list">
            {dmRooms.map((r) => (
              <div
                key={r._id}
                className={
                  "dm-list-item" + (activeRoom?._id === r._id ? " active" : "")
                }
                onClick={() => loadRoomMessages(r)}
              >
                <div className="dm-list-avatar">
                  {firstLetter(r.name.replace("&", "").trim())}
                </div>
                <div>{r.name}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN CHAT */}
        <main className="dm-main">
          {activeRoom ? (
            <>
              <header className="dm-main-header">
                <div className="dm-main-avatar">
                  {firstLetter(activeRoom.name)}
                </div>
                <div className="dm-main-title">
                  <span className="dm-main-name">{activeRoom.name}</span>
                  <span className="dm-main-sub">
                    {activeRoom.isPublic ? "Public Room" : "Direct Message"}
                  </span>
                </div>
              </header>

              <div className="dm-messages">
                {messages.map((m) => {
                  const mine = m.sender === user.id;
                  return (
                    <div
                      key={m._id}
                      className={"dm-message-row" + (mine ? " me" : "")}
                    >
                      <div className="dm-bubble">
                        {m.text && <div>{m.text}</div>}

                        {m.mediaUrl && m.mediaType === "image" && (
                          <img
                            src={`http://localhost:5000${m.mediaUrl}`}
                            className="dm-bubble-media"
                            alt=""
                          />
                        )}

                        {m.mediaUrl && m.mediaType === "file" && (
                          <a
                            href={`http://localhost:5000${m.mediaUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="dm-bubble-file"
                          >
                            Download file
                          </a>
                        )}

                        <div className="dm-bubble-meta">
                        {formatTime(m.createdAt)}

                  {/* ✔ TICKS */}
                      {m.sender === user.id && (
                      <span style={{ marginLeft: "6px" }}>
                      {m.seenBy && m.seenBy.length > 1 ? "✔✔" : "✔"}
                      </span>
          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="dm-input-bar">
                <button
                  className="dm-icon-btn"
                  onClick={() =>
                    document.getElementById("hidden-file-input").click()
                  }
                >
                  +
                </button>
                <input
                  id="hidden-file-input"
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <input
                  className="dm-input"
                  placeholder={file ? "File attached…" : "Type a message"}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />

                <button className="dm-send-btn" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="dm-empty-state">
              Select a room or user to start chatting.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
