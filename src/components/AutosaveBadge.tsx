import React, { useState, useEffect, useRef } from 'react';
import {
  CloudCheck,
  RotateCw,
  HardDrive,
  Trash2,
  Check,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatTimeAgo } from '../utils/autosaveCache';

interface AutosaveBadgeProps {
  isSaving: boolean;
  lastSavedTimestamp: number | null;
  elementCount: number;
  autosaveEnabled: boolean;
  onToggleAutosave: (enabled: boolean) => void;
  onRestoreCache: () => void;
  onClearCache: () => void;
  hasCachedData: boolean;
}

export const AutosaveBadge: React.FC<AutosaveBadgeProps> = ({
  isSaving,
  lastSavedTimestamp,
  elementCount,
  autosaveEnabled,
  onToggleAutosave,
  onRestoreCache,
  onClearCache,
  hasCachedData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeAgoText, setTimeAgoText] = useState('Just now');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update time ago text every 3 seconds
  useEffect(() => {
    if (!lastSavedTimestamp) {
      setTimeAgoText('Not cached yet');
      return;
    }
    const update = () => {
      setTimeAgoText(formatTimeAgo(lastSavedTimestamp));
    };
    update();
    const timer = setInterval(update, 3000);
    return () => clearInterval(timer);
  }, [lastSavedTimestamp]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        title="Computer Autosave Status (Click to view backup options)"
        className={`flex items-center space-x-1.5 px-2 py-1 rounded text-xs transition border cursor-pointer ${
          !autosaveEnabled
            ? 'bg-[#2a2a2d] text-gray-400 border-[#3e3e42] hover:text-gray-200'
            : isSaving
            ? 'bg-[#007acc]/15 text-[#00a2ff] border-[#007acc]/40 shadow-xs'
            : lastSavedTimestamp
            ? 'bg-[#107c41]/15 text-emerald-400 border-emerald-500/30 hover:bg-[#107c41]/25 hover:border-emerald-500/50'
            : 'bg-[#252526] text-gray-400 border-[#3c3c3c] hover:text-gray-300'
        }`}
      >
        {isSaving ? (
          <RotateCw className="w-3.5 h-3.5 text-[#00a2ff] animate-spin" />
        ) : (
          <HardDrive
            className={`w-3.5 h-3.5 ${
              !autosaveEnabled
                ? 'text-gray-500'
                : lastSavedTimestamp
                ? 'text-emerald-400'
                : 'text-gray-400'
            }`}
          />
        )}

        <div className="flex items-center space-x-1">
          <span className="font-medium hidden md:inline">
            {!autosaveEnabled ? 'Autosave Off' : isSaving ? 'Saving...' : 'Autosaved'}
          </span>
          {lastSavedTimestamp && autosaveEnabled && !isSaving && (
            <span className="text-[10px] text-emerald-300/80 font-mono hidden xl:inline">
              ({timeAgoText})
            </span>
          )}
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#252526] border border-[#3e3e42] rounded-lg shadow-2xl p-3 z-50 text-xs text-gray-200">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#3c3c3c]">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white">Local Computer Cache</div>
                <div className="text-[10px] text-gray-400">Auto-recovery protection</div>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-300 font-semibold">
              Live
            </span>
          </div>

          <div className="space-y-2 mb-3 bg-[#1e1e1e] p-2 rounded border border-[#333338]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span>Last Autosaved:</span>
              </span>
              <span className="font-mono text-emerald-400 font-medium">{timeAgoText}</span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-400 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-gray-500" />
                <span>Elements in Cache:</span>
              </span>
              <span className="font-mono text-gray-200">{elementCount} objects</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2e] text-[11px]">
              <span className="text-gray-400">Crash Protection:</span>
              <button
                onClick={() => onToggleAutosave(!autosaveEnabled)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors cursor-pointer ${
                  autosaveEnabled ? 'bg-[#007acc]' : 'bg-gray-600'
                }`}
                title="Toggle local computer autosaving"
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    autosaveEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
            Every edit, drag, modifier, and property change is automatically cached locally on your
            computer. If your browser reloads or crashes, your canvas is restored automatically.
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#3c3c3c]">
            <button
              onClick={() => {
                onRestoreCache();
                setIsOpen(false);
              }}
              disabled={!hasCachedData}
              className="px-2 py-1.5 bg-[#2d2d30] hover:bg-[#37373d] disabled:opacity-40 disabled:pointer-events-none text-sky-400 rounded flex items-center justify-center space-x-1 transition font-medium text-[11px]"
            >
              <RotateCw className="w-3 h-3" />
              <span>Restore Cache</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Clear all autosaved computer cache for this project?')) {
                  onClearCache();
                  setIsOpen(false);
                }
              }}
              disabled={!hasCachedData}
              className="px-2 py-1.5 bg-[#2d2d30] hover:bg-[#3b2525] disabled:opacity-40 disabled:pointer-events-none text-red-400 rounded flex items-center justify-center space-x-1 transition font-medium text-[11px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
