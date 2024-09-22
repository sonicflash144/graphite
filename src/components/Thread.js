import React, { useState, useEffect, useRef } from 'react';
import Suggestion from './Suggestion';
import closeIcon from './icons/close.svg';
import '../styles.css';

function Thread({ suggestion, onClose, editorContent, onApplySuggestion, onSuggestionHover, onSuggestionLeave, onDismissSuggestion, hoveredSuggestion, suggestionStatuses }) {
  const [threadHistory, setThreadHistory] = useState([]);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [threadHistory, suggestionStatuses]);

  useEffect(() => {
    // Initialize thread with the suggestion as the first message
    setThreadHistory([
      { role: 'assistant', content: { comments: [suggestion] } }
    ]);
  }, [suggestion]);

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const newThreadHistory = [...threadHistory, { role: 'user', content: message }];
    setThreadHistory(newThreadHistory);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newThreadHistory }),
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error:', data.error);
      } else {
        const updatedThreadHistory = [...newThreadHistory, { role: 'assistant', content: data }];
        setThreadHistory(updatedThreadHistory);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  const renderMessage = (msg) => {
    if (msg.role === 'assistant' && msg.content.comments) {
      return msg.content.comments.map((comment, index) => (
        <Suggestion
          key={index}
          suggestion={comment}
          onHover={onSuggestionHover}
          onLeave={onSuggestionLeave}
          onAccept={onApplySuggestion}
          onDismiss={onDismissSuggestion}
          isHovered={hoveredSuggestion === comment && hoveredSuggestion.id === comment.id}
          editorContent={editorContent}
          isThreadView={true}
        />
      ));
    }
    return <div className={`chat-bubble ${msg.role}-message`}>{msg.content}</div>;
  };

  return (
    <div className="w-1/4 bg-white p-4 border-l border-gray-300 flex flex-col">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Thread</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <img src={closeIcon} alt="Close" className="icon-class" />
        </button>
      </div>
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto">
        {threadHistory.map((msg, index) => (
          <div key={index}>{renderMessage(msg)}</div>
        ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          className="w-full border border-gray-300 p-2 rounded-[5px]"
          placeholder="Reply to this thread..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

export default Thread;