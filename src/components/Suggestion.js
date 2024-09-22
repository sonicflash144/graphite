import React, { useState, useEffect, useCallback } from 'react';
import replaceIcon from './icons/replace.svg';
import addIcon from './icons/add.svg';
import deleteIcon from './icons/delete.svg';
import questionIcon from './icons/question.svg';
import threadIcon from './icons/thread.svg';
import alertIcon from './icons/alert.svg';
import '../styles.css';

const suggestionTypeMap = {
  REPLACE: {
    icon: replaceIcon,
    title: 'REPLACE',
  },
  ADD_BEFORE: {
    icon: addIcon,
    title: 'ADD',
  },
  ADD_AFTER: {
    icon: addIcon,
    title: 'ADD',
  },
  REMOVE: {
    icon: deleteIcon,
    title: 'DELETE',
  },
  QUESTION: {
    icon: questionIcon,
    title: 'QUESTION',
  },
};

function Suggestion({ suggestion, suggestionStatuses, onHover, onLeave, onAccept, onDismiss, onOpenThread, isHovered, editorContent, isThreadView }) {
  const [status, setStatus] = useState(null);
  const { type, anchor, text } = suggestion;
  const { icon, title } = suggestionTypeMap[type];

  const greyStyle = { color: 'grey' };
  const blackStyle = { color: 'black', fontWeight: 'bold' };
  const italicStyle = { fontWeight: 'bold', fontStyle: 'italic' };
  const isAnchorPresent = editorContent.includes(suggestion.anchor);

  const getSuggestionStatus = useCallback((suggestionId) => {
    const _suggestion = suggestionStatuses.find(item => item.id === suggestionId);
    return _suggestion ? _suggestion.status : null;
  }, [suggestionStatuses]);

  useEffect(() => {
    setStatus(getSuggestionStatus(suggestion.id));
  }, [suggestionStatuses, suggestion, getSuggestionStatus]);

  const renderSuggestionContent = () => {
    switch (type) {
      case 'REPLACE':
        return (
          <>
            <s style={greyStyle}>{anchor}</s>{' '}
            <span style={blackStyle}>{text}</span>
          </>
        );
      case 'ADD_BEFORE':
        return (
          <>
            <span style={blackStyle}>{text}</span>{' '}
            <span style={greyStyle}>{anchor}</span>
          </>
        );
      case 'ADD_AFTER':
        return (
          <>
            <span style={greyStyle}>{anchor}</span>{' '}
            <span style={blackStyle}>{text}</span>
          </>
        );
      case 'REMOVE':
        return <s style={greyStyle}>{anchor}</s>;
      case 'QUESTION':
        return (
          <>
            <blockquote style={greyStyle}>{anchor}</blockquote>
            <br />
            <span style={italicStyle}>{text}</span>
          </>
        );
      default:
        return null;
    }
  };

  const divStyle = {
    backgroundColor: type === 'QUESTION' ? '#f4e7fe' : '#e7f0fe',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    gap: '0.5rem',
    margin: '0.5rem 0',
  };

  const handleAccept = () => {
    setStatus('accepted');
    onAccept(suggestion);
  };

  const handleDismiss = () => {
    setStatus('dismissed');
    onDismiss(suggestion);
  };

  const handleOpenThread = () => {
    onOpenThread(suggestion);
  };

  return (
    <div
      style={divStyle}
      onMouseEnter={status == null ? () => onHover(suggestion) : null}
      onMouseLeave={status == null ? onLeave : null}
      className={isHovered ? 'hovered-suggestion' : ''}
    >
      <span className="text-dim font-light flex items-center justify-between" style={{ color: 'grey', width: '100%', height: '24px' }}>
        <div className="flex items-center">
          <img src={icon} alt={title} className="icon-class mr-1" />
          {title}
          {status && (
            <span className={`text-white rounded-full px-2 ml-2 ${status === 'accepted' ? 'bg-blue-500' : 'bg-gray-400'}`}>
              {status === 'accepted' ? 'Accepted' : 'Dismissed'}
            </span>
          )}
        </div>
        {!isThreadView && isHovered && (
          <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded-full flex items-center" onClick={handleOpenThread}>
            <span>Open Thread</span>
            <img src={threadIcon} alt={title} className="icon-class ml-1" />
          </button>
        )}
      </span>
      <span className="text-left ml-1">
        {renderSuggestionContent()}
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!status && (
          <>
            {type !== 'QUESTION' && (
              <>
                {isAnchorPresent ? (
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white rounded-full py-1 px-3 mr-2"
                    onClick={handleAccept}
                  >
                    Accept
                  </button>
                ) : (
                  <button className="bg-gray-400 text-white rounded-full py-1 px-3 mr-2 cursor-not-allowed flex items-center" disabled={true}>
                    <img src={alertIcon} alt="Alert Icon" className="icon-class mr-1" />
                    <span>Missing Anchor</span>
                  </button>
                )}
              </>
            )}
            <button 
              className="text-[#878787]"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Suggestion;