import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import './UserChat.css';

const UserChat = ({ chatId, propertyId, recipientId, onClose }) => {
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch chat data when component mounts or chatId changes
  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
    } else if (recipientId) {
      startNewChat();
    }
  }, [chatId, recipientId]);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chats/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setChat(data.data.chat);
      } else {
        setError(data.message || 'Failed to fetch chat');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      setError('Failed to fetch chat');
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId,
          propertyId
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setChat(data.data.chat);
      } else {
        setError(data.message || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !chat?._id) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            chatId: chat._id,
          content: message
        })
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        // Add the new message to the chat
        setChat(prevChat => ({
          ...prevChat,
          messages: [...prevChat.messages, data.data.message]
        }));
        setMessage('');
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const getOtherParticipant = () => {
    if (!chat?.participants) return { name: 'User' };
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
    return chat.participants.find(p => p._id !== currentUserId) || { name: 'User' };
  };

  if (loading) {
    return (
      <div className="user-chat-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-chat-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={onClose} className="back-btn">
          <FaArrowLeft /> Back
        </button>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <div className="user-chat">
      <div className="chat-header">
        <button onClick={onClose} className="back-btn">
          <FaArrowLeft />
        </button>
        <h3>{otherParticipant.name}</h3>
        {chat?.propertyId && (
          <div className="chat-property">
            <span>Re: {chat.propertyId.title}</span>
          </div>
        )}
      </div>

      <div className="chat-messages">
        {chat?.messages && chat.messages.length > 0 ? (
          chat.messages.map((msg, index) => {
            const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
            const isCurrentUser = (msg.sender?.toString?.() || msg.sender) === currentUserId;
            
            return (
              <div 
                key={index} 
                className={`message ${isCurrentUser ? 'sent' : 'received'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">{formatTimestamp(msg.timestamp)}</div>
              </div>
            );
          })
        ) : (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !message.trim()}>
          {sending ? <FaSpinner className="loading-spinner" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  );
};

export default UserChat;