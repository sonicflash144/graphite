// src/components/CommentSidebar.js
import React from 'react';

function CommentSidebar({ comments }) {
  return (
    <div className="w-1/2 bg-gray-50 p-4">
      <h2 className="text-xl font-bold mb-4">Comments</h2>
      {comments.length === 0 ? (
        <p className="text-gray-500">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <div key={comment.id} className="mb-4 p-2 border-b">
            <p className="text-sm italic mb-1">"{comment.text}"</p>
            <p>{comment.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default CommentSidebar;
