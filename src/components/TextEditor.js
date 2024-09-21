// src/components/TextEditor.js
import CheckIcon from './check.svg';
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Text, createEditor, Editor, Transforms, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { handleHotkeys } from './formatting';

const initialValue = JSON.parse(localStorage.getItem('content')) || [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];
const initialComments = JSON.parse(localStorage.getItem('comments')) || [];

function TextEditor({ content, onContentChange }) {
  const editor = useMemo(
    () => withComments(withHistory(withReact(createEditor()))),
    []
  );

  const [value, setValue] = useState(initialValue);
  const [comments, setComments] = useState(initialComments);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedRange, setSelectedRange] = useState(null);
  const [commentBoxPosition, setCommentBoxPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const commentBoxRef = useRef(null);
  const [activeCommentId, setActiveCommentId] = useState(null);

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const addComment = () => {
    const commentId = Date.now();
    const comment = {
      id: commentId,
      text: commentText,
      replies: [],
      range: selectedRange,
    };
    const newComments = [...comments, comment];
    setComments(newComments);
    localStorage.setItem('comments', JSON.stringify(newComments));
    
    // Select the current range and apply the comment mark
    Transforms.select(editor, selectedRange);
    Editor.addMark(editor, 'comment', commentId);
    
    // Unset the 'comment' mark after the current selection
    Transforms.collapse(editor, { edge: 'end' });
    Editor.removeMark(editor, 'comment');
    
    setShowCommentBox(false);
    setCommentText('');
  };
  

  const cancelComment = () => {
    setShowCommentBox(false);
    setCommentText('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      const { selection } = editor;
      if (selection && !Range.isCollapsed(selection)) {
        setSelectedRange(selection);
        setShowCommentBox(true);
      }
    }
    handleHotkeys(event, editor);
  };

  const resolveComment = (commentId) => {
    // Remove the comment from the state
    const newComments = comments.filter(comment => comment.id !== commentId);
    setComments(newComments);
    
    // Update localStorage
    localStorage.setItem('comments', JSON.stringify(newComments));
    
    // Remove the comment mark from the text
    Editor.withoutNormalizing(editor, () => {
      for (const [node, path] of Editor.nodes(editor, {
        at: [],
        match: n => Text.isText(n) && n.comment === commentId,
      })) {
        Transforms.setNodes(
          editor,
          { comment: undefined },
          { at: path }
        );
      }
    });
  };

  useEffect(() => {
    // Save content to localStorage whenever it changes
    localStorage.setItem('content', JSON.stringify(value));
  }, [value]);

  useEffect(() => {
    if (showCommentBox && selectedRange) {
      const domRange = ReactEditor.toDOMRange(editor, selectedRange);
      const rect = domRange.getBoundingClientRect();
      const containerRect = document
        .getElementById('editor-container')
        .getBoundingClientRect();
      setCommentBoxPosition(rect.top - containerRect.top + window.scrollY);
    }
  }, [showCommentBox, selectedRange, editor]);

  useEffect(() => {
    if (showCommentBox && commentBoxRef.current) {
      commentBoxRef.current.focus();
    }
  }, [showCommentBox]);

  return (
    <div
      className="w-1/2 bg-white p-4 border-r border-gray-300 relative"
      id="editor-container"
    >
      <h2 className="text-xl font-bold mb-4">Text Editor</h2>
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(newValue) => {
          setValue(newValue);
          const content = JSON.stringify(newValue);
          onContentChange(content);
        
          // Get the current selection
          const { selection } = editor;
          if (selection) {
            const [match] = Editor.nodes(editor, {
              at: selection,
              match: n => n.comment !== undefined,
              mode: 'lowest',
            });
            if (match) {
              const [node] = match;
              setActiveCommentId(node.comment);
            } else {
              setActiveCommentId(null);
            }
          } else {
            setActiveCommentId(null);
          }
        }}
        
      >
        <Editable
          className="main-textarea"
          renderLeaf={renderLeaf}
          placeholder="Start typing here..."
          onKeyDown={handleKeyDown}
        />
      </Slate>
      {showCommentBox && (
        <div
          style={{
            position: 'absolute',
            top: commentBoxPosition,
            right: '-270px',
            width: '250px',
            backgroundColor: 'white',
            border: '1px solid lightgray',
            borderRadius: '5px',
            padding: '10px',
            boxShadow: isFocused ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
          }}
        >
          <textarea
            ref={commentBoxRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              if (!commentText.trim()) {
                cancelComment();
              }
            }}
            placeholder="Add a comment..."
            className="w-full h-20 border border-gray-300 p-2 rounded mb-2 resize-none"
          />
          <button
            onClick={cancelComment}
            className="text-black px-4 py-2 ml-2"
          >
            Cancel
          </button>
          <button
            onClick={addComment}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Comment
          </button>
        </div>
      )}
      {comments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          editor={editor}
          resolveComment={resolveComment}
          isActive={activeCommentId === comment.id}
          setActiveCommentId={setActiveCommentId}
        />
      ))}
    </div>
  );
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.comment) {
    return (
      <span
        {...attributes}
        style={{ backgroundColor: 'red' }}
        data-comment-id={leaf.comment}
      >
        {children}
      </span>
    );
  }

  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  
  // Render children without formatting if no comment exists
  return <span {...attributes}>{children}</span>;
};

function withComments(editor) {
  const { isInline, insertText, insertBreak } = editor;

  editor.isInline = (element) =>
    element.type === 'comment' ? true : isInline(element);

  editor.insertText = (text) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const marks = Editor.marks(editor);
      if (marks && marks.comment !== undefined) {
        Editor.removeMark(editor, 'comment');
      }
    }
    insertText(text);
  };

  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection)) {
      const marks = Editor.marks(editor);
      if (marks && marks.comment !== undefined) {
        Editor.removeMark(editor, 'comment');
      }
    }
    insertBreak();
  };

  return editor;
}

function CommentThread({ comment, editor, resolveComment, isActive, setActiveCommentId }) {
  const [replyText, setReplyText] = useState('');
  const [position, setPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const replyTextareaRef = useRef(null);

  useEffect(() => {
    const domRange = ReactEditor.toDOMRange(editor, comment.range);
    const rect = domRange.getBoundingClientRect();
    const containerRect = document
      .getElementById('editor-container')
      .getBoundingClientRect();
    setPosition(rect.top - containerRect.top + window.scrollY);
  }, [editor, comment.range]);

  useEffect(() => {
    if (isActive && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [isActive]);

  const addReply = () => {
    comment.replies.push(replyText);
    setReplyText('');
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: position,
        right: '-270px',
        width: '250px',
        backgroundColor: 'white',
        border: '1px solid lightgray',
        borderRadius: '5px',
        padding: '10px',
        boxShadow: isFocused ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none',
      }}
      onClick={() => setActiveCommentId(comment.id)}
    >
      <button
        onClick={() => resolveComment(comment.id)}
        style={{
          position: 'absolute',
          top: '0px',
          right: '0px',
          color: 'blue',
        }}
        className="px-4 py-2"
      >
        <img src={CheckIcon} alt="Resolve" />
      </button>
      <p>{comment.text}</p>
      {comment.replies.map((reply, index) => (
        <p key={index} className="ml-2 text-sm">
          {reply}
        </p>
      ))}
      {isActive && (
        <>
          <textarea
            ref={replyTextareaRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add a reply..."
            className="w-full h-16 border border-gray-300 p-2 rounded mb-2 mt-2 resize-none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button
            onClick={addReply}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            Reply
          </button>
        </>
      )}
    </div>
  );
}

export default TextEditor;