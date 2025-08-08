import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import UserChat from './UserChat';
import { FaComments, FaTimes } from 'react-icons/fa';
import './ChatInterface.css';

const ChatInterface = ({ propertyId, recipientId, onClose, isMinimized, onToggleMinimize }) => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatList, setShowChatList] = useState(!propertyId && !recipientId);

  useEffect(() => {
    // If propertyId or recipientId is provided, we're starting a new chat
    if (propertyId || recipientId) {
      setShowChatList(false);
    } else {
      setShowChatList(true);
      fetchUnreadCount();
    }
  }, [propertyId, recipientId]);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chats/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setShowChatList(false);
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setShowChatList(true);
    fetchUnreadCount(); // Refresh unread count when going back to list
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (isMinimized) {
    return (
      <div className="chat-interface-minimized" onClick={onToggleMinimize}>
        <FaComments />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-interface-header">
        <h3>
          <FaComments /> Chat
          {unreadCount > 0 && showChatList && <span className="unread-badge">{unreadCount}</span>}
        </h3>
        <div className="chat-interface-actions">
          <button className="minimize-btn" onClick={onToggleMinimize}>
            <span>_</span>
          </button>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>
      </div>
      
      <div className="chat-interface-content">
        {showChatList ? (
          <ChatList onSelectChat={handleSelectChat} />
        ) : selectedChatId ? (
          <UserChat 
            chatId={selectedChatId} 
            onClose={handleBackToList} 
          />
        ) : (
          <UserChat 
            propertyId={propertyId} 
            recipientId={recipientId} 
            onClose={handleBackToList} 
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface;