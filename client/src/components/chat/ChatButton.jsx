import React, { useState, useEffect } from 'react';
import { FaComments } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ChatButton.css';

const ChatButton = ({ propertyId, recipientId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('/api/chats/unread', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) setUnreadCount(data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleOpenChat = () => {
    const params = new URLSearchParams();
    if (propertyId) params.set('propertyId', propertyId);
    if (recipientId) params.set('recipientId', recipientId);
    navigate(`/messages${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <button className="chat-button" onClick={handleOpenChat}>
      <FaComments />
      <span>Chat</span>
      {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
    </button>
  );
};

export default ChatButton;