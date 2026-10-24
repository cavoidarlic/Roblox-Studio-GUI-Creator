import React, { useState, useId } from 'react';
import { RobloxElement } from '../types/roblox';
import {
  solveAspectRatioDimension,
  convertScaleToOffset,
  convertOffsetToScale
} from '../utils/robloxMath';
import { soundEffects } from '../utils/soundEffects';
import {
  X,
  Scale,
  Percent,
  Check,
  Copy,
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  ArrowRightLeft,
  FolderTree,
  Layers
} from 'lucide-react';

interface RatioCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: RobloxElement | null;
  parentElement?: RobloxElement | null;
  parentPixelSize?: { w: number; h: number } | null;
  viewportSize: { width: number; height: number };
  onApplyAspectRatio: (aspectRatio: number, dominantAxis: 'Width' | 'Height') => void;
  onApplyScale: (scaleX: number, scaleY: number) => void;
  onApplyOffset: (offsetX: number, offsetY: number) => void;
}

const PRESET_RATIOS = [
  { label: '16:9 (Standard Widescreen)', w: 16, h: 9 },
  { label: '4:3 (Classic Retro)', w: 4, h: 3 },
  { label: '1:1 (Square Avatar / Icon)', w: 1, h: 1 },
  { label: '21:9 (Ultrawide Banner)', w: 21, h: 9 },
  { label: '9:16 (Mobile Portrait Story)', w: 9, h: 16 },
  { label: '2:1 (Header / Health Bar)', w: 2, h: 1 }
];

const DEVICE_PRESETS = [
  { name: 'Desktop 1080p', w: 1920, h: 1080, icon: Monitor },
  { name: 'Laptop WXGA', w: 1366, h: 768, icon: Monitor },
  { name: 'iPad / Tablet', w: 1024, h: 768, icon: Tablet },
  { name: 'Phone (iPhone/Galaxy)', w: 844, h: 390, icon: Smartphone }
];

