// src/components/TextEditor.js
import React from 'react';

function TextEditor({ content, onContentChange }) {
  return (
    <div className="w-1/2 bg-white p-4 border-r border-gray-300" id="editor-container">
      <h2 className="text-xl font-bold mb-4">Text Editor</h2>
      <textarea
        id="text-editor"
        className="w-full h-[90%] border border-gray-300 p-2 rounded-[5px] resize-none"
        placeholder="Start typing here..."
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
    </div>
  );
}

export default TextEditor;
