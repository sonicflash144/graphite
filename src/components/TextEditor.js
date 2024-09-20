// src/components/TextEditor.js
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { createEditor, Editor, Transforms, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import isHotkey from 'is-hotkey';

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
}

function TextEditor({ content, onContentChange }) {
  const editor = useMemo(
    () => withComments(withHistory(withReact(createEditor()))),
    []
  );

  // Load initial value from localStorage or use default initialValue
  const initialValue = JSON.parse(localStorage.getItem('content')) || [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ];

  const [value, setValue] = useState(initialValue);
  const [comments, setComments] = useState([]);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedRange, setSelectedRange] = useState(null);

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  const addComment = () => {
    const commentId = Date.now();
    const comment = {
      id: commentId,
      text: commentText,
      replies: [],
      range: selectedRange,
    };
    setComments([...comments, comment]);
    Transforms.select(editor, selectedRange);
    Editor.addMark(editor, 'comment', commentId);
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
    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey]
        toggleMark(editor, mark)
      }
    }
  };

  useEffect(() => {
    // Save content to localStorage whenever it changes
    localStorage.setItem('content', JSON.stringify(value));
  }, [value]);

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
            top: '50%',
            right: '-220px',
            width: '200px',
            backgroundColor: 'white',
            border: '1px solid gray',
            padding: '10px',
          }}
        >
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="w-full h-20 border border-gray-300 p-2 rounded mb-2 resize-none"
          />
          <button
            onClick={addComment}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Comment
          </button>
        </div>
      )}
      {comments.map((comment) => (
        <CommentThread key={comment.id} comment={comment} editor={editor} />
      ))}
    </div>
  );
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.comment) {
    return (
      <span
        {...attributes}
        style={{ backgroundColor: 'yellow' }}
        data-comment-id={leaf.comment}
      >
        {children}
      </span>
    );
  }
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  return <span {...attributes}>{children}</span>;
};

function withComments(editor) {
  const { isInline } = editor;

  editor.isInline = (element) =>
    element.type === 'comment' ? true : isInline(element);

  return editor;
}

function CommentThread({ comment, editor }) {
  const [replyText, setReplyText] = useState('');
  const [position, setPosition] = useState({ top: 0 });

  useEffect(() => {
    const domRange = ReactEditor.toDOMRange(editor, comment.range);
    const rect = domRange.getBoundingClientRect();
    const containerRect = document
      .getElementById('editor-container')
      .getBoundingClientRect();
    setPosition({ top: rect.top - containerRect.top + rect.height / 2 });
  }, [editor, comment.range]);

  const addReply = () => {
    comment.replies.push(replyText);
    setReplyText('');
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        right: '-220px',
        width: '200px',
        backgroundColor: 'white',
        border: '1px solid gray',
        padding: '10px',
      }}
    >
      <p className="font-semibold">{comment.text}</p>
      {comment.replies.map((reply, index) => (
        <p key={index} className="ml-2 text-sm">
          {reply}
        </p>
      ))}
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Reply..."
        className="w-full h-16 border border-gray-300 p-2 rounded mb-2 mt-2"
      />
      <button
        onClick={addReply}
        className="bg-green-500 text-white px-3 py-1 rounded"
      >
        Add Reply
      </button>
    </div>
  );
}

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor)
  return marks ? marks[format] === true : false
}

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export default TextEditor;