import React, { useState } from 'react';
import type { ConversationItem } from '../api/chat.api';

interface HistoryItemProps {
  conversation: ConversationItem;
  isPinned: boolean;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onClick: (id: string) => void;
}

export function HistoryItem({ conversation, isPinned, onPin, onUnpin, onClick }: HistoryItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handlePinAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned) {
      onUnpin(conversation.id);
    } else {
      onPin(conversation.id);
    }
    setShowMenu(false);
  };

  // Close menu on click outside could be handled, but simple toggle for now
  const handleMouseLeave = () => {
    setShowMenu(false);
  };

  // Format date nicely
  const dateStr = new Date(conversation.created_at).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div 
      onClick={() => onClick(conversation.id)}
      onMouseLeave={handleMouseLeave}
      className="bg-surface rounded-lg p-stack-md hover:-translate-y-1 transition-transform cursor-pointer group shadow-sm border border-outline-variant/10 relative"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
          {isPinned && <span className="material-symbols-outlined text-[16px] text-primary">push_pin</span>}
          {dateStr}
        </span>
        
        <div className="relative">
          <button 
            onClick={handleMenuClick}
            className="p-1 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[18px]">more_vert</span>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-container-highest rounded-md shadow-lg py-1 z-50 border border-outline-variant/20">
              <button 
                onClick={handlePinAction}
                className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-high flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPinned ? 'do_not_disturb_on' : 'push_pin'}
                </span>
                {isPinned ? 'Unpin from Dashboard' : 'Pin to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
      <h4 className="font-body-md text-body-md text-on-surface font-medium mb-1 line-clamp-1 pr-4">{conversation.title}</h4>
      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
        {conversation.last_message || 'Revisit your previous conversation context.'}
      </p>
    </div>
  );
}
