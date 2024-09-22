import React, { useState, useEffect, useRef } from 'react';
import Suggestion from './Suggestion';
import clearIcon from './icons/clearchat.svg';

function Chat({ editorContent, clearStorage, onOpenThread, onSuggestionHover, onSuggestionLeave, onApplySuggestion, onDismissSuggestion, hoveredSuggestion, suggestionStatuses }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);
  
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory) {
      setChatHistory(JSON.parse(savedChatHistory));
    } else {
      setChatHistory(initialChatHistory(editorContent));
    }
  }, [editorContent]);

  const initialChatHistory = (textContent) => [
    { role: 'system', content: `Here is the user's text:\n\n${textContent}` },
    {
      role: 'system',
      content:
        "Your job is to elevate the user's writing by providing comments on their text. There are 5 types of comments you can give: 1. 'REPLACE': replace the 'anchor' field with the 'text' field, 2. 'ADD_BEFORE': add the 'text' field before the text in the 'anchor' field, 3. 'ADD_AFTER': add the 'text' field after the text in the 'anchor' field, 4. 'REMOVE': delete the 'anchor' field, 5. 'QUESTION': ask a question about the 'anchor' field. For types 'REPLACE', 'ADD_BEFORE', and 'ADD_AFTER', ensure the text makes COMPLETE SENSE after the change.",
    },
  ];

  const assignIdsToSuggestions = (data) => {
    if (data.comments) {
      return {
        ...data,
        comments: data.comments.map((comment) => ({
          ...comment,
          id: Date.now() + Math.random(),
        })),
      };
    }
    return data;
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const newChatHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newChatHistory);
    setMessage('');

    localStorage.setItem('chatHistory', JSON.stringify(newChatHistory));

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newChatHistory }),
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error:', data.error);
      } else {
        const dataWithIds = assignIdsToSuggestions(data);
        const updatedChatHistory = [...newChatHistory, { role: 'assistant', content: dataWithIds }];
        setChatHistory(updatedChatHistory);
        localStorage.setItem('chatHistory', JSON.stringify(updatedChatHistory));
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

  const clearChat = () => {
    setChatHistory(initialChatHistory(editorContent));
    clearStorage();
  }

  const renderMessage = (msg) => {
    if (msg.role === 'assistant' && msg.content.comments) {
      return (
        <div className="suggestions-container">
          {msg.content.comments.map((comment) => (
            <Suggestion
              key={comment.id}
              suggestion={comment}
              suggestionStatuses={suggestionStatuses}
              onHover={onSuggestionHover}
              onLeave={onSuggestionLeave}
              onAccept={onApplySuggestion}
              onDismiss={onDismissSuggestion}
              onOpenThread={onOpenThread}
              isHovered={hoveredSuggestion === comment && hoveredSuggestion.id === comment.id}
              editorContent={editorContent}
              isThreadView={false}
            />
          ))}
        </div>
      );
    }
    return <div className={`chat-bubble ${msg.role}-message`}>{msg.content}</div>;
  };

  return (
    <div className="w-1/4 bg-white p-4 border-r border-gray-300 flex flex-col">
      <div className="flex mb-4">
        <h2 className="text-xl font-bold mr-4">Chat</h2>
        <button onClick={clearChat}>
          <img src={clearIcon} alt="Clear Chat" />
        </button>
      </div>
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto" id="message-container">
        {chatHistory
          .filter((msg) => msg.role !== 'system')
          .map((msg, index) => (
            <div key={index}>{renderMessage(msg)}</div>
          ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          id="chat-input"
          className="w-full border border-gray-300 p-2"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

export default Chat;