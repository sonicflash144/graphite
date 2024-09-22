import React from 'react';
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

function Suggestion({ suggestion, status, onHover, onLeave, onAccept, onDismiss, onOpenThread, isHovered, editorContent, isThreadView }) {

  const { type, anchor, text } = suggestion;
  const { icon, title } = type === 'THREAD-STARTER' ? { icon: null, title: null } : suggestionTypeMap[type];
  const greyStyle = { color: 'grey' };
  const blackStyle = { color: 'black', fontWeight: 'bold' };
  const italicStyle = { fontWeight: 'bold', fontStyle: 'italic' };
  const isAnchorPresent = editorContent.includes(suggestion.anchor);

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
      case 'THREAD-STARTER':
        return <blockquote style={greyStyle}>{anchor}</blockquote>;
      default:
        return null;
    }
  };

  const divStyle = {
    backgroundColor: type === 'THREAD-STARTER' ? '#f4e7fe' : '#e7f0fe',
    borderRadius: '1rem',
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    gap: '0.5rem',
    margin: '0.5rem 0',
  };

  const handleAccept = () => {
    onAccept(suggestion);
  };

  const handleDismiss = () => {
    onDismiss(suggestion);
  };

  const handleOpenThread = () => {
    onOpenThread(suggestion);
  };

  return (
    <div
      style={divStyle}
      onMouseEnter={isAnchorPresent && status == null ? () => onHover(suggestion) : null}      
      onMouseLeave={status == null ? onLeave : null}
      className={isHovered ? 'hovered-suggestion' : ''}
    >
      {type !== 'THREAD-STARTER' && (
        <span className="text-gray-500 font-light flex items-center justify-between w-full h-6">
          <div className="no-select flex items-center">
            <img src={icon} alt={title} className="icon-class mr-1" />
            {title}
            {status && (
              <span className={`text-white rounded-full px-2 ml-2 ${status === 'accepted' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                {status === 'accepted' ? 'Accepted' : 'Dismissed'}
              </span>
            )}
          </div>
          {!isThreadView && isHovered && (
            <button className="ml-auto bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded-full flex items-center no-select" onClick={handleOpenThread}>
              <img src={threadIcon} alt={title} className="icon-class ml-1" />
            </button>
          )}
        </span>
      )}
      <span className="text-left ml-1">
        {renderSuggestionContent()}
      </span>
      {type !== 'THREAD-STARTER' && (
        <div className="no-select flex items-center">
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
      )}
    </div>
  );
}

export default Suggestion;