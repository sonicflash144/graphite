import React, { useState, useEffect, useRef } from 'react';
import closeIcon from './icons/close.svg';

export default function Tags({ tags, onRemoveTag, onAddTag }) {
  const [newTag, setNewTag] = useState('');
  const [isNewTagAdded, setIsNewTagAdded] = useState(false);
  const containerRef = useRef(null);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
      setIsNewTagAdded(true);
    }
  };

  useEffect(() => {
    if (isNewTagAdded && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setIsNewTagAdded(false);
    }
  }, [tags, isNewTagAdded]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="overflow-y-auto max-h-72 p-2" ref={containerRef}>
      <div className="flex flex-wrap -ml-1 mb-2">
        {tags.map((tag, i) => (
          <span className="bg-blue-100 p-2 rounded-xl font-medium m-1 flex gap-2 items-center" key={i} style={{ wordBreak: 'break-word' }}>
            <span className="flex-grow flex-shrink w-[calc(100%-16px)]">
              {tag}
            </span>
            <button className="flex-grow-0 flex-shrink-0 w-4" onClick={() => onRemoveTag(tag)}>
              <img src={closeIcon} alt="Close" className="icon-class" />
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleAddTag} className="flex items-center">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="border p-2 rounded-[5px] w-full"
          placeholder="Ex. A fantasy story set in the 1600s"
        />
      </form>
    </div>
  );
}