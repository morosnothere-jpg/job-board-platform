import React, { useState } from 'react';

// Available avatar options
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

function AvatarSelector({ currentAvatar, onSelect }) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar.id);
    onSelect(avatar.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 transition-colors">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Choose Your Avatar</h2>
      
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => handleSelect(avatar)}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center text-3xl
              ${avatar.color} hover:scale-110 transition-transform
              ${selectedAvatar === avatar.id ? 'ring-4 ring-primary dark:ring-blue-400' : ''}
            `}
            title={`Select ${avatar.emoji} avatar`}
          >
            {avatar.emoji}
          </button>
        ))}
      </div>

      {selectedAvatar && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ✓ Avatar selected! Remember to save your profile to apply changes.
          </p>
        </div>
      )}
    </div>
  );
}

export default AvatarSelector;