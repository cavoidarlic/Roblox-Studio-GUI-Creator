import React from 'react';
import { GuiRootType, RobloxElement } from '../types/roblox';
import {
  Box,
  FilePlus,
  Layers,
  Sparkles,
  Download,
  FolderOpen,
  Upload,
  Code2,
  Percent,
  Ruler,
  Lock,
  Unlock,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Monitor,
  Tag,
  FolderTree,
  Sliders,
  Scale,
  Zap,
  Volume2,
  VolumeX,
  Image as ImageIcon
} from 'lucide-react';
import { AutosaveBadge } from './AutosaveBadge';

interface TopHeaderProps {
  rootType: GuiRootType;
  onSwitchRoot: (type: GuiRootType) => void;
  onNewCanvas?: () => void;
  onSaveFile: () => void;
  onLoadFileTrigger: () => void;
  onLoadScriptTrigger: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onExportImages?: () => void;
  imageCount?: number;
  selectedElement: RobloxElement | null;
  parentElement?: RobloxElement | null;
  onConvertToScale: () => void;
  onConvertToScreenGuiScale?: () => void;
  onConvertToOffset: () => void;
  onToggleAspectRatio: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isExplorerOpen: boolean;
  isPropertiesOpen: boolean;
  onToggleExplorer: () => void;
  onToggleProperties: () => void;
  onOpenCalculator: () => void;
  onOpenAnimations: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  // Autosave & Crash Protection props
  isAutosaving?: boolean;
  lastSavedTimestamp?: number | null;
  elementCount?: number;
  autosaveEnabled?: boolean;
  onToggleAutosave?: (enabled: boolean) => void;
  onRestoreCache?: () => void;
  onClearCache?: () => void;
  hasCachedData?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  rootType,
  onSwitchRoot,
  onNewCanvas,
  onSaveFile,
  onLoadFileTrigger,
  onLoadScriptTrigger = () => {},
  onOpenTemplates,
  onOpenExport,
  onExportImages,
  imageCount = 0,
  selectedElement,
  parentElement,
  onConvertToScale,
  onConvertToScreenGuiScale,
  onConvertToOffset,
  onToggleAspectRatio,
  onDuplicateSelected,
  onDeleteSelected,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isExplorerOpen,
  isPropertiesOpen,
  onToggleExplorer,
  onToggleProperties,
  onOpenCalculator,
  onOpenAnimations,
  isAudioEnabled,
  onToggleAudio,
  isAutosaving = false,
  lastSavedTimestamp = null,
  elementCount = 0,
  autosaveEnabled = true,
  onToggleAutosave = () => {},
  onRestoreCache = () => {},
  onClearCache = () => {},
  hasCachedData = false
}) => {
  const hasAspectLock = !!selectedElement?.modifiers?.UIAspectRatioConstraint;

  return (
    <header className="h-12 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-2 sm:px-3 shrink-0 gap-1.5 sm:gap-2 select-none z-30 overflow-hidden">
      {/* Brand & Root Container Switcher */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        <div className="flex items-center space-x-1.5 text-white font-bold text-sm tracking-wide">
          <div className="w-7 h-7 rounded bg-[#00a2ff] flex items-center justify-center text-black font-extrabold shadow-sm shrink-0">
            <Box className="w-4 h-4 text-white" />
          </div>
          <span className="hidden 2xl:inline font-semibold">Roblox GUI Studio</span>
        </div>

        <div className="h-4 w-px bg-[#3e3e42] hidden sm:block" />

        {/* Root Gui Type Tabs */}
        <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded-md border border-[#3e3e42] text-xs">
          <button
            onClick={() => onSwitchRoot('ScreenGui')}
            aria-label="Switch to ScreenGui 2D view"
            title="ScreenGui (2D Screen)"
            className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
              rootType === 'ScreenGui'
                ? 'bg-[#007acc] text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">ScreenGui</span>
          </button>

          <button
            onClick={() => onSwitchRoot('SurfaceGui')}
            aria-label="Switch to SurfaceGui 3D World view"
            title="SurfaceGui (3D World Part)"
            className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
              rootType === 'SurfaceGui'
                ? 'bg-[#007acc] text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">SurfaceGui</span>
          </button>

          <button
            onClick={() => onSwitchRoot('BillboardGui')}
            aria-label="Switch to BillboardGui 3D Head view"
            title="BillboardGui (3D Floating Tag)"
            className={`px-2 py-1 rounded flex items-center space-x-1 transition ${
              rootType === 'BillboardGui'
                ? 'bg-[#007acc] text-white font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">BillboardGui</span>
          </button>
        </div>

        {/* Panels Visibility Toggles */}
        <div className="flex items-center space-x-0.5 bg-[#1e1e1e] p-0.5 rounded-md border border-[#3e3e42] text-xs">
          <button
            onClick={onToggleExplorer}
            title={isExplorerOpen ? 'Hide Explorer (Dock to side)' : 'Show Explorer on side'}
            className={`px-1.5 py-1 rounded flex items-center space-x-1 transition font-medium ${
              isExplorerOpen
                ? 'bg-[#007acc]/20 text-[#00a2ff] border border-[#007acc]/40 shadow-xs'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-[#00a2ff]" />
            <span className="hidden 2xl:inline">Explorer</span>
          </button>

          <button
            onClick={onToggleProperties}
            title={isPropertiesOpen ? 'Hide Properties (Dock to side)' : 'Show Properties on side'}
            className={`px-1.5 py-1 rounded flex items-center space-x-1 transition font-medium ${
              isPropertiesOpen
                ? 'bg-[#007acc]/20 text-[#00a2ff] border border-[#007acc]/40 shadow-xs'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden 2xl:inline">Properties</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 bg-[#1e1e1e] p-0.5 rounded border border-[#3e3e42]">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2a2d2e] disabled:opacity-30 disabled:pointer-events-none"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2a2d2e] disabled:opacity-30 disabled:pointer-events-none"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Element Quick Utilities */}
      <div className="hidden 2xl:flex items-center space-x-1.5 bg-[#1e1e1e] px-2 py-1 rounded-md border border-[#3e3e42] text-xs shrink-0">
        <span className="text-gray-500 text-[11px] font-mono mr-1">
          {selectedElement ? selectedElement.name : 'No selection'}
        </span>

        <button
          onClick={onConvertToScale}
          disabled={!selectedElement}
          title={
            parentElement
              ? `Convert to Scale (%) relative to parent: ${parentElement.name}`
              : 'Convert Size & Position to Proportional Scale (%)'
          }
          className="px-2 py-0.5 bg-[#252526] hover:bg-[#333338] rounded text-[#00a2ff] border border-[#3e3e42] disabled:opacity-30 flex items-center space-x-1 font-medium transition"
        >
          <Percent className="w-3 h-3" />
          <span>{parentElement ? 'To Scale (Parent)' : 'To Scale'}</span>
        </button>

        {parentElement && onConvertToScreenGuiScale && (
          <button
            onClick={onConvertToScreenGuiScale}
            disabled={!selectedElement}
            title="Convert Size & Position to Scale (%) relative to entire ScreenGui"
            className="px-2 py-0.5 bg-[#252526] hover:bg-[#333338] rounded text-cyan-300 border border-[#3e3e42] disabled:opacity-30 flex items-center space-x-1 font-medium transition"
          >
            <Monitor className="w-3 h-3 text-cyan-400" />
            <span>To Scale (ScreenGui)</span>
          </button>
        )}

        <button
          onClick={onConvertToOffset}
          disabled={!selectedElement}
          title="Convert Size & Position to Fixed Pixels (Offset)"
          className="px-2 py-0.5 bg-[#252526] hover:bg-[#333338] rounded text-gray-300 border border-[#3e3e42] disabled:opacity-30 flex items-center space-x-1 transition"
        >
          <Ruler className="w-3 h-3 text-emerald-400" />
          <span>To Offset</span>
        </button>

        <button
          onClick={onToggleAspectRatio}
          disabled={!selectedElement}
          title={hasAspectLock ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
          className={`px-2 py-0.5 rounded border flex items-center space-x-1 transition ${
            hasAspectLock
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-[#252526] hover:bg-[#333338] text-gray-300 border-[#3e3e42]'
          } disabled:opacity-30`}
        >
          {hasAspectLock ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
          <span>{hasAspectLock ? 'Unlock Ratio' : 'Lock Ratio'}</span>
        </button>

        <div className="h-3 w-px bg-[#3e3e42] mx-0.5" />

        <button
          onClick={onDuplicateSelected}
          disabled={!selectedElement}
          title="Duplicate Element (Ctrl+D)"
          aria-label="Duplicate Element"
          className="p-1 text-gray-400 hover:text-white hover:bg-[#333338] rounded disabled:opacity-30"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={!selectedElement}
          title="Delete Element (Delete)"
          aria-label="Delete Element"
          className="p-1 text-gray-400 hover:text-red-400 hover:bg-[#333338] rounded disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Studio Tool Integrations & Actions */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs shrink-0">
        {/* Ratio & Pixel Calculator Button */}
        <button
          onClick={onOpenCalculator}
          title="Open Ratio & Pixel Calculator"
          className="p-1.5 bg-[#252526] hover:bg-[#333338] text-sky-400 border border-[#3e3e42] hover:border-sky-500/50 rounded-md font-medium flex items-center space-x-1 transition shadow-xs"
        >
          <Scale className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">Calculator</span>
        </button>

        {/* TweenService Animator Button */}
        <button
          onClick={onOpenAnimations}
          title="Open Roblox TweenService Animation Previewer"
          className="p-1.5 bg-[#252526] hover:bg-[#333338] text-purple-400 border border-[#3e3e42] hover:border-purple-500/50 rounded-md font-medium flex items-center space-x-1 transition shadow-xs"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden 2xl:inline">Animations</span>
        </button>

        {/* Roblox UI SFX Audio Toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioEnabled ? 'Mute Roblox UI Audio Effects' : 'Enable Roblox UI Audio Effects'}
          aria-label={isAudioEnabled ? 'Mute Audio' : 'Enable Audio'}
          className={`p-1.5 rounded-md border transition ${
            isAudioEnabled
              ? 'bg-[#252526] text-amber-300 border-[#3e3e42] hover:border-amber-400/50'
              : 'bg-[#252526] text-gray-500 border-[#333338]'
          }`}
        >
          {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-px bg-[#3e3e42]" />

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          title="Load pre-built Roblox GUI templates"
          className="p-1.5 sm:px-2 sm:py-1.5 bg-[#252526] hover:bg-[#333338] text-amber-300 border border-[#3e3e42] hover:border-amber-400/50 rounded-md font-medium flex items-center space-x-1 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Templates</span>
        </button>

        {/* Autosave Status Badge & Recovery Popover */}
        <AutosaveBadge
          isSaving={isAutosaving}
          lastSavedTimestamp={lastSavedTimestamp}
          elementCount={elementCount}
          autosaveEnabled={autosaveEnabled}
          onToggleAutosave={onToggleAutosave}
          onRestoreCache={onRestoreCache}
          onClearCache={onClearCache}
          hasCachedData={hasCachedData}
        />

        {/* Open & Save .rbxgui Group */}
        <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded-md border border-[#3e3e42] shadow-xs">
          {onNewCanvas && (
            <button
              onClick={onNewCanvas}
              title="New Blank Project (Clear Canvas) (Ctrl+N)"
              aria-label="New Blank Project"
              className="p-1.5 sm:px-2 sm:py-1 text-emerald-400 hover:text-white hover:bg-emerald-600/20 rounded flex items-center space-x-1 transition font-medium border border-transparent hover:border-emerald-500/40"
            >
              <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold hidden lg:inline">New</span>
            </button>
          )}

          <button
            onClick={onLoadFileTrigger}
            title="Open / Load .rbxgui Project File (Ctrl+O)"
            aria-label="Open .rbxgui Project File"
            className="p-1.5 sm:px-2 sm:py-1 text-sky-400 hover:text-white hover:bg-[#007acc]/20 rounded flex items-center space-x-1 transition font-medium border border-transparent hover:border-[#007acc]/40"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold hidden lg:inline">Open</span>
          </button>

          <button
            onClick={onSaveFile}
            title="Save Project File (.rbxgui) (Ctrl+S)"
            aria-label="Save Project File (.rbxgui)"
            className="p-1.5 sm:px-2 sm:py-1 text-gray-300 hover:text-white hover:bg-[#2a2d2e] rounded flex items-center space-x-1 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Save</span>
          </button>
        </div>

        {/* Load Luau Script Button */} 
        <button
          onClick={onLoadScriptTrigger}
          title="Load Luau Script (.lua / .luau) (Ctrl+L)"
          aria-label="Load Luau Script"
          className="p-1.5 sm:px-2 sm:py-1 text-amber-400 hover:text-white hover:bg-[#b45309]/20 rounded flex items-center space-x-1 transition font-medium border border-[#3e3e42] hover:border-[#b45309]/40"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold hidden lg:inline">Load Script</span>
        </button>

        {/* Export Images as ZIP Button */}
        {onExportImages && imageCount > 0 && (
          <button
            onClick={onExportImages}
            title={`Export all ${imageCount} Image elements as PNGs in a .zip file`}
            className="p-1.5 sm:px-2 sm:py-1 text-teal-300 hover:text-white hover:bg-teal-600/20 rounded flex items-center space-x-1 transition font-medium border border-[#3e3e42] hover:border-teal-500/50"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold hidden lg:inline">Images ({imageCount})</span>
          </button>
        )}

        {/* Export Luau Script Button */}
        <button
          onClick={onOpenExport}
          title="Export Luau Script for Roblox Studio"
          className="px-2 sm:px-2.5 py-1.5 bg-[#107c41] hover:bg-[#158f4b] text-white rounded-md font-semibold flex items-center space-x-1 shadow transition shrink-0"
        >
          <Code2 className="w-4 h-4 text-emerald-200" />
          <span className="hidden xs:inline">Export</span>
          <span className="hidden md:inline">Luau</span>
        </button>
      </div>
    </header>
  );
};
