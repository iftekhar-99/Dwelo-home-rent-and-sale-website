import React, { useState, useEffect } from 'react';
import { FaSpinner, FaComments, FaSearch } from 'react-icons/fa';
import { fetchWithAuth } from '../../utils/api';
import './ChatList.css';

const ChatList = ({ onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/chats');
      
      const data = await response.json();
      if (response.ok && data.success) {
        setChats(data.data.chats);
      } else {
        setError(data.message || 'Failed to fetch chats');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (chat) => {
    if (!chat?.participants) return { name: 'User' };
    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
    return chat.participants.find(p => p._id !== currentUserId) || { name: 'User' };
  };

  const getMessagePreview = (message) => {
    if (!message) return '';
    return message.length > 40 ? `${message.substring(0, 40)}...` : message;
  };

  const filteredChats = chats.filter(chat => {
    const otherParticipant = getOtherParticipant(chat);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      otherParticipant.name.toLowerCase().includes(searchLower) ||
      (chat.propertyId?.title && chat.propertyId.title.toLowerCase().includes(searchLower)) ||
      (chat.lastMessage?.content && chat.lastMessage.content.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="chat-list-loading">
        <FaSpinner className="loading-spinner" />
        <p>Loading chats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-list-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={fetchChats} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="chats-container">
        {filteredChats.length > 0 ? (
          filteredChats.map(chat => {
            const otherParticipant = getOtherParticipant(chat);
            const unreadCount = chat.unreadCount?.get(JSON.parse(localStorage.getItem('user'))?.id) || 0;
            
            return (
              <div 
                key={chat._id} 
                className={`chat-item ${unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => onSelectChat(chat._id)}
              >
                <div className="chat-avatar">
                  {otherParticipant.name.charAt(0).toUpperCase()}
                </div>
                <div className="chat-details">
                  <div className="chat-top-row">
                    <h4 className="chat-name">{otherParticipant.name}</h4>
                    <span className="chat-time">
                      {chat.lastMessage ? formatLastMessageTime(chat.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  {chat.propertyId && (
                    <div className="chat-property-title">
                      Re: {chat.propertyId.title}
                    </div>
                  )}
                  <div className="chat-preview">
                    {chat.lastMessage ? getMessagePreview(chat.lastMessage.content) : 'No messages yet'}
                  </div>
                  {unreadCount > 0 && (
                    <div className="unread-badge">{unreadCount}</div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-chats">
            <FaComments className="no-chats-icon" />
            <p>No conversations yet</p>
            <p className="no-chats-subtitle">Start chatting with property owners or users</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;