import React, { useState, useEffect, useRef } from 'react';
import Suggestion from './Suggestion';
import closeIcon from './icons/close.svg';
import '../styles.css';
require('dotenv').config();
const chatUrl = process.env.HEROKU_URL;

function Thread({ editorContent, userPrompt, suggestion, onClose, onSuggestionHover, onSuggestionLeave, onApplySuggestion, onDismissSuggestion, hoveredSuggestion, suggestionStatuses }) {
  const [threadHistory, setThreadHistory] = useState([]);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);
  const prevThreadLength = useRef(threadHistory.length);

  useEffect(() => {
    if (messageContainerRef.current && threadHistory.length > prevThreadLength.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
    prevThreadLength.current = threadHistory.length;
  }, [threadHistory]);
  
  useEffect(() => {
    const initialThreadHistory = (textContent, userPrompt) => {
      const firstMessageContent = textContent.trim()
        ? `Here is the user's full text for context:\n\n${textContent}`
        : "The user currently has no text written.";
      const updatedFirstMessageContent = (userPrompt && userPrompt !== '[]')
        ? `Information to keep in mind about the user's text: ${userPrompt}.\n\n${firstMessageContent}`
        : firstMessageContent;
    
      let threadHistory = [
        { role: 'system', content: updatedFirstMessageContent },
        {
          role: 'system',
          content:
            "Your job is to elevate the user's writing by providing feedback on their text. You will respond with two things: a base chat text for solely conversational purposes, and a list of anchored comments for any actual suggested changes. If the user's query does not require you to provide comments, you can leave the comments list empty. If you do choose to provide comments, there are 5 types of comments you can give. 1. 'REPLACE': replace the 'anchor' field with the 'text' field, 2. 'ADD_BEFORE': add the 'text' field before the text in the 'anchor' field, 3. 'ADD_AFTER': add the 'text' field after the text in the 'anchor' field, 4. 'REMOVE': delete the text in the 'anchor' field, 5. 'QUESTION': ask a question about the text in the 'anchor' field. For types 'REPLACE', 'ADD_BEFORE', and 'ADD_AFTER', ensure the text makes COMPLETE SENSE after the change.",
        }
      ];
    
      if (typeof suggestion === 'object') {
        const data = { comments: [{ type: 'THREAD-STARTER', anchor: suggestion.anchor }] };
        const dataWithIds = assignIdsToSuggestions(data);
        threadHistory.push({ role: 'assistant', content: dataWithIds, special: 'thread-starter' });
        threadHistory.push({ role: 'assistant', content: { comments: [suggestion] }, special: 'thread-starter' });
      } else {
        const data = { comments: [{ type: 'THREAD-STARTER', anchor: suggestion }] };
        const dataWithIds = assignIdsToSuggestions(data);
        threadHistory.push({ role: 'assistant', content: dataWithIds, special: 'thread-starter' });
      }
    
      return threadHistory;
    };
  
    const savedThreadHistory = localStorage.getItem('threadHistory');
    let updatedThreadHistory = [];
  
    if (savedThreadHistory) {
      const parsedThreadHistory = JSON.parse(savedThreadHistory);
      // Filter out the initial system messages
      const nonSystemMessages = parsedThreadHistory.filter(
        (message) => message.role !== 'system' && message.special !== 'thread-starter'
      );
      // Create new initial system messages
      const newSystemMessages = initialThreadHistory(editorContent, JSON.stringify(userPrompt));
      // Combine new system messages with non-system messages
      updatedThreadHistory = [...newSystemMessages, ...nonSystemMessages];
    } else {
      updatedThreadHistory = initialThreadHistory(editorContent, JSON.stringify(userPrompt));
    }
  
    setThreadHistory(updatedThreadHistory);
    localStorage.setItem('threadHistory', JSON.stringify(updatedThreadHistory));
  }, [suggestion, editorContent, userPrompt]);
  
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

    const newThreadHistory = [...threadHistory, { role: 'user', content: message }];
    setThreadHistory(newThreadHistory);
    setMessage('');

    localStorage.setItem('threadHistory', JSON.stringify(newThreadHistory));

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newThreadHistory }),
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error:', data.error);
      } else {
        const dataWithIds = assignIdsToSuggestions(data);
        const updatedThreadHistory = [...newThreadHistory, { role: 'assistant', content: dataWithIds }];
        setThreadHistory(updatedThreadHistory);
        localStorage.setItem('threadHistory', JSON.stringify(updatedThreadHistory));
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
    if(msg.role === 'system'){
      return;
    }
    else if (msg.role === 'assistant') {
      return (
        <>
          {msg.content.chat_text ? <div className={`chat-bubble assistant-message`}>{msg.content.chat_text}</div> : null}
          {msg.content.comments.length > 0 && (
            <div className="suggestions-container">
              {msg.content.comments.map((comment) => {
                const suggestionStatus = suggestionStatuses.find(s => s.id === comment.id)?.status || null;
                return (
                  <Suggestion
                    key={comment.id}
                    suggestion={comment}
                    status={suggestionStatus}
                    onHover={onSuggestionHover}
                    onLeave={onSuggestionLeave}
                    onAccept={onApplySuggestion}
                    onDismiss={onDismissSuggestion}
                    isHovered={hoveredSuggestion === comment && hoveredSuggestion.id === comment.id}
                    editorContent={editorContent}
                    isThreadView={true}
                  />
                );
              })}
            </div>
          )}
        </>
        
      );
    }
    return <div className={`chat-bubble ${msg.role}-message`}>{msg.content}</div>;
  };

  const handleClose = () => {
    setThreadHistory([]);
    onClose();
  };

  return (
    <div className="w-1/4 bg-white p-4 border-l border-gray-300 flex flex-col">
      <div className="flex justify-between mb-4 no-select">
        <h2 className="text-xl font-bold">Thread</h2>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          <img src={closeIcon} alt="Close" className="icon-class" />
        </button>
      </div>
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto" id="message-container">
        {threadHistory.map((msg, index) => (
          <div key={index}>{renderMessage(msg)}</div>
        ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          className="w-full border border-gray-300 p-2 rounded-[5px] no-select"
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