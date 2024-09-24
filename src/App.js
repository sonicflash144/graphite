import React, { useState, useEffect, useRef } from 'react';
import Chat from './components/Chat';
import TextEditor from './components/TextEditor';
import Thread from './components/Thread';
import Tags from './components/Tags';
import closeIcon from './components/icons/close.svg';

function App() {
  const [editorContent, setEditorContent] = useState('');
  const [previewSuggestion, setPreviewSuggestion] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [suggestionStatuses, setSuggestionStatuses] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tags, setTags] = useState([]);
  const settingsRef = useRef(null);
  const settingsTextAreaRef = useRef(null);

  useEffect(() => {
    if (isSettingsOpen) {
      const handleClickOutside = (event) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target)) {
          closeSettings();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    if (isSettingsOpen && settingsTextAreaRef.current) {
      const textArea = settingsTextAreaRef.current;
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    const savedContent = localStorage.getItem('textEditorContent');
    if (savedContent) {
      setEditorContent(savedContent);
    }
    const savedTags = localStorage.getItem('userTags');
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    }
    const savedSuggestionStatuses = localStorage.getItem('suggestion_statuses');
    if (savedSuggestionStatuses) {
      setSuggestionStatuses(JSON.parse(savedSuggestionStatuses));
    }
    const savedActiveThread = localStorage.getItem('activeThread');
    if (savedActiveThread) {
      setActiveThread(JSON.parse(savedActiveThread));
    }
  }, []);

  const handleEditorChange = (content) => {
    setEditorContent(content);
    localStorage.setItem('textEditorContent', content);
  };

  const handleAddTag = (newTag) => {
    if (newTag.trim() !== '' && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      localStorage.setItem('userTags', JSON.stringify(updatedTags));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    localStorage.setItem('userTags', JSON.stringify(updatedTags));
  };

  const clearStorage = () => {
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('suggestion_statuses');
    localStorage.removeItem('activeThread');
    setSuggestionStatuses([]);
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
      default:
        return;
    }

    setEditorContent(newContent);
    localStorage.setItem('textEditorContent', newContent);
    setPreviewSuggestion(null);
  };

  const handleOpenThread = (suggestion) => {
    localStorage.removeItem('threadHistory');
    setActiveThread(suggestion);
    localStorage.setItem('activeThread', JSON.stringify(suggestion));
  };

  const handleCloseThread = () => {
    localStorage.removeItem('threadHistory');
    setActiveThread(null);
    localStorage.removeItem('activeThread');
  };

  const updateSuggestionStatus = (suggestion, status) => {
    const index = suggestionStatuses.findIndex(item => item.id === suggestion.id);
  
    let updatedStatuses;
    if (index !== -1) {
      updatedStatuses = [...suggestionStatuses];
      updatedStatuses[index] = { ...updatedStatuses[index], status };
    } else {
      updatedStatuses = [...suggestionStatuses, { id: suggestion.id, status }];
    }
  
    setSuggestionStatuses(updatedStatuses);
    localStorage.setItem('suggestion_statuses', JSON.stringify(updatedStatuses));
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

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const clearTags = () => {
    setTags([]);
    localStorage.removeItem('userTags');
  }

  return (
    <div className="bg-gray-100 h-dvh flex">
      <Chat 
        editorContent={editorContent} 
        userPrompt={tags}
        openSettings={openSettings}
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
        onOpenThread={handleOpenThread}
      />
      {activeThread && (
        <Thread
          editorContent={editorContent}
          userPrompt={tags}
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
      {isSettingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div ref={settingsRef} className="bg-white flex flex-col p-4 rounded-[5px] shadow-lg w-[500px] max-h-4/5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">              
              <h2 className="text-xl font-bold mr-4">Edit Memory</h2>
              <button onClick={closeSettings}>
                <img src={closeIcon} alt="Close" />
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-gray-600">What should the AI know about this text?</span>
              <button onClick={clearTags} className="text-red-500">Clear All</button>
            </div>
            <Tags 
              tags={tags} 
              onRemoveTag={handleRemoveTag}
              onAddTag={handleAddTag}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;