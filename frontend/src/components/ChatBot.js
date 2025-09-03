import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User } from 'lucide-react';
import api, { aiService } from '../services/api';
import toast from 'react-hot-toast';
import FeatureGuard from './FeatureGuard';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI assistant. I can help you with attendance queries, leave requests, and other HR-related questions. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.ai.chatbot(inputMessage);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response || 'I apologize, but I encountered an error processing your request.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: 'I apologize, but I\'m currently unable to process your request. Please try again later.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedQuestions = [
    "How many hours did I work this week?",
    "When was my last check-in?",
    "How can I request leave?",
    "What are my attendance statistics?",
    "How do I register my face?"
  ];

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <FeatureGuard feature="ai_chatbot">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="header-content">
            <MessageCircle size={32} />
            <div>
              <h1>AI Assistant</h1>
              <p>Get help with attendance and HR queries</p>
            </div>
          </div>
        </div>

      <div className="chat-area">
        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-avatar">
                {message.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-time">{formatTime(message.timestamp)}</div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="suggested-questions">
            <h3>Try asking:</h3>
            <div className="questions-grid">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="suggested-question"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="input-form">
          <div className="input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .chatbot-container {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
        }

        .chatbot-header {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-content svg {
          color: #3b82f6;
        }

        .chatbot-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 0.25rem 0;
        }

        .chatbot-header p {
          color: #6b7280;
          margin: 0;
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          gap: 0.75rem;
          max-width: 80%;
        }

        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message.bot .message-avatar {
          background: #dbeafe;
          color: #3b82f6;
        }

        .message.user .message-avatar {
          background: #f3f4f6;
          color: #374151;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .message.user .message-content {
          align-items: flex-end;
        }

        .message-text {
          background: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          color: #374151;
          line-height: 1.5;
        }

        .message.user .message-text {
          background: #3b82f6;
          color: white;
        }

        .message-time {
          font-size: 0.75rem;
          color: #9ca3af;
          padding: 0 0.5rem;
        }

        .typing-indicator {
          background: #f9fafb;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes typing {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .suggested-questions {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .suggested-questions h3 {
          margin: 0 0 1rem 0;
          color: #374151;
          font-size: 1rem;
        }

        .questions-grid {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .suggested-question {
          text-align: left;
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .suggested-question:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .input-form {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }

        .input-container {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .input-container input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 24px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-container input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .input-container input:disabled {
          background: #f9fafb;
          color: #9ca3af;
        }

        .send-button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .chatbot-container {
            padding: 1rem;
            height: calc(100vh - 80px);
          }

          .message {
            max-width: 90%;
          }

          .questions-grid {
            gap: 0.75rem;
          }
        }
      `}</style>
      </div>
    </FeatureGuard>
  );
};

export default ChatBot;
