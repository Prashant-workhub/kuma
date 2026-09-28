import React, { useState } from 'react';
import { User, Upload, Check } from 'lucide-react';
import { Button } from './Button';

interface UserProfileAvatarPickerProps {
  currentAvatarUrl?: string;
  onSelectAvatar: (url: string) => void;
  userInitial?: string;
}

export function UserProfileAvatarPicker({
  currentAvatarUrl,
  onSelectAvatar,
  userInitial = 'U'
}: UserProfileAvatarPickerProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onSelectAvatar(customUrl.trim());
      setShowInput(false);
      setCustomUrl('');
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-[8px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161B22] shadow-sm">
      <div className="flex items-center gap-4">
        {currentAvatarUrl ? (
          <img
            src={currentAvatarUrl}
            alt="Profile Avatar"
            className="h-16 w-16 rounded-full border-2 border-[#992E9D] object-cover shadow-sm"
          />
        ) : (
          <div className="h-16 w-16 rounded-full border-2 border-[#992E9D] bg-[#992E9D]/10 text-[#992E9D] font-heading font-black text-2xl flex items-center justify-center uppercase shadow-sm">
            {userInitial}
          </div>
        )}

        <div className="space-y-1 min-w-0 flex-1">
          <h4 className="font-heading font-bold text-sm text-[var(--text-primary)] uppercase">
            Profile Photo & Identification
          </h4>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            Display picture used across Capacity Connect reports and certificates.
          </p>
          <div className="pt-1 flex items-center gap-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setShowInput(!showInput)}
              icon={<Upload className="h-3.5 w-3.5" />}
            >
              {showInput ? 'Cancel' : 'Change Image URL'}
            </Button>
            {currentAvatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectAvatar('')}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </div>

      {showInput && (
        <div className="mt-2 p-3 rounded-[6px] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <label className="text-xs font-mono font-bold text-[var(--text-secondary)] uppercase">
            Direct Image URL:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="flex-1 bg-white dark:bg-slate-900 text-xs px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-[var(--text-primary)] focus:outline-none focus:border-[#992E9D]"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleApplyCustomUrl}
              className="bg-[#992E9D] text-white hover:bg-[#832687]"
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
