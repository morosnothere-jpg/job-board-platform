import React from 'react';

// Same avatar data as selector
const AVATARS = [
  { id: 'avatar-1', emoji: '😊', color: 'bg-blue-500' },
  { id: 'avatar-2', emoji: '😎', color: 'bg-purple-500' },
  { id: 'avatar-3', emoji: '🤓', color: 'bg-green-500' },
  { id: 'avatar-4', emoji: '😇', color: 'bg-yellow-500' },
  { id: 'avatar-5', emoji: '🥳', color: 'bg-pink-500' },
  { id: 'avatar-6', emoji: '🤠', color: 'bg-red-500' },
  { id: 'avatar-7', emoji: '🧐', color: 'bg-indigo-500' },
  { id: 'avatar-8', emoji: '😴', color: 'bg-teal-500' },
  { id: 'avatar-9', emoji: '🤩', color: 'bg-orange-500' },
  { id: 'avatar-10', emoji: '🥰', color: 'bg-rose-500' },
  { id: 'avatar-11', emoji: '😺', color: 'bg-cyan-500' },
  { id: 'avatar-12', emoji: '🦊', color: 'bg-amber-500' },
  { id: 'avatar-13', emoji: '🐼', color: 'bg-slate-500' },
  { id: 'avatar-14', emoji: '🦁', color: 'bg-lime-500' },
  { id: 'avatar-15', emoji: '🐸', color: 'bg-emerald-500' },
  { id: 'avatar-16', emoji: '🦄', color: 'bg-fuchsia-500' },
];

function AvatarDisplay({ avatarId, size = 'md' }) {
  const avatar = AVATARS.find(a => a.id === avatarId);
  
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  };

  // Default avatar (user icon)
  if (!avatar) {
    return (
      <div className={`${sizes[size]} rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center`}>
        <svg 
          className="w-2/3 h-2/3 text-gray-600 dark:text-gray-300" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${sizes[size]} ${avatar.color} rounded-full flex items-center justify-center shadow-md`}>
      {avatar.emoji}
    </div>
  );
}

export default AvatarDisplay;