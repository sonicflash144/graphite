// src/App.js
import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import TextEditor from './components/TextEditor';
import Thread from './components/Thread';

function App() {
  const [editorContent, setEditorContent] = useState('');
  const [previewSuggestion, setPreviewSuggestion] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [suggestionStatuses, setSuggestionStatuses] = useState([]);

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

  const clearStorage = () => {
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('suggestion_statuses');
    handleCloseThread();
  };

  const applySuggestion = (suggestion) => {
    let newContent = editorContent;
    const { type, anchor, text } = suggestion;
    const anchorIndex = newContent.indexOf(anchor);

    switch (type) {
      case 'REPLACE':
        newContent = newContent.slice(0, anchorIndex) + text + newContent.slice(anchorIndex + anchor.length);
        break;
      case 'ADD_BEFORE':
        newContent = newContent.slice(0, anchorIndex) + text + ' ' + newContent.slice(anchorIndex);
        break;
      case 'ADD_AFTER':
        newContent = newContent.slice(0, anchorIndex + anchor.length) + ' ' + text + newContent.slice(anchorIndex + anchor.length);
        break;
      case 'REMOVE':
        newContent = newContent.slice(0, anchorIndex) + newContent.slice(anchorIndex + anchor.length);
        break;
      case 'QUESTION':
        // For questions, we don't modify the text
        console.log('Question suggestion:', text);
        return;
      default:
        console.error('Unknown suggestion type:', type);
        return;
    }

    setEditorContent(newContent);
    localStorage.setItem('textEditorContent', newContent);
    setPreviewSuggestion(null);
  };

  const handleOpenThread = (suggestion) => {
    setActiveThread(suggestion);
  };

  const handleCloseThread = () => {
    setActiveThread(null);
  };

  const updateSuggestionStatus = (suggestion, status) => {
    let suggestionStatuses = JSON.parse(localStorage.getItem('suggestion_statuses')) || [];
    const index = suggestionStatuses.findIndex(item => item.id === suggestion.id);
  
    if (index !== -1) {
      suggestionStatuses[index].status = status;
    } else {
      suggestionStatuses.push({ id: suggestion.id, status });
    }
    
    localStorage.setItem('suggestion_statuses', JSON.stringify(suggestionStatuses));
    setSuggestionStatuses(suggestionStatuses);
  };

  const handleAcceptSuggestion = (suggestion) => {
    applySuggestion(suggestion);
    updateSuggestionStatus(suggestion, 'accepted');
    if (hoveredSuggestion && hoveredSuggestion.id === suggestion.id) {
      handleSuggestionLeave();
    }
  };

  const handleDismissSuggestion = (suggestion) => {
    updateSuggestionStatus(suggestion, 'dismissed');
    if (hoveredSuggestion && hoveredSuggestion.id === suggestion.id) {
      handleSuggestionLeave();
    }
  };

  const handleSuggestionHover = (suggestion) => {
    setHoveredSuggestion(suggestion);
    setPreviewSuggestion(suggestion);
  };

  const handleSuggestionLeave = () => {
    setHoveredSuggestion(null);
    setPreviewSuggestion(null);
  };

  return (
    <div className="bg-gray-100 h-screen flex">
      <Chat 
        editorContent={editorContent} 
        clearStorage={clearStorage}
        onOpenThread={handleOpenThread}
        onSuggestionHover={handleSuggestionHover}
        onSuggestionLeave={handleSuggestionLeave}
        onApplySuggestion={handleAcceptSuggestion}
        onDismissSuggestion={handleDismissSuggestion}
        hoveredSuggestion={hoveredSuggestion}
        suggestionStatuses={suggestionStatuses}
      />
      <TextEditor 
        onContentChange={handleEditorChange} 
        previewSuggestion={previewSuggestion}
        content={editorContent}
      />
      {activeThread && (
        <Thread
          editorContent={editorContent}
          suggestion={activeThread}
          onClose={handleCloseThread}
          onSuggestionHover={handleSuggestionHover}
          onSuggestionLeave={handleSuggestionLeave}
          onApplySuggestion={handleAcceptSuggestion}
          onDismissSuggestion={handleDismissSuggestion}
          hoveredSuggestion={hoveredSuggestion}
          suggestionStatuses={suggestionStatuses}
        />
      )}
    </div>
  );
}

export default App;