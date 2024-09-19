// src/App.js
import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import TextEditor from './components/TextEditor';
import CommentThread from './components/CommentThread';

function App() {
  const [editorContent, setEditorContent] = useState('');

  // Load content from local storage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem('textEditorContent');
    if (savedContent) {
      setEditorContent(savedContent);
    }
  }, []);

  const handleEditorChange = (content) => {
    setEditorContent(content);
    localStorage.setItem('textEditorContent', content);
  };

  return (
    <div className="bg-gray-100 h-screen flex">
      <Chat editorContent={editorContent} />
      <TextEditor content={editorContent} onContentChange={handleEditorChange} />
      <CommentThread />
    </div>
  );
}

export default App;
