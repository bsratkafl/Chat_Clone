import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatHeader from "./components/ChatHeader/ChatHeader";
import MessageList from "./components/MessageList/MessageList";
import ChatInput from "./components/ChatInput/ChatInput";
import "./App.css";

const API_BASE_URL = "http://localhost:3777/api";

function App() {
  // conversations state holds the chat history, isLoading indicates if a response is being generated, and messagesEndRef is used to scroll to the bottom of the chat when new messages are added.
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations when the app loads // on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, isLoading]);

  // This function fetches the conversation history from the backend when the app loads. It makes a GET request to the /api/chat/conversations endpoint and updates the conversations state with the response data.
  const fetchConversations = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/chat/conversations`);
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // This function handles sending a message. It optimistically adds the user's message to the chat, then makes a POST request to the backend. If the request is successful, it replaces the temporary message with the real user and assistant messages from the response. If there's an error, it adds an error message to the chat.
  const handleSendMessage = async (question) => {
    // Optimistically add user message
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: question,
    };
    setConversations((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/chat/conversations`, {
        question,
      });

      console.log("POST response:", data);

      if (data.success) {
        const { userConversation, assistantConversation } = data.data;
        // Replace temp message with real ones
        setConversations((prev) => {
          const filtered = prev.filter((msg) => msg.id !== tempUserMessage.id);
          return [...filtered, userConversation, assistantConversation];
        });
      }
    } catch (error) {
      console.error("Error posting conversation:", error);

      // Extract error message from backend response or use a realistic fallback
      const errorMessage =
        error.response?.data?.message ||
        "There was an error generating a response.";

      // Add error message to chat
      const errorConversation = {
        id: Date.now() + 1,
        role: "assistant",
        content: errorMessage,
      };

      setConversations((prev) => [...prev, errorConversation]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="chat">
        <ChatHeader />

        <MessageList
          conversations={conversations} // props passed to MessageList component to display the chat history
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
