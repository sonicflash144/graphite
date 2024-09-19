// src/components/Chat.js
import React, { useState, useEffect } from 'react';

function Chat({ editorContent }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setChatHistory(initialChatHistory(editorContent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent]);

  const initialChatHistory = (textContent) => [
    { role: 'system', content: `Here is the user's text:\n\n${textContent}` },
    {
      role: 'system',
      content:
        "Your job is to elevate the user's writing by providing comments on their text. There are 5 types of comments you can give: 1. 'REPLACE': replace the 'anchor' field with the 'text' field, 2. 'ADD_BEFORE': add the 'text' field before the text in the 'anchor' field, 3. 'ADD_AFTER': add the 'text' field after the text in the 'anchor' field, 4. 'REMOVE': delete the 'anchor' field, 5. 'QUESTION': ask a question about the 'anchor' field. For types 'REPLACE', 'ADD_BEFORE', and 'ADD_AFTER', ensure the text makes COMPLETE SENSE after the change.",
    },
  ];

  const handleSendMessage = async () => {
    if (message.trim() === '') return;

    const newChatHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newChatHistory);
    setMessage('');

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
        const aiResponse = JSON.stringify(data);
        setChatHistory((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
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

  return (
    <div className="w-1/4 bg-white p-4 border-r border-gray-300 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Main Chat</h2>
      <div className="flex-grow overflow-y-auto" id="message-container">
        {chatHistory
          .filter((msg) => msg.role !== 'system')
          .map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.role}-message`}>
              {msg.content}
            </div>
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