export const RatioCalculatorModal: React.FC<RatioCalculatorModalProps> = ({
  isOpen,
  onClose,
  selectedElement,
  parentElement,
  parentPixelSize,
  viewportSize,
  onApplyAspectRatio,
  onApplyScale,
  onApplyOffset
}) => {
  const [activeMode, setActiveMode] = useState<'ratio' | 'pixel'>('ratio');
  const [copied, setCopied] = useState(false);

  // Accessible unique IDs for form inputs
  const knownDimId = useId();
  const knownValId = useId();
  const ratioWId = useId();
  const ratioHId = useId();
  const dominantAxisId = useId();
  const screenWId = useId();
  const screenHId = useId();
  const scaleXId = useId();
  const scaleYId = useId();
  const offsetXId = useId();
  const offsetYId = useId();

  // Mode 1: Aspect Ratio Solver State
  const [knownDim, setKnownDim] = useState<'width' | 'height'>('width');
  const [knownVal, setKnownVal] = useState<number>(() => {
    return selectedElement?.size.offsetX || 320;
  });
  const [ratioW, setRatioW] = useState<number>(16);
  const [ratioH, setRatioH] = useState<number>(9);
  const [dominantAxis, setDominantAxis] = useState<'Width' | 'Height'>('Width');

  // Mode 2: Scale-to-Offset Converter State (defaults to parent if child, else viewport)
  const [targetScreenW, setTargetScreenW] = useState<number>(() => {
    if (parentElement && parentPixelSize) return parentPixelSize.w;
    return viewportSize.width || 1280;
  });
  const [targetScreenH, setTargetScreenH] = useState<number>(() => {
    if (parentElement && parentPixelSize) return parentPixelSize.h;
    return viewportSize.height || 720;
  });

  const [inputScaleX, setInputScaleX] = useState<number>(() => {
    return selectedElement?.size.scaleX || 0.25;
  });
  const [inputScaleY, setInputScaleY] = useState<number>(() => {
    return selectedElement?.size.scaleY || 0.15;
  });

  const [inputOffsetX, setInputOffsetX] = useState<number>(() => {
    return selectedElement?.size.offsetX || 300;
  });
  const [inputOffsetY, setInputOffsetY] = useState<number>(() => {
    return selectedElement?.size.offsetY || 120;
  });

  if (!isOpen) return null;

  // Solve aspect ratio
  const ratioSolution = solveAspectRatioDimension(knownDim, knownVal, ratioW, ratioH);
  const calculatedW = knownDim === 'width' ? knownVal : ratioSolution.calculatedValue;
  const calculatedH = knownDim === 'height' ? knownVal : ratioSolution.calculatedValue;

  // Scale to Offset conversions
  const computedOffset = convertScaleToOffset(inputScaleX, inputScaleY, targetScreenW, targetScreenH);
  const computedScale = convertOffsetToScale(inputOffsetX, inputOffsetY, targetScreenW, targetScreenH);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    soundEffects.play('chime');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectPresetRatio = (w: number, h: number) => {
    setRatioW(w);
    setRatioH(h);
    soundEffects.play('click');
  };

  const handleSelectDevice = (w: number, h: number) => {
    setTargetScreenW(w);
    setTargetScreenH(h);
    soundEffects.play('click');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#007acc] flex items-center justify-center text-white">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Roblox Ratio & Pixel Calculator</h2>
              <p className="text-gray-400 text-xs">
                Solve aspect ratios, generate UIAspectRatioConstraints & convert Scale vs Offset
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            aria-label="Close Calculator"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#333333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#333333] bg-[#222225] px-4 pt-2">
          <button
            onClick={() => {
              setActiveMode('ratio');
              soundEffects.play('click');
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-md transition border-t border-x ${
              activeMode === 'ratio'
                ? 'bg-[#1e1e1e] border-[#3e3e42] text-[#00a2ff] border-b-transparent'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Mode 1: Aspect Ratio Solver & Constraint</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('pixel');
              soundEffects.play('click');
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-t-md transition border-t border-x ${
              activeMode === 'pixel'
                ? 'bg-[#1e1e1e] border-[#3e3e42] text-[#00a2ff] border-b-transparent'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Mode 2: Scale ⇄ Offset Pixel Converter</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-300">
          {activeMode === 'ratio' ? (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Quick Ratio Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_RATIOS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handleSelectPresetRatio(p.w, p.h)}
                      className={`px-2.5 py-1.5 rounded border text-left flex items-center justify-between text-xs transition ${
                        ratioW === p.w && ratioH === p.h
                          ? 'border-[#007acc] bg-[#007acc]/20 text-white font-medium'
                          : 'border-[#333333] bg-[#252526] hover:bg-[#2d2d30] text-gray-300'
                      }`}
                    >
                      <span className="truncate">{p.label}</span>
                      <span className="font-mono text-[10px] text-gray-400 shrink-0 ml-1">
                        {p.w}:{p.h}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#252526] p-4 rounded-lg border border-[#333333]">
                <div className="space-y-3">
                  <span className="font-semibold text-white text-xs block">Known Dimension</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setKnownDim('width')}
                      className={`flex-1 py-1.5 rounded border text-center transition font-medium ${
                        knownDim === 'width'
                          ? 'bg-[#007acc] text-white border-[#007acc]'
                          : 'bg-[#1e1e1e] text-gray-400 border-[#3c3c3c]'
                      }`}
                    >
                      Width (X)
                    </button>
                    <button
                      type="button"
                      onClick={() => setKnownDim('height')}
                      className={`flex-1 py-1.5 rounded border text-center transition font-medium ${
                        knownDim === 'height'
                          ? 'bg-[#007acc] text-white border-[#007acc]'
                          : 'bg-[#1e1e1e] text-gray-400 border-[#3c3c3c]'
                      }`}
                    >
                      Height (Y)
                    </button>
                  </div>

                  <div>
                    <label htmlFor={knownValId} className="text-gray-400 text-[11px] block mb-1">
                      {knownDim === 'width' ? 'Known Width (px)' : 'Known Height (px)'}
                    </label>
                    <input
                      id={knownValId}
                      type="number"
                      min={1}
                      max={4000}
                      value={knownVal}
                      onChange={e => setKnownVal(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="font-semibold text-white text-xs block">Target Ratio (W : H)</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <label htmlFor={ratioWId} className="text-gray-400 text-[11px] block mb-1">Ratio W</label>
                      <input
                        id={ratioWId}
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={ratioW}
                        onChange={e => setRatioW(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                    <span className="text-gray-400 text-lg font-bold self-end pb-1">:</span>
                    <div className="flex-1">
                      <label htmlFor={ratioHId} className="text-gray-400 text-[11px] block mb-1">Ratio H</label>
                      <input
                        id={ratioHId}
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={ratioH}
                        onChange={e => setRatioH(Math.max(0.1, parseFloat(e.target.value) || 1))}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={dominantAxisId} className="text-gray-400 text-[11px] block mb-1">Roblox DominantAxis</label>
                    <select
                      id={dominantAxisId}
                      value={dominantAxis}
                      onChange={e => setDominantAxis(e.target.value as 'Width' | 'Height')}
                      className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="Width">Width (Height scales from Width)</option>
                      <option value="Height">Height (Width scales from Height)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Solution Preview */}
              <div className="bg-[#19191d] p-4 rounded-lg border border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
                    Computed Resolution
                  </div>
                  <div className="text-xl font-bold font-mono text-[#00a2ff] flex items-center space-x-2">
                    <span>{calculatedW}px × {calculatedH}px</span>
                    <span className="text-xs text-gray-400 font-normal">
                      (Ratio: {ratioSolution.ratioDecimal})
                    </span>
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Roblox AspectRatio property value: <span className="text-amber-400 font-mono font-semibold">{ratioSolution.ratioDecimal}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      const luau = `local aspect = Instance.new("UIAspectRatioConstraint")\naspect.AspectRatio = ${ratioSolution.ratioDecimal}\naspect.DominantAxis = Enum.DominantAxis.${dominantAxis}\naspect.AspectType = Enum.AspectType.FitWithinMaxSize\naspect.Parent = element`;
                      handleCopy(luau);
                    }}
                    className="px-3 py-2 bg-[#2d2d30] hover:bg-[#38383c] border border-[#444] rounded text-white flex items-center space-x-1.5 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Luau'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onApplyAspectRatio(ratioSolution.ratioDecimal, dominantAxis);
                      soundEffects.play('chime');
                      onClose();
                    }}
                    disabled={!selectedElement}
                    className={`px-4 py-2 rounded font-semibold flex items-center space-x-1.5 transition ${
                      selectedElement
                        ? 'bg-[#007acc] hover:bg-[#0098ff] text-white shadow'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply to {selectedElement ? selectedElement.name : 'Selection'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Screen Reference Presets */}
              <div>
                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Target Canvas Reference Container
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {parentElement && parentPixelSize && (
                    <button
                      onClick={() => handleSelectDevice(parentPixelSize.w, parentPixelSize.h)}
                      className={`p-2 rounded border text-left flex flex-col justify-between text-xs transition col-span-2 ${
                        targetScreenW === parentPixelSize.w && targetScreenH === parentPixelSize.h
                          ? 'border-[#007acc] bg-[#007acc]/20 text-white font-medium ring-1 ring-[#00a2ff]'
                          : 'border-[#333333] bg-[#252526] hover:bg-[#2d2d30] text-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <FolderTree className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-[11px] truncate text-amber-300">
                          Parent: {parentElement.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">
                        {parentPixelSize.w} × {parentPixelSize.h} px (Immediate Parent)
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectDevice(viewportSize.width, viewportSize.height)}
                    className={`p-2 rounded border text-left flex flex-col justify-between text-xs transition ${
                      parentElement && parentPixelSize ? 'col-span-2' : 'col-span-2 sm:col-span-4'
                    } ${
                      targetScreenW === viewportSize.width && targetScreenH === viewportSize.height
                        ? 'border-[#007acc] bg-[#007acc]/20 text-white font-medium ring-1 ring-[#00a2ff]'
                        : 'border-[#333333] bg-[#252526] hover:bg-[#2d2d30] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <Layers className="w-3.5 h-3.5 text-[#00a2ff] shrink-0" />
                      <span className="font-semibold text-[11px] truncate text-blue-300">
                        ScreenGui Canvas
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {viewportSize.width} × {viewportSize.height} px (Full Screen)
                    </span>
                  </button>
                </div>

                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                  Device Presets
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEVICE_PRESETS.map(d => {
                    const Icon = d.icon;
                    return (
                      <button
                        key={d.name}
                        onClick={() => handleSelectDevice(d.w, d.h)}
                        className={`p-2 rounded border text-left flex flex-col justify-between text-xs transition ${
                          targetScreenW === d.w && targetScreenH === d.h
                            ? 'border-[#007acc] bg-[#007acc]/20 text-white font-medium ring-1 ring-[#00a2ff]'
                            : 'border-[#333333] bg-[#252526] hover:bg-[#2d2d30] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-[#00a2ff]" />
                          <span className="font-semibold text-[11px] truncate">{d.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-gray-400">
                          {d.w} × {d.h} px
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual Converter Grids */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Scale to Offset */}
                <div className="bg-[#252526] p-4 rounded-lg border border-[#333333] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs flex items-center space-x-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Scale ➔ Pixel Offset</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      @ {targetScreenW}×{targetScreenH}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={scaleXId} className="text-gray-400 text-[10px] block mb-1">Scale X (0.0 - 1.0)</label>
                      <input
                        id={scaleXId}
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={inputScaleX}
                        onChange={e => setInputScaleX(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label htmlFor={scaleYId} className="text-gray-400 text-[10px] block mb-1">Scale Y (0.0 - 1.0)</label>
                      <input
                        id={scaleYId}
                        type="number"
                        step={0.01}
                        min={0}
                        max={1}
                        value={inputScaleY}
                        onChange={e => setInputScaleY(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-[#1a1a1c] p-2.5 rounded border border-[#38383c] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Exact Pixel Offset</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {computedOffset.offsetX}px × {computedOffset.offsetY}px
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onApplyOffset(computedOffset.offsetX, computedOffset.offsetY);
                        soundEffects.play('chime');
                        onClose();
                      }}
                      disabled={!selectedElement}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded font-medium text-[11px] transition"
                    >
                      Apply Offset
                    </button>
                  </div>
                </div>

                {/* Offset to Scale */}
                <div className="bg-[#252526] p-4 rounded-lg border border-[#333333] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-xs flex items-center space-x-1">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                      <span>Pixel Offset ➔ Scale</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      @ {targetScreenW}×{targetScreenH}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={offsetXId} className="text-gray-400 text-[10px] block mb-1">Offset X (Pixels)</label>
                      <input
                        id={offsetXId}
                        type="number"
                        step={1}
                        min={0}
                        max={4000}
                        value={inputOffsetX}
                        onChange={e => setInputOffsetX(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                    <div>
                      <label htmlFor={offsetYId} className="text-gray-400 text-[10px] block mb-1">Offset Y (Pixels)</label>
                      <input
                        id={offsetYId}
                        type="number"
                        step={1}
                        min={0}
                        max={4000}
                        value={inputOffsetY}
                        onChange={e => setInputOffsetY(parseInt(e.target.value) || 0)}
                        className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-2.5 py-1.5 text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="bg-[#1a1a1c] p-2.5 rounded border border-[#38383c] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Proportional Scale</span>
                      <span className="font-mono font-bold text-sky-400 text-sm">
                        {computedScale.scaleX} × {computedScale.scaleY}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onApplyScale(computedScale.scaleX, computedScale.scaleY);
                        soundEffects.play('chime');
                        onClose();
                      }}
                      disabled={!selectedElement}
                      className="px-2.5 py-1 bg-[#007acc] hover:bg-[#0098ff] disabled:opacity-40 text-white rounded font-medium text-[11px] transition"
                    >
                      Apply Scale
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-screen visual responsiveness comparison */}
              <div className="bg-[#19191d] p-3.5 rounded-lg border border-[#333333] space-y-2">
                <span className="font-semibold text-white text-xs block">
                  Responsive Cross-Device Scale Preview ({inputScaleX * 100}% W × {inputScaleY * 100}% H)
                </span>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {[
                    { label: 'Desktop 1920x1080', w: 1920, h: 1080 },
                    { label: 'Tablet 1024x768', w: 1024, h: 768 },
                    { label: 'Mobile 844x390', w: 844, h: 390 }
                  ].map(dev => {
                    const devOff = convertScaleToOffset(inputScaleX, inputScaleY, dev.w, dev.h);
                    return (
                      <div
                        key={dev.label}
                        className="bg-[#242429] p-2 rounded border border-[#3a3a40] text-center"
                      >
                        <span className="text-[10px] text-gray-400 font-medium block truncate">
                          {dev.label}
                        </span>
                        <span className="font-mono text-xs text-white font-semibold">
                          {devOff.offsetX}px × {devOff.offsetY}px
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between text-xs text-gray-400">
          <span>
            Selected element:{' '}
            <strong className="text-white">
              {selectedElement ? selectedElement.name : 'None (Select on Canvas)'}
            </strong>
          </span>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            className="px-4 py-1.5 bg-[#333333] hover:bg-[#3f3f46] text-white rounded font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
