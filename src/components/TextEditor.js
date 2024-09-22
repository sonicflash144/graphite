import React, { useEffect, useRef, useCallback } from 'react';

function TextEditor({ content, onContentChange, previewSuggestion }) {
  const markRef = useRef(null);

  const handleContentChange = (e) => {
    onContentChange(e.target.value);
  };

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
    } else if (activeChange.type === 'QUESTION' && anchorPosition !== -1) {
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
    <div className="relative w-1/2">
      {!previewSuggestion?.type ? (
        <textarea
          className="w-full h-[95%] resize-none rounded-xl focus:outline-none p-5 text-[18px] px-5 transparent-scrollbar bg-transparent"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing here..."
        />
      ) : (
        <div
          className="w-full h-full resize-none rounded-xl focus:outline-none p-5 px-5 absolute top-0 left-0 overflow-y-auto pointer-events-none z-1 bg-surface text-[18px] transparent-scrollbar"
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