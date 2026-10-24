import React from 'react';
import { soundEffects } from '../utils/soundEffects';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  FolderPlus,
  Copy,
  Layers,
  X
} from 'lucide-react';

interface AlignmentBarProps {
  selectedCount: number;
  onAlign: (
    type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV'
  ) => void;
  onGroupIntoFrame: () => void;
  onDuplicateSelected?: () => void;
  onClearSelection: () => void;
}

export const AlignmentBar: React.FC<AlignmentBarProps> = ({
  selectedCount,
  onAlign,
  onGroupIntoFrame,
  onDuplicateSelected,
  onClearSelection
}) => {
  if (selectedCount < 2) return null;

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-[#1e1e24] border border-[#00a2ff]/40 rounded-lg shadow-2xl px-3 py-1.5 flex items-center space-x-2 text-xs text-white backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="flex items-center space-x-1.5 pr-2 border-r border-[#383842]">
        <Layers className="w-3.5 h-3.5 text-[#00a2ff]" />
        <span className="font-semibold text-[11px] text-[#00a2ff]">
          {selectedCount} Selected
        </span>
      </div>

      {/* Horizontal Alignment */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('left');
          }}
          title="Align Left"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('center');
          }}
          title="Align Horizontal Center"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('right');
          }}
          title="Align Right"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-[#383842]" />

      {/* Vertical Alignment */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('top');
          }}
          title="Align Top"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('middle');
          }}
          title="Align Vertical Middle"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('bottom');
          }}
          title="Align Bottom"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-[#383842]" />

      {/* Distribution */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('distributeH');
          }}
          title="Distribute Horizontally"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignHorizontalDistributeCenter className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            soundEffects.play('snap');
            onAlign('distributeV');
          }}
          title="Distribute Vertically"
          className="p-1.5 rounded hover:bg-[#2d2d38] text-gray-300 hover:text-white transition"
        >
          <AlignVerticalDistributeCenter className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-[#383842]" />

      {/* Duplicate Selected Button */}
      {onDuplicateSelected && (
        <button
          onClick={() => {
            soundEffects.play('click');
            onDuplicateSelected();
          }}
          title="Duplicate Selected Elements (Ctrl+D)"
          className="px-2 py-1 bg-[#2d2d38] hover:bg-[#3a3a46] border border-[#484856] rounded text-gray-200 hover:text-white flex items-center space-x-1 text-[11px] font-semibold transition shadow-xs"
        >
          <Copy className="w-3 h-3 text-[#00a2ff]" />
          <span>Duplicate (Ctrl+D)</span>
        </button>
      )}

      {/* Group into Frame Button */}
      <button
        onClick={() => {
          soundEffects.play('group');
          onGroupIntoFrame();
        }}
        title="Group into Frame (Ctrl+G)"
        className="px-2 py-1 bg-[#007acc] hover:bg-[#0098ff] rounded text-white flex items-center space-x-1 text-[11px] font-semibold transition shadow-xs"
      >
        <FolderPlus className="w-3 h-3" />
        <span>Group (Ctrl+G)</span>
      </button>

      {/* Deselect */}
      <button
        onClick={() => {
          soundEffects.play('click');
          onClearSelection();
        }}
        title="Clear Selection"
        className="p-1 rounded hover:bg-[#2d2d38] text-gray-400 hover:text-white transition ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
