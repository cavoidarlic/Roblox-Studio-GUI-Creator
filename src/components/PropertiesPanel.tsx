import React, { useState } from 'react';
import {
  RobloxElement,
  RobloxElementType,
  ModifierType,
  GuiRootType,
  RootProperties
} from '../types/roblox';
import {
  Sliders,
  Type,
  Image as ImageIcon,
  Sparkles,
  Percent,
  Ruler,
  Lock,
  Unlock,
  Trash2,
  Upload,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Palette,
  Check,
  Monitor,
  RefreshCw,
  Bold,
  Maximize,
  Download
} from 'lucide-react';
import { exportSingleImage } from '../utils/imageExporter';
import { ROBLOX_FONTS, getFontDefinition } from '../data/robloxFonts';
import { ROBLOX_BRICK_COLORS, ROBLOX_UI_THEMES, UiColorTheme } from '../data/brickColors';
import { soundEffects } from '../utils/soundEffects';

interface PropertiesPanelProps {
  rootType: GuiRootType;
  rootProperties: RootProperties;
  selectedElement: RobloxElement | null;
  selectedModifierKey: ModifierType | null;
  parentElement?: RobloxElement | null;
  onUpdateElement: (updated: RobloxElement) => void;
  onUpdateRootProperties: (updated: RootProperties) => void;
  onRemoveModifier: (elementId: string, modKey: ModifierType) => void;
  onConvertToScale: () => void;
  onConvertToScreenGuiScale?: () => void;
  onConvertToOffset: () => void;
  onToggleAspectRatio: () => void;
  onConvertType?: (targetType: RobloxElementType) => void;
  onSelectModifierOnly: (modKey: ModifierType | null) => void;
  onClose?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  rootType,
  rootProperties,
  selectedElement,
  selectedModifierKey,
  parentElement,
  onUpdateElement,
  onUpdateRootProperties,
  onRemoveModifier,
  onConvertToScale,
  onConvertToScreenGuiScale,
  onConvertToOffset,
  onToggleAspectRatio,
  onConvertType,
  onSelectModifierOnly,
  onClose
}) => {
  const [propSearch, setPropSearch] = useState('');
  const [isBrickColorOpen, setIsBrickColorOpen] = useState(false);
  const [brickColorSearch, setBrickColorSearch] = useState('');
  const [brickCategory, setBrickCategory] = useState<'All' | 'Greys' | 'Colors' | 'Pastels' | 'Vibrant'>('All');
  const [activeColorTarget, setActiveColorTarget] = useState<'background' | 'text' | 'border' | 'image'>('background');

  // Local image upload helper
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const result = evt.target?.result as string;
      if (result) {
        onUpdateElement({
          ...selectedElement,
          image: result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const hasAspectLock = !!selectedElement?.modifiers?.UIAspectRatioConstraint;
  const aspectVal = selectedElement?.modifiers?.UIAspectRatioConstraint?.aspectRatio || 1;

  return (
    <aside className="w-full lg:w-80 bg-[#252526] border-l border-[#3c3c3c] flex flex-col shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="h-8 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs font-semibold text-gray-300">
        <div className="flex items-center space-x-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#00a2ff]" />
          <span>Properties</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-gray-400 font-mono text-[11px] truncate max-w-[120px]">
            {selectedElement
              ? selectedModifierKey
                ? `${selectedModifierKey}`
                : selectedElement.name
              : rootType}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              title="Collapse Properties panel"
              aria-label="Collapse Properties"
              className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-[#37373d]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Property Search Filter */}
      <div className="p-1.5 border-b border-[#3c3c3c] bg-[#1e1e1e]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={propSearch}
            onChange={e => setPropSearch(e.target.value)}
            placeholder="Search properties..."
            className="w-full bg-[#252526] border border-[#3c3c3c] rounded pl-7 pr-2 py-0.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#007acc]"
          />
        </div>
      </div>

      {/* Main Properties Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 text-xs space-y-4">
        {/* If NO element is selected, show ROOT CONTAINER properties */}
        {!selectedElement ? (
          <div className="space-y-3">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              {rootType} Properties
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">Class</span>
                <span className="col-span-2 text-[#00a2ff] font-mono font-semibold">
                  {rootType}
                </span>
              </div>

              {rootType === 'ScreenGui' && (
                <>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">Name</span>
                    <input
                      type="text"
                      value={rootProperties.ScreenGui.Name}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          ScreenGui: { ...rootProperties.ScreenGui, Name: e.target.value }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono focus:outline-none focus:border-[#007acc]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">ResetOnSpawn</span>
                    <input
                      type="checkbox"
                      checked={rootProperties.ScreenGui.ResetOnSpawn}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          ScreenGui: {
                            ...rootProperties.ScreenGui,
                            ResetOnSpawn: e.target.checked
                          }
                        })
                      }
                      className="rounded bg-[#1e1e1e] border-[#3c3c3c] text-[#007acc]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">IgnoreGuiInset</span>
                    <input
                      type="checkbox"
                      checked={rootProperties.ScreenGui.IgnoreGuiInset}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          ScreenGui: {
                            ...rootProperties.ScreenGui,
                            IgnoreGuiInset: e.target.checked
                          }
                        })
                      }
                      className="rounded bg-[#1e1e1e] border-[#3c3c3c] text-[#007acc]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">ZIndexBehavior</span>
                    <select
                      value={rootProperties.ScreenGui.ZIndexBehavior}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          ScreenGui: {
                            ...rootProperties.ScreenGui,
                            ZIndexBehavior: e.target.value as 'Sibling' | 'Global'
                          }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white"
                    >
                      <option value="Sibling">Sibling (Modern)</option>
                      <option value="Global">Global (Legacy)</option>
                    </select>
                  </div>
                </>
              )}

              {rootType === 'SurfaceGui' && (
                <>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">Name</span>
                    <input
                      type="text"
                      value={rootProperties.SurfaceGui.Name}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          SurfaceGui: { ...rootProperties.SurfaceGui, Name: e.target.value }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">Face</span>
                    <select
                      value={rootProperties.SurfaceGui.Face}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          SurfaceGui: {
                            ...rootProperties.SurfaceGui,
                            Face: e.target.value as any
                          }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white"
                    >
                      <option value="Front">Front</option>
                      <option value="Back">Back</option>
                      <option value="Top">Top</option>
                      <option value="Bottom">Bottom</option>
                      <option value="Left">Left</option>
                      <option value="Right">Right</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">AlwaysOnTop</span>
                    <input
                      type="checkbox"
                      checked={rootProperties.SurfaceGui.AlwaysOnTop}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          SurfaceGui: {
                            ...rootProperties.SurfaceGui,
                            AlwaysOnTop: e.target.checked
                          }
                        })
                      }
                      className="rounded bg-[#1e1e1e] border-[#3c3c3c]"
                    />
                  </div>
                </>
              )}

              {rootType === 'BillboardGui' && (
                <>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">Name</span>
                    <input
                      type="text"
                      value={rootProperties.BillboardGui.Name}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          BillboardGui: { ...rootProperties.BillboardGui, Name: e.target.value }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">AlwaysOnTop</span>
                    <input
                      type="checkbox"
                      checked={rootProperties.BillboardGui.AlwaysOnTop}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          BillboardGui: {
                            ...rootProperties.BillboardGui,
                            AlwaysOnTop: e.target.checked
                          }
                        })
                      }
                      className="rounded bg-[#1e1e1e] border-[#3c3c3c]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">MaxDistance</span>
                    <input
                      type="number"
                      value={rootProperties.BillboardGui.MaxDistance}
                      onChange={e =>
                        onUpdateRootProperties({
                          ...rootProperties,
                          BillboardGui: {
                            ...rootProperties.BillboardGui,
                            MaxDistance: parseInt(e.target.value, 10) || 100
                          }
                        })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ELEMENT PROPERTIES */
          <>
            {/* Identity */}
            <div className="space-y-1.5 border-b border-[#3c3c3c]/60 pb-3">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Identity
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">Name</span>
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={e =>
                    onUpdateElement({ ...selectedElement, name: e.target.value })
                  }
                  className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono focus:border-[#007acc] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">Class</span>
                <div className="col-span-2 flex items-center space-x-1.5">
                  <select
                    value={selectedElement.type}
                    onChange={e => onConvertType && onConvertType(e.target.value as RobloxElementType)}
                    title="Convert to another Roblox GUI element class (retains size, position, colors, modifiers, and children)"
                    className="flex-1 bg-[#1e1e1e] border border-[#00a2ff]/50 hover:border-[#00a2ff] text-[#00a2ff] font-mono text-xs rounded px-2 py-1 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="Frame">Frame</option>
                    <option value="TextLabel">TextLabel</option>
                    <option value="TextButton">TextButton</option>
                    <option value="TextBox">TextBox</option>
                    <option value="ImageLabel">ImageLabel</option>
                    <option value="ImageButton">ImageButton</option>
                    <option value="ScrollingFrame">ScrollingFrame</option>
                    <option value="ViewportFrame">ViewportFrame</option>
                  </select>
                  <RefreshCw className="w-3.5 h-3.5 text-[#00a2ff] shrink-0" title="Convert Type" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">ZIndex</span>
                <input
                  type="number"
                  value={selectedElement.zIndex || 1}
                  onChange={e =>
                    onUpdateElement({
                      ...selectedElement,
                      zIndex: parseInt(e.target.value, 10) || 1
                    })
                  }
                  className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>

            {/* Quick Scaling and Responsiveness Box */}
            <div className="space-y-2 border-b border-[#3c3c3c]/60 pb-3 bg-[#1e1e1e]/40 p-2 rounded border border-[#3c3c3c]/60">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#00a2ff]">
                <span>Units & Scaling</span>
                <span
                  className={`font-mono ${hasAspectLock ? 'text-amber-400' : 'text-gray-500'}`}
                >
                  {hasAspectLock ? 'RATIO LOCKED' : 'FREE RESIZE'}
                </span>
              </div>

              {parentElement ? (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-gray-400 flex items-center justify-between">
                    <span>Child of <b className="text-[#00a2ff]">{parentElement.name}</b></span>
                    <span className="font-mono text-[9px] text-gray-500">Scale Options</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={onConvertToScale}
                      title={`Convert to Scale (%) relative to parent: ${parentElement.name}`}
                      className="py-1 px-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] rounded text-white border border-[#3c3c3c] font-medium flex items-center justify-center space-x-1 transition"
                    >
                      <Percent className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="truncate">To Scale (Parent)</span>
                    </button>
                    {onConvertToScreenGuiScale && (
                      <button
                        onClick={onConvertToScreenGuiScale}
                        title="Convert to Scale (%) relative to entire ScreenGui"
                        className="py-1 px-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-cyan-500 rounded text-cyan-200 border border-[#3c3c3c] font-medium flex items-center justify-center space-x-1 transition"
                      >
                        <Monitor className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">To Scale (ScreenGui)</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={onConvertToOffset}
                    title="Convert Size & Position to fixed pixels (Offset)"
                    className="w-full py-1 bg-[#2d2d30] hover:bg-[#37373d] rounded text-white border border-[#3c3c3c] font-medium flex items-center justify-center space-x-1 text-[11px] transition"
                  >
                    <Ruler className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>To Offset (px)</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={onConvertToScale}
                    title="Convert to pure scale % (ScreenGui)"
                    className="py-1 bg-[#2d2d30] hover:bg-[#37373d] rounded text-white border border-[#3c3c3c] font-medium flex items-center justify-center space-x-1 transition"
                  >
                    <Percent className="w-3 h-3 text-blue-400 shrink-0" />
                    <span>To Scale (%)</span>
                  </button>
                  <button
                    onClick={onConvertToOffset}
                    title="Convert to fixed pixels"
                    className="py-1 bg-[#2d2d30] hover:bg-[#37373d] rounded text-white border border-[#3c3c3c] font-medium flex items-center justify-center space-x-1 transition"
                  >
                    <Ruler className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>To Offset (px)</span>
                  </button>
                </div>
              )}

              <button
                onClick={onToggleAspectRatio}
                className={`w-full py-1 rounded border flex items-center justify-center space-x-1 text-[11px] font-medium transition ${
                  hasAspectLock
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-[#2d2d30] hover:bg-[#37373d] text-gray-300 border-[#3c3c3c]'
                }`}
              >
                {hasAspectLock ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 text-amber-400" />}
                <span>
                  {hasAspectLock
                    ? `Unlock Aspect Ratio (${aspectVal}:1)`
                    : 'Calculate & Lock Aspect Ratio'}
                </span>
              </button>
            </div>

            {/* Transform (UDim2) */}
            <div className="space-y-2 border-b border-[#3c3c3c]/60 pb-3">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Transform (UDim2)
              </div>

              {/* Size */}
              <div>
                <div className="text-gray-400 mb-1 flex items-center justify-between text-[11px]">
                  <span>Size:</span>
                  <span className="font-mono text-[9px] text-gray-500">
                    {`{${selectedElement.size.scaleX}, ${selectedElement.size.offsetX}, ${selectedElement.size.scaleY}, ${selectedElement.size.offsetY}}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                  <div>
                    <label className="text-[9px] text-gray-500">X Scale</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedElement.size.scaleX}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          size: {
                            ...selectedElement.size,
                            scaleX: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">X Offset</label>
                    <input
                      type="number"
                      value={selectedElement.size.offsetX}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          size: {
                            ...selectedElement.size,
                            offsetX: parseInt(e.target.value, 10) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">Y Scale</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedElement.size.scaleY}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          size: {
                            ...selectedElement.size,
                            scaleY: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">Y Offset</label>
                    <input
                      type="number"
                      value={selectedElement.size.offsetY}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          size: {
                            ...selectedElement.size,
                            offsetY: parseInt(e.target.value, 10) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Position */}
              <div className="pt-1">
                <div className="text-gray-400 mb-1 flex items-center justify-between text-[11px]">
                  <span>Position:</span>
                  <span className="font-mono text-[9px] text-gray-500">
                    {`{${selectedElement.position.scaleX}, ${selectedElement.position.offsetX}, ${selectedElement.position.scaleY}, ${selectedElement.position.offsetY}}`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
                  <div>
                    <label className="text-[9px] text-gray-500">X Scale</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedElement.position.scaleX}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          position: {
                            ...selectedElement.position,
                            scaleX: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">X Offset</label>
                    <input
                      type="number"
                      value={selectedElement.position.offsetX}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          position: {
                            ...selectedElement.position,
                            offsetX: parseInt(e.target.value, 10) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">Y Scale</label>
                    <input
                      type="number"
                      step="0.05"
                      value={selectedElement.position.scaleY}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          position: {
                            ...selectedElement.position,
                            scaleY: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500">Y Offset</label>
                    <input
                      type="number"
                      value={selectedElement.position.offsetY}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          position: {
                            ...selectedElement.position,
                            offsetY: parseInt(e.target.value, 10) || 0
                          }
                        })
                      }
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* AnchorPoint */}
              <div className="pt-1 grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">AnchorPoint</span>
                <div className="col-span-2 grid grid-cols-2 gap-1 font-mono text-[11px]">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={selectedElement.anchorPoint?.x || 0}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        anchorPoint: {
                          ...selectedElement.anchorPoint,
                          x: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={selectedElement.anchorPoint?.y || 0}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        anchorPoint: {
                          ...selectedElement.anchorPoint,
                          y: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="bg-[#1e1e1e] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-2 border-b border-[#3c3c3c]/60 pb-3">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Appearance
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">BackgroundColor3</span>
                <div className="col-span-2 flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.backgroundColor || '#393939'}
                    onChange={e =>
                      onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })
                    }
                    className="w-7 h-6 rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedElement.backgroundColor || '#393939'}
                    onChange={e =>
                      onUpdateElement({ ...selectedElement, backgroundColor: e.target.value })
                    }
                    className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono uppercase text-xs"
                  />
                </div>
              </div>

              {/* Roblox BrickColors & Themes Palette Drawer */}
              <div className="pt-0.5 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsBrickColorOpen(!isBrickColorOpen);
                    soundEffects.play('click');
                  }}
                  className={`w-full py-1.5 px-2 rounded border flex items-center justify-between text-xs transition ${
                    isBrickColorOpen
                      ? 'bg-[#007acc]/20 border-[#007acc] text-white font-semibold'
                      : 'bg-[#1e1e1e] border-[#3c3c3c] text-gray-300 hover:text-white hover:bg-[#252528]'
                  }`}
                >
                  <div className="flex items-center space-x-1.5">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Roblox BrickColors & Themes</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isBrickColorOpen ? 'rotate-180 text-[#00a2ff]' : 'text-gray-400'
                    }`}
                  />
                </button>

                {isBrickColorOpen && (
                  <div className="mt-2 p-2.5 bg-[#1a1a1c] border border-[#38383e] rounded-lg space-y-3 animate-in fade-in duration-100">
                    {/* Target Selector */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Apply To:</span>
                      <div className="flex space-x-1">
                        {(
                          ['background', 'text', 'border', ...(['ImageLabel', 'ImageButton'].includes(selectedElement.type) ? ['image'] : [])] as const
                        ).map(target => (
                          <button
                            key={target}
                            type="button"
                            onClick={() => {
                              setActiveColorTarget(target as any);
                              soundEffects.play('click');
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] capitalize transition ${
                              activeColorTarget === target
                                ? 'bg-[#007acc] text-white font-semibold'
                                : 'bg-[#252528] text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {target}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* UI Themes Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-semibold block uppercase">
                        Theme Presets
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {ROBLOX_UI_THEMES.map(theme => (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => {
                              soundEffects.play('snap');
                              onUpdateElement({
                                ...selectedElement,
                                backgroundColor: theme.surface,
                                textColor: theme.text,
                                borderColor: theme.primary,
                                borderSizePixel: 1
                              });
                            }}
                            className="p-1.5 rounded border border-[#333338] bg-[#222226] hover:bg-[#2c2c32] text-left flex items-center space-x-1.5 text-[10px] text-gray-200 transition"
                          >
                            <div className="flex space-x-0.5 shrink-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/40"
                                style={{ backgroundColor: theme.primary }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-black/40"
                                style={{ backgroundColor: theme.surface }}
                              />
                            </div>
                            <span className="truncate">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BrickColors Grid */}
                    <div className="space-y-2 pt-1 border-t border-[#2e2e34]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase">
                          BrickColor Swatches
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono">
                          {ROBLOX_BRICK_COLORS.length} Colors
                        </span>
                      </div>

                      {/* Search & Category Filter */}
                      <input
                        type="text"
                        placeholder="Search color name or ID..."
                        value={brickColorSearch}
                        onChange={e => setBrickColorSearch(e.target.value)}
                        className="w-full bg-[#141416] border border-[#333338] rounded px-2 py-1 text-[11px] text-white placeholder-gray-500"
                      />

                      <div className="flex gap-1 overflow-x-auto pb-0.5 text-[10px]">
                        {(['All', 'Greys', 'Vibrant', 'Colors', 'Pastels'] as const).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setBrickCategory(cat)}
                            className={`px-1.5 py-0.5 rounded whitespace-nowrap transition ${
                              brickCategory === cat
                                ? 'bg-[#007acc] text-white font-medium'
                                : 'bg-[#222226] text-gray-400 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Swatches Grid */}
                      <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-1 bg-[#141416] rounded border border-[#2a2a30]">
                        {ROBLOX_BRICK_COLORS.filter(c => {
                          const matchesCat = brickCategory === 'All' || c.category === brickCategory;
                          const matchesSearch =
                            c.name.toLowerCase().includes(brickColorSearch.toLowerCase()) ||
                            c.id.toString().includes(brickColorSearch);
                          return matchesCat && matchesSearch;
                        }).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            title={`${c.name} (ID: ${c.id}, ${c.hex})`}
                            onClick={() => {
                              soundEffects.play('click');
                              if (activeColorTarget === 'background') {
                                onUpdateElement({ ...selectedElement, backgroundColor: c.hex });
                              } else if (activeColorTarget === 'text') {
                                onUpdateElement({ ...selectedElement, textColor: c.hex });
                              } else if (activeColorTarget === 'image') {
                                onUpdateElement({ ...selectedElement, imageColor: c.hex });
                              } else {
                                onUpdateElement({ ...selectedElement, borderColor: c.hex, borderSizePixel: Math.max(1, selectedElement.borderSizePixel || 1) });
                              }
                            }}
                            style={{ backgroundColor: c.hex }}
                            className="w-full h-5 rounded-xs border border-white/20 hover:scale-110 hover:border-white hover:z-10 transition-transform relative group"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">BackgroundTransparency</span>
                <div className="col-span-2 flex items-center space-x-2 font-mono">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedElement.backgroundTransparency ?? 0}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        backgroundTransparency: parseFloat(e.target.value)
                      })
                    }
                    className="flex-1 accent-[#00a2ff]"
                  />
                  <span className="text-[11px] w-8 text-right">
                    {selectedElement.backgroundTransparency ?? 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-gray-400">BorderSizePixel</span>
                <input
                  type="number"
                  min="0"
                  value={selectedElement.borderSizePixel || 0}
                  onChange={e =>
                    onUpdateElement({
                      ...selectedElement,
                      borderSizePixel: parseInt(e.target.value, 10) || 0
                    })
                  }
                  className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Text Properties (if applicable) */}
            {['TextLabel', 'TextButton', 'TextBox'].includes(selectedElement.type) && (
              <div className="space-y-2 border-b border-[#3c3c3c]/60 pb-3">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Text Properties
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">Text</span>
                  <input
                    type="text"
                    value={selectedElement.text || ''}
                    onChange={e =>
                      onUpdateElement({ ...selectedElement, text: e.target.value })
                    }
                    className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">TextColor3</span>
                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedElement.textColor || '#ffffff'}
                      onChange={e =>
                        onUpdateElement({ ...selectedElement, textColor: e.target.value })
                      }
                      className="w-7 h-6 rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedElement.textColor || '#ffffff'}
                      onChange={e =>
                        onUpdateElement({ ...selectedElement, textColor: e.target.value })
                      }
                      className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono uppercase text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">TextTransparency</span>
                  <div className="col-span-2 flex items-center space-x-2 font-mono">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedElement.textTransparency ?? 0}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          textTransparency: parseFloat(e.target.value)
                        })
                      }
                      className="flex-1 accent-[#00a2ff]"
                    />
                    <span className="text-[11px] w-8 text-right">
                      {selectedElement.textTransparency ?? 0}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">TextSize</span>
                  <input
                    type="number"
                    min="6"
                    max="100"
                    value={selectedElement.textSize || 14}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        textSize: parseInt(e.target.value, 10) || 14
                      })
                    }
                    className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono"
                  />
                </div>

                  <div className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-gray-400">Font</span>
                    <select
                      value={selectedElement.font || 'SourceSans'}
                      onChange={e =>
                        onUpdateElement({ ...selectedElement, font: e.target.value })
                      }
                      className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] hover:border-[#007acc] rounded px-2 py-1 text-white text-xs font-mono"
                    >
                      {ROBLOX_FONTS.map(f => (
                        <option
                          key={f.enumName}
                          value={f.enumName}
                          style={{ fontFamily: f.cssFamily }}
                        >
                          {f.displayName} ({f.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Styling: Bold Toggle & TextScaled Auto-Scale */}
                  <div className="grid grid-cols-3 gap-2 items-center pt-1">
                    <span className="text-gray-400">Formatting</span>
                    <div className="col-span-2 flex items-center space-x-1.5">
                      {/* Bold Toggle Button */}
                      {(() => {
                        const currentFont = selectedElement.font || 'SourceSans';
                        const isBold =
                          currentFont.includes('Bold') ||
                          currentFont === 'Bangers' ||
                          currentFont === 'FredokaOne' ||
                          currentFont === 'LuckiestGuy';

                        const handleToggleBold = () => {
                          let nextFont = currentFont;
                          if (currentFont.endsWith('Bold')) {
                            const withoutBold = currentFont.replace(/Bold$/, '');
                            nextFont = ROBLOX_FONTS.some(f => f.enumName === withoutBold)
                              ? withoutBold
                              : 'SourceSans';
                          } else if (currentFont.endsWith('ExtraBold')) {
                            const withoutBold = currentFont.replace(/ExtraBold$/, '');
                            nextFont = ROBLOX_FONTS.some(f => f.enumName === withoutBold)
                              ? withoutBold
                              : 'SourceSans';
                          } else {
                            const withBold = `${currentFont}Bold`;
                            if (ROBLOX_FONTS.some(f => f.enumName === withBold)) {
                              nextFont = withBold;
                            } else if (currentFont === 'Gotham') {
                              nextFont = 'GothamBold';
                            } else if (currentFont === 'BuilderSans') {
                              nextFont = 'BuilderSansBold';
                            } else if (currentFont === 'Arimo') {
                              nextFont = 'ArimoBold';
                            } else {
                              nextFont = 'SourceSansBold';
                            }
                          }
                          soundEffects.play('click');
                          onUpdateElement({ ...selectedElement, font: nextFont });
                        };

                        return (
                          <button
                            type="button"
                            onClick={handleToggleBold}
                            title="Toggle Bold Font Variant"
                            className={`flex-1 py-1 px-2 rounded border text-xs flex items-center justify-center space-x-1 transition font-semibold ${
                              isBold
                                ? 'bg-[#007acc] text-white border-[#007acc] shadow-xs'
                                : 'bg-[#1e1e1e] border-[#3c3c3c] text-gray-300 hover:text-white hover:bg-[#2a2a2e]'
                            }`}
                          >
                            <Bold className="w-3.5 h-3.5" />
                            <span>Bold</span>
                          </button>
                        );
                      })()}

                      {/* TextScaled Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.play('click');
                          onUpdateElement({
                            ...selectedElement,
                            textScaled: !selectedElement.textScaled
                          });
                        }}
                        title="Toggle TextScaled (Auto-scale text size dynamically to fit container)"
                        className={`flex-1 py-1 px-2 rounded border text-xs flex items-center justify-center space-x-1 transition font-semibold ${
                          selectedElement.textScaled
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-[#1e1e1e] border-[#3c3c3c] text-gray-300 hover:text-white hover:bg-[#2a2a2e]'
                        }`}
                      >
                        <Maximize className="w-3.5 h-3.5 text-emerald-400" />
                        <span>TextScaled</span>
                      </button>
                    </div>
                  </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">TextXAlignment</span>
                  <select
                    value={selectedElement.textXAlignment || 'Center'}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        textXAlignment: e.target.value as any
                      })
                    }
                    className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white"
                  >
                    <option value="Left">Left</option>
                    <option value="Center">Center</option>
                    <option value="Right">Right</option>
                  </select>
                </div>
              </div>
            )}

            {/* Image Properties (if applicable) */}
            {['ImageLabel', 'ImageButton'].includes(selectedElement.type) && (
              <div className="space-y-2 border-b border-[#3c3c3c]/60 pb-3">
                <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Image Properties
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 text-xs">Image URL / Asset</label>
                  <input
                    type="text"
                    value={selectedElement.image || ''}
                    onChange={e =>
                      onUpdateElement({ ...selectedElement, image: e.target.value })
                    }
                    className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white font-mono text-xs"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <label className="flex-1 py-1 bg-[#2d2d30] hover:bg-[#37373d] rounded text-gray-300 text-xs flex items-center justify-center space-x-1 cursor-pointer border border-[#3c3c3c] transition">
                      <Upload className="w-3 h-3 text-[#00a2ff]" />
                      <span>Upload Local Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {selectedElement.image && (
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.play('click');
                          exportSingleImage(selectedElement);
                        }}
                        title="Download element image as PNG (with ImageColor3 & transparency applied)"
                        className="px-2 py-1 bg-[#2d2d30] hover:bg-[#37373d] text-emerald-400 hover:text-white rounded border border-[#3c3c3c] flex items-center space-x-1 text-xs transition"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>PNG</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">ImageColor3</span>
                  <div className="col-span-2 flex items-center space-x-2">
                    <input
                      type="color"
                      value={selectedElement.imageColor || '#ffffff'}
                      onChange={e =>
                        onUpdateElement({ ...selectedElement, imageColor: e.target.value })
                      }
                      className="w-7 h-6 rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedElement.imageColor || '#ffffff'}
                      onChange={e =>
                        onUpdateElement({ ...selectedElement, imageColor: e.target.value })
                      }
                      className="flex-1 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono uppercase text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">ScaleType</span>
                  <select
                    value={selectedElement.scaleType || 'Stretch'}
                    onChange={e =>
                      onUpdateElement({
                        ...selectedElement,
                        scaleType: e.target.value as any
                      })
                    }
                    className="col-span-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2 py-1 text-white"
                  >
                    <option value="Stretch">Stretch (Fill)</option>
                    <option value="Fit">Fit (Letterbox)</option>
                    <option value="Crop">Crop (Cover)</option>
                    <option value="Slice">Slice (9-Slice)</option>
                    <option value="Tile">Tile (Pattern)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-gray-400">ImageTransparency</span>
                  <div className="col-span-2 flex items-center space-x-2 font-mono">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedElement.imageTransparency ?? 0}
                      onChange={e =>
                        onUpdateElement({
                          ...selectedElement,
                          imageTransparency: parseFloat(e.target.value)
                        })
                      }
                      className="flex-1 accent-[#00a2ff]"
                    />
                    <span className="text-[11px] w-8 text-right">
                      {selectedElement.imageTransparency ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Attached Modifiers Detailed Inspection */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                Attached Modifiers
              </div>

              {selectedElement.modifiers &&
              Object.keys(selectedElement.modifiers).length > 0 ? (
                (Object.keys(selectedElement.modifiers) as ModifierType[]).map(modKey => {
                  const mod = selectedElement.modifiers[modKey];
                  if (!mod) return null;

                  return (
                    <div
                      key={modKey}
                      className="p-2 bg-[#1e1e1e]/60 border border-[#3c3c3c] rounded space-y-2"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#00a2ff] text-[11px]">
                        <span className="flex items-center space-x-1.5">
                          <Sparkles className="w-3 h-3" />
                          <span>{modKey}</span>
                        </span>
                        <button
                          onClick={() => onRemoveModifier(selectedElement.id, modKey)}
                          title={`Delete ${modKey}`}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {modKey === 'UICorner' && (
                        <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                          <span className="text-gray-400">CornerRadius (px)</span>
                          <input
                            type="number"
                            min="0"
                            value={(mod as any).cornerRadiusOffset || 8}
                            onChange={e =>
                              onUpdateElement({
                                ...selectedElement,
                                modifiers: {
                                  ...selectedElement.modifiers,
                                  UICorner: {
                                    ...selectedElement.modifiers.UICorner!,
                                    cornerRadiusOffset: parseInt(e.target.value, 10) || 0
                                  }
                                }
                              })
                            }
                            className="col-span-2 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono"
                          />
                        </div>
                      )}

                      {modKey === 'UIStroke' && (
                        <>
                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Color</span>
                            <input
                              type="color"
                              value={(mod as any).color || '#00a2ff'}
                              onChange={e =>
                                onUpdateElement({
                                  ...selectedElement,
                                  modifiers: {
                                    ...selectedElement.modifiers,
                                    UIStroke: {
                                      ...selectedElement.modifiers.UIStroke!,
                                      color: e.target.value
                                    }
                                  }
                                })
                              }
                              className="col-span-2 h-6 w-full rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Thickness (px)</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={(mod as any).thickness || 2}
                              onChange={e =>
                                onUpdateElement({
                                  ...selectedElement,
                                  modifiers: {
                                    ...selectedElement.modifiers,
                                    UIStroke: {
                                      ...selectedElement.modifiers.UIStroke!,
                                      thickness: parseInt(e.target.value, 10) || 1
                                    }
                                  }
                                })
                              }
                              className="col-span-2 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {modKey === 'UIGradient' && (
                        <>
                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Color 1 (Start)</span>
                            <div className="col-span-2 flex items-center space-x-2">
                              <input
                                type="color"
                                value={(mod as any).color1 || '#ff007f'}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        color1: e.target.value
                                      }
                                    }
                                  })
                                }
                                className="w-7 h-6 rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                              />
                              <input
                                type="text"
                                value={(mod as any).color1 || '#ff007f'}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        color1: e.target.value
                                      }
                                    }
                                  })
                                }
                                className="flex-1 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono text-[10px] uppercase"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Color 2 (End)</span>
                            <div className="col-span-2 flex items-center space-x-2">
                              <input
                                type="color"
                                value={(mod as any).color2 || '#7928ca'}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        color2: e.target.value
                                      }
                                    }
                                  })
                                }
                                className="w-7 h-6 rounded bg-transparent border border-[#3c3c3c] cursor-pointer"
                              />
                              <input
                                type="text"
                                value={(mod as any).color2 || '#7928ca'}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        color2: e.target.value
                                      }
                                    }
                                  })
                                }
                                className="flex-1 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono text-[10px] uppercase"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Rotation (deg)</span>
                            <div className="col-span-2 flex items-center space-x-2">
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                step="5"
                                value={(mod as any).rotation || 0}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        rotation: parseInt(e.target.value, 10) || 0
                                      }
                                    }
                                  })
                                }
                                className="flex-1 accent-[#00a2ff]"
                              />
                              <input
                                type="number"
                                min="-360"
                                max="360"
                                value={(mod as any).rotation || 0}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        rotation: parseInt(e.target.value, 10) || 0
                                      }
                                    }
                                  })
                                }
                                className="w-12 bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white font-mono text-center text-[11px]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Transparency</span>
                            <div className="col-span-2 flex items-center space-x-2 font-mono">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={(mod as any).transparency ?? 0}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGradient: {
                                        ...selectedElement.modifiers.UIGradient!,
                                        transparency: parseFloat(e.target.value) || 0
                                      }
                                    }
                                  })
                                }
                                className="flex-1 accent-[#00a2ff]"
                              />
                              <span className="text-[11px] w-8 text-right">
                                {(mod as any).transparency ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Quick gradient presets */}
                          <div className="space-y-1 pt-1 border-t border-[#3c3c3c]/50">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Presets</span>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { name: 'Sunset', c1: '#ff512f', c2: '#dd2476' },
                                { name: 'Neon Sky', c1: '#00c6ff', c2: '#0072ff' },
                                { name: 'Emerald', c1: '#11998e', c2: '#38ef7d' },
                                { name: 'Gold', c1: '#f7971e', c2: '#ffd200' },
                                { name: 'Cyber', c1: '#f857a6', c2: '#ff5858' },
                                { name: 'Dark Mode', c1: '#434343', c2: '#000000' }
                              ].map(p => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() => {
                                    soundEffects.play('click');
                                    onUpdateElement({
                                      ...selectedElement,
                                      modifiers: {
                                        ...selectedElement.modifiers,
                                        UIGradient: {
                                          ...selectedElement.modifiers.UIGradient!,
                                          color1: p.c1,
                                          color2: p.c2
                                        }
                                      }
                                    });
                                  }}
                                  className="h-5 rounded border border-[#3c3c3c] hover:border-white transition flex items-center justify-center text-[9px] text-white font-medium shadow-xs"
                                  style={{
                                    background: `linear-gradient(90deg, ${p.c1}, ${p.c2})`,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                                  }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {modKey === 'UIListLayout' && (
                        <>
                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Direction</span>
                            <select
                              value={(mod as any).fillDirection || 'Vertical'}
                              onChange={e =>
                                onUpdateElement({
                                  ...selectedElement,
                                  modifiers: {
                                    ...selectedElement.modifiers,
                                    UIListLayout: {
                                      ...selectedElement.modifiers.UIListLayout!,
                                      fillDirection: e.target.value as any
                                    }
                                  }
                                })
                              }
                              className="col-span-2 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white"
                            >
                              <option value="Vertical">Vertical</option>
                              <option value="Horizontal">Horizontal</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Padding (px)</span>
                            <input
                              type="number"
                              min="0"
                              value={(mod as any).padding || 0}
                              onChange={e =>
                                onUpdateElement({
                                  ...selectedElement,
                                  modifiers: {
                                    ...selectedElement.modifiers,
                                    UIListLayout: {
                                      ...selectedElement.modifiers.UIListLayout!,
                                      padding: parseInt(e.target.value, 10) || 0
                                    }
                                  }
                                })
                              }
                              className="col-span-2 bg-[#252526] border border-[#3c3c3c] rounded px-2 py-0.5 text-white font-mono"
                            />
                          </div>
                        </>
                      )}

                      {modKey === 'UIGridLayout' && (
                        <>
                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Cell Size</span>
                            <div className="col-span-2 grid grid-cols-2 gap-1 font-mono">
                              <input
                                type="number"
                                min="10"
                                value={(mod as any).cellSizeX || 80}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGridLayout: {
                                        ...selectedElement.modifiers.UIGridLayout!,
                                        cellSizeX: parseInt(e.target.value, 10) || 80
                                      }
                                    }
                                  })
                                }
                                placeholder="W"
                                className="bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                              />
                              <input
                                type="number"
                                min="10"
                                value={(mod as any).cellSizeY || 80}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGridLayout: {
                                        ...selectedElement.modifiers.UIGridLayout!,
                                        cellSizeY: parseInt(e.target.value, 10) || 80
                                      }
                                    }
                                  })
                                }
                                placeholder="H"
                                className="bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 items-center text-[11px]">
                            <span className="text-gray-400">Padding</span>
                            <div className="col-span-2 grid grid-cols-2 gap-1 font-mono">
                              <input
                                type="number"
                                min="0"
                                value={(mod as any).cellPaddingX || 8}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGridLayout: {
                                        ...selectedElement.modifiers.UIGridLayout!,
                                        cellPaddingX: parseInt(e.target.value, 10) || 0
                                      }
                                    }
                                  })
                                }
                                placeholder="PadX"
                                className="bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                              />
                              <input
                                type="number"
                                min="0"
                                value={(mod as any).cellPaddingY || 8}
                                onChange={e =>
                                  onUpdateElement({
                                    ...selectedElement,
                                    modifiers: {
                                      ...selectedElement.modifiers,
                                      UIGridLayout: {
                                        ...selectedElement.modifiers.UIGridLayout!,
                                        cellPaddingY: parseInt(e.target.value, 10) || 0
                                      }
                                    }
                                  })
                                }
                                placeholder="PadY"
                                className="bg-[#252526] border border-[#3c3c3c] rounded px-1.5 py-0.5 text-white"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-gray-500 italic p-2 bg-[#1e1e1e]/40 rounded border border-[#3c3c3c]/40">
                  No modifiers attached. Click a modifier on the left palette (e.g. UICorner, UIListLayout) to add one.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
