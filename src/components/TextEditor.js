import React, { useEffect, useRef, useCallback, useState } from 'react';
import threadIcon from './icons/thread.svg';

function TextEditor({ content, onContentChange, previewSuggestion, onOpenThread }) {
  const markRef = useRef(null);
  const editorRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const handleContentChange = (e) => {
    onContentChange(e.target.value);
  };

  const updateCounts = (text) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const handleTextSelection = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && editorRef.current.contains(selection.anchorNode)) {
        setSelectedText(selectedText);
        updateCounts(selectedText);
      } else {
        setSelectedText('');
        updateCounts(content);
      }
    }, 0);
  }, [content]);

  useEffect(() => {
    window.addEventListener('mouseup', handleTextSelection);
    updateCounts(content);
    return () => {
      window.removeEventListener('mouseup', handleTextSelection);
    };
  }, [handleTextSelection, content]);

  const renderTextWithHighlight = useCallback((mainText, activeChange) => {
    const anchorPosition = mainText.indexOf(activeChange.anchor);
    if (activeChange.type === 'ADD_BEFORE' && anchorPosition !== -1) {
      const beforeAnchor = mainText.substring(0, anchorPosition);
      const afterAnchor = mainText.substring(anchorPosition);

      return (
        <>
          {beforeAnchor}
          <mark
            className="bg-[#D3E2FD] text-[#0957D0] p-1 rounded font-medium whitespace-pre-line"
            ref={markRef}
          >
            {activeChange.text}
          </mark>
          {afterAnchor}
        </>
      );
    } else if (activeChange.type === 'ADD_AFTER' && anchorPosition !== -1) {
      const beforeAnchor = mainText.substring(0, anchorPosition + activeChange.anchor.length);
      const afterAnchor = mainText.substring(anchorPosition + activeChange.anchor.length);

      return (
        <>
          {beforeAnchor}
          <mark
            className="bg-[#D3E2FD] text-[#0957D0] p-1 rounded font-medium whitespace-pre-line"
            ref={markRef}
          >
            {activeChange.text}
          </mark>
          {afterAnchor}
        </>
      );
    } else if (activeChange.type === 'REMOVE' && anchorPosition !== -1) {
      const beforeAnchor = mainText.substring(0, anchorPosition);
      const afterAnchor = mainText.substring(anchorPosition + activeChange.anchor.length);

      return (
        <>
          {beforeAnchor}
          <mark className="bg-[#ebebeb] p-1 rounded font-medium whitespace-pre-line" ref={markRef}>
            <s className="text-[#A6A6A6] whitespace-pre-line">
              {activeChange.anchor}
            </s>
          </mark>
          {afterAnchor}
        </>
      );
    } else if (activeChange.type === 'REPLACE' && anchorPosition !== -1) {

      const beforeAnchor = mainText.substring(0, anchorPosition);
      const afterAnchor = mainText.substring(anchorPosition + activeChange.anchor.length);

      return (
        <>
          {beforeAnchor}
          <s className="text-[#A6A6A6] bg-[#ebebeb] font-medium whitespace-pre-line">
            {activeChange.anchor}
          </s>{' '}
          <mark
            ref={markRef}
            className="bg-[#D3E2FD] text-[#0957D0] p-1 rounded font-medium whitespace-pre-line"
          >
            {activeChange.text}
          </mark>
          {afterAnchor}
        </>
      );
    } else if ((activeChange.type === 'QUESTION' || activeChange.type === 'THREAD-STARTER') && anchorPosition !== -1) {
      const beforeAnchor = mainText.substring(0, anchorPosition);
      const afterAnchor = mainText.substring(anchorPosition + activeChange.anchor.length);

      return (
        <>
          {beforeAnchor}
          <mark className="bg-[#D3E2FD] p-1 rounded font-medium whitespace-pre-line">
            {activeChange.anchor}
          </mark>
          {afterAnchor}
        </>
      );
    }

    return mainText;
  }, []);

  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView();
    }
  }, [previewSuggestion]);

  return (
    <div className="relative w-1/2" ref={editorRef}>
      <div className="w-full h-[32px] mt-4 mb-2 flex justify-between items-center">
        <div className="p-4 text-sm text-gray-600 no-select">
          {wordCount} words, {charCount} chars
        </div>
        {selectedText.length > 0 && (
          <button
            className="ml-auto mr-2 bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded-full flex items-center no-select"
            onClick={() => {
              setSelectedText('');
              onOpenThread(selectedText);
          }}
          >
            <span>Open Thread</span>
            <img src={threadIcon} alt="Open Thread" className="icon-class ml-1" />
          </button>
        )}
      </div>
      {!previewSuggestion?.type ? (
        <div className="h-[90%]">
          <textarea
            className="w-full h-full resize-none rounded-xl focus:outline-none p-5 px-7 transparent-scrollbar bg-transparent text-[18px]"
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing here..."
          />
        </div>
      ) : (
        <div
          className="w-full h-[90%] resize-none rounded-xl focus:outline-none p-5 px-7 pointer-events-none bg-transparent text-[18px] transparent-scrollbar"
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {renderTextWithHighlight(content, previewSuggestion)}
        </div>
      )}
    </div>
  );
}

export default TextEditor;