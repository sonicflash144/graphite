import React, { useState, useEffect, useRef } from 'react';
import Suggestion from './Suggestion';
import clearIcon from './icons/clearchat.svg';
import settingsIcon from './icons/settings.svg';

function Chat({ editorContent, userPrompt, openSettings, clearStorage, onOpenThread, onSuggestionHover, onSuggestionLeave, onApplySuggestion, onDismissSuggestion, hoveredSuggestion, suggestionStatuses }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');
  const messageContainerRef = useRef(null);
  const prevChatHistoryLength = useRef(chatHistory.length);
  
  useEffect(() => {
    if (messageContainerRef.current && chatHistory.length > prevChatHistoryLength.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
    prevChatHistoryLength.current = chatHistory.length;
  }, [chatHistory]);

  useEffect(() => {
    const savedChatHistory = localStorage.getItem('chatHistory');
    let updatedChatHistory = [];
  
    if (savedChatHistory) {
      const parsedChatHistory = JSON.parse(savedChatHistory);
      // Filter out the initial system messages
      const nonSystemMessages = parsedChatHistory.filter(
        (message) => message.role !== 'system'
      );
      // Create new initial system messages
      const newSystemMessages = initialChatHistory(editorContent, JSON.stringify(userPrompt));
      // Combine new system messages with non-system messages
      updatedChatHistory = [...newSystemMessages, ...nonSystemMessages];
    } else {
      updatedChatHistory = initialChatHistory(editorContent, JSON.stringify(userPrompt));
    }
  
    setChatHistory(updatedChatHistory);
    localStorage.setItem('chatHistory', JSON.stringify(updatedChatHistory));
  }, [editorContent, userPrompt]);
  
  const initialChatHistory = (textContent, userPrompt) => {
    const firstMessageContent = textContent.trim()
      ? `Here is the user's text:\n\n${textContent}`
      : "The user currently has no text written.";
    const updatedFirstMessageContent = (userPrompt && userPrompt !== '[]')
      ? `Information to keep in mind about the user's text: ${userPrompt}.\n\n${firstMessageContent}`
      : firstMessageContent;
  
    return [
      { role: 'system', content: updatedFirstMessageContent },
      {
        role: 'system',
        content:
          "Your job is to elevate the user's writing by providing feedback on their text. You will respond with two things: a base chat text for solely conversational purposes, and a list of anchored comments for any actual suggested changes. If the user's query does not require you to provide comments, you can leave the comments list empty. If you do choose to provide comments, there are 5 types of comments you can give. 1. 'REPLACE': replace the 'anchor' field with the 'text' field, 2. 'ADD_BEFORE': add the 'text' field before the text in the 'anchor' field, 3. 'ADD_AFTER': add the 'text' field after the text in the 'anchor' field, 4. 'REMOVE': delete the text in the 'anchor' field, 5. 'QUESTION': ask a question about the text in the 'anchor' field. For types 'REPLACE', 'ADD_BEFORE', and 'ADD_AFTER', ensure the text makes COMPLETE SENSE after the change.",
      },
    ];
  };

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
      const response = await fetch(process.env.NEXT_PUBLIC_HEROKU_URL, {
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
    setChatHistory(initialChatHistory(editorContent, JSON.stringify(userPrompt)));
    clearStorage();
  }

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
              {msg.content.comments
                .filter(comment => ['REPLACE', 'ADD_BEFORE', 'ADD_AFTER', 'REMOVE', 'QUESTION,'].includes(comment.type))
                .map((comment) => {
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
                      onOpenThread={onOpenThread}
                      isHovered={hoveredSuggestion === comment && hoveredSuggestion.id === comment.id}
                      editorContent={editorContent}
                      isThreadView={false}
                    />
                  );
              })}
            </div>
          )}
        </>
      );
    }
    else {
      return(
        <div className={`chat-bubble ${msg.role}-message`}>{msg.content}</div>
      );
    }
  };

  return (
    <div className="w-1/4 bg-white p-4 border-r border-gray-300 flex flex-col shrink-0">
      <div className="flex mb-4 justify-between items-center no-select">
        <div className="flex items-center">
          <h2 className="text-xl font-bold mr-4">Chat</h2>
          <button onClick={clearChat}>
            <img src={clearIcon} alt="Clear Chat" />
          </button>
        </div>
        <button onClick={openSettings}>
          <img src={settingsIcon} alt="Settings" />
        </button>
      </div>
      <div ref={messageContainerRef} className="flex-grow overflow-y-auto" id="message-container">
      {chatHistory.map((msg, index) => (
        <div key={`${msg.role}-${index}`}>{renderMessage(msg)}</div>
      ))}
      </div>
      <div className="mt-4">
        <input
          type="text"
          id="chat-input"
          className="w-full border border-gray-300 p-2 no-select"
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