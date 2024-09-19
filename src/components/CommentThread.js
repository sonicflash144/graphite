// src/components/CommentThread.js
import React from 'react';

function CommentThread() {
  return (
    <div className="w-1/4 bg-white p-4 overflow-y-auto" id="comment-container">
      <h2 className="text-xl font-bold mb-4">Comment Thread</h2>
      <p>Click on a thread in the text editor to view comments.</p>
    </div>
  );
}

export default CommentThread;
