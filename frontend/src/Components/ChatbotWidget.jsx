import React, { useState } from "react";
import axios from "axios";
import chatbotImg from "../assets/chatbot.png";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const payload = {
        message: userMessage,
        employeeId: user._id || user.id,            // for User / LeaveRequest
        role: user.role,                            // teaching / hod / director
        departmentId: user.departmentType || null,  // for dept-based queries
      };

      const res = await axios.post(
        "http://localhost:5000/api/chatbot/chat",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const botReply =
        res?.data?.reply || "No data available for this question.";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Something went wrong while reading data from the system.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      {/* Chatbot Icon */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          textAlign: "center",
          cursor: "pointer",
          zIndex: 9999,
        }}
      >
        <img
          src={chatbotImg}
          alt="College Chatbot"
          style={{
            width: "65px",
            height: "65px",
            borderRadius: "50%",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
          }}
        />
        <div
          style={{
            marginTop: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            color: "#2563eb",
          }}
        >
          College Bot
        </div>
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            width: "320px",
            height: "400px",
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 0 15px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#2563eb",
              color: "#fff",
              padding: "10px",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
            }}
          >
            College Assistant
          </div>

          <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px",
                    borderRadius: "8px",
                    background:
                      msg.sender === "user" ? "#2563eb" : "#e5e7eb",
                    color: msg.sender === "user" ? "#fff" : "#000",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}

            {loading && (
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                Bot is reading data…
              </div>
            )}
          </div>

          <div style={{ display: "flex", padding: "8px" }}>
            <input
              type="text"
              placeholder="Ask about leave, timetable..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, padding: "8px" }}
            />
            <button onClick={sendMessage} style={{ marginLeft: "6px" }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
