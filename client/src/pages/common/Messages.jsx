import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatList, UserChat } from '../../components/chat';
import './Messages.css';

const useQuery = () => new URLSearchParams(useLocation().search);

const Messages = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [startWithRecipient, setStartWithRecipient] = useState(null);
  const [startWithProperty, setStartWithProperty] = useState(null);
  const query = useQuery();
  const navigate = useNavigate();

  useEffect(() => {
    const recipientId = query.get('recipientId');
    const propertyId = query.get('propertyId');
    setStartWithRecipient(recipientId || null);
    setStartWithProperty(propertyId || null);
  }, [query]);

  return (
    <div className="messages-page">
      <aside className="messages-sidebar">
        <ChatList onSelectChat={(id) => { setSelectedChatId(id); setStartWithRecipient(null); setStartWithProperty(null); }} />
      </aside>
      <main className="messages-content">
        {selectedChatId || startWithRecipient ? (
          <UserChat chatId={selectedChatId} propertyId={startWithProperty} recipientId={startWithRecipient} onClose={() => setSelectedChatId(null)} />
        ) : (
          <div className="messages-empty">
            <h3>Select a conversation or start a new one</h3>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;
