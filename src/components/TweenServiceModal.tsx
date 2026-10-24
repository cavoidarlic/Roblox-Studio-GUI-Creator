import React, { useState, useId } from 'react';
import { RobloxElement } from '../types/roblox';
import { generateTweenServiceLuau } from '../utils/robloxMath';
import { soundEffects } from '../utils/soundEffects';
import {
  X,
  Sparkles,
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  Code2
} from 'lucide-react';

interface TweenServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: RobloxElement | null;
}

const EASING_STYLES = [
  'Quad',
  'Sine',
  'Back',
  'Elastic',
  'Bounce',
  'Linear'
] as const;

const EASING_DIRECTIONS = ['Out', 'In', 'InOut'] as const;

export const TweenServiceModal: React.FC<TweenServiceModalProps> = ({
  isOpen,
  onClose,
  selectedElement
}) => {
  const [hoverScale, setHoverScale] = useState<number>(1.08);
  const [clickEffect, setClickEffect] = useState<'bounce' | 'squish' | 'none'>('bounce');
  const [easingStyle, setEasingStyle] = useState<typeof EASING_STYLES[number]>('Back');
  const [easingDirection, setEasingDirection] = useState<typeof EASING_DIRECTIONS[number]>('Out');
  const [duration, setDuration] = useState<number>(0.2);
  const [copied, setCopied] = useState(false);

  // Accessible unique IDs for form controls
  const easingStyleId = useId();
  const easingDirectionId = useId();
  const durationId = useId();
  const hoverScaleId = useId();

  // Interactive preview state
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  if (!isOpen) return null;

  const targetName = selectedElement ? selectedElement.name : 'SampleButton';
  const luauScript = generateTweenServiceLuau(targetName, {
    hoverScale,
    clickEffect,
    easingStyle,
    easingDirection,
    duration
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(luauScript);
    setCopied(true);
    soundEffects.play('chime');
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview interactive transform calculation
  let scaleTransform = 1;
  let scaleYTransform = 1;

  if (isPressed) {
    if (clickEffect === 'bounce') {
      scaleTransform = 0.92;
      scaleYTransform = 0.92;
    } else if (clickEffect === 'squish') {
      scaleTransform = 1.08;
      scaleYTransform = 0.88;
    }
  } else if (isHovered) {
    scaleTransform = hoverScale;
    scaleYTransform = hoverScale;
  }

  // Choose CSS transition timing function approximating Roblox EasingStyles
  const getTransitionTiming = () => {
    switch (easingStyle) {
      case 'Elastic':
        return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      case 'Back':
        return 'cubic-bezier(0.34, 1.56, 0.64, 1)';
      case 'Bounce':
        return 'cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      case 'Sine':
        return 'cubic-bezier(0.39, 0.575, 0.565, 1)';
      case 'Quad':
        return 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      default:
        return 'linear';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#9333ea] flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Roblox TweenService Animation Previewer</h2>
              <p className="text-gray-400 text-xs">
                Simulate UI animations in real-time and export production Luau code
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.play('click');
              onClose();
            }}
            aria-label="Close Previewer"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#333333]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-300">
          {/* Interactive Simulation Stage */}
          <div className="bg-gradient-to-b from-[#18181b] to-[#121214] p-8 rounded-xl border border-[#333338] flex flex-col items-center justify-center space-y-3 relative overflow-hidden select-none">
            <span className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold">
              Live Interactive Tween Test (Hover & Click Me)
            </span>

            <div
              onMouseEnter={() => {
                setIsHovered(true);
                soundEffects.play('hover');
              }}
              onMouseLeave={() => {
                setIsHovered(false);
                setIsPressed(false);
              }}
              onMouseDown={() => {
                setIsPressed(true);
                soundEffects.play('click');
              }}
              onMouseUp={() => {
                setIsPressed(false);
              }}
              style={{
                transform: `scale(${scaleTransform}, ${scaleYTransform})`,
                transition: `transform ${duration}s ${getTransitionTiming()}`
              }}
              className="cursor-pointer px-8 py-3.5 bg-[#00a2ff] text-white font-bold rounded-lg shadow-lg flex items-center space-x-2 border border-sky-400/40 select-none text-sm active:shadow-inner"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{targetName}</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] text-gray-400 font-mono pt-1">
              <span>Hover: {isHovered ? 'Active (Scale ' + hoverScale + 'x)' : 'Idle'}</span>
              <span>•</span>
              <span>Pressed: {isPressed ? 'Active' : 'No'}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#252526] p-4 rounded-lg border border-[#333333]">
            {/* Easing style & direction */}
            <div className="space-y-3">
              <div>
                <label htmlFor={easingStyleId} className="text-gray-400 text-[11px] block mb-1">EasingStyle</label>
                <select
                  id={easingStyleId}
                  value={easingStyle}
                  onChange={e => {
                    setEasingStyle(e.target.value as typeof EASING_STYLES[number]);
                    soundEffects.play('click');
                  }}
                  className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white"
                >
                  {EASING_STYLES.map(style => (
                    <option key={style} value={style}>
                      Enum.EasingStyle.{style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={easingDirectionId} className="text-gray-400 text-[11px] block mb-1">EasingDirection</label>
                <select
                  id={easingDirectionId}
                  value={easingDirection}
                  onChange={e => {
                    setEasingDirection(e.target.value as typeof EASING_DIRECTIONS[number]);
                    soundEffects.play('click');
                  }}
                  className="w-full bg-[#1e1e1e] border border-[#3e3e42] rounded px-3 py-1.5 text-white"
                >
                  {EASING_DIRECTIONS.map(dir => (
                    <option key={dir} value={dir}>
                      Enum.EasingDirection.{dir}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Animation duration & Hover Scale */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-gray-400 text-[11px] mb-1">
                  <label htmlFor={durationId}>Tween Duration</label>
                  <span className="font-mono text-white">{duration}s</span>
                </div>
                <input
                  id={durationId}
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={duration}
                  onChange={e => setDuration(parseFloat(e.target.value))}
                  className="w-full accent-[#00a2ff]"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-400 text-[11px] mb-1">
                  <label htmlFor={hoverScaleId}>Hover Scale</label>
                  <span className="font-mono text-white">{hoverScale}x</span>
                </div>
                <input
                  id={hoverScaleId}
                  type="range"
                  min="1.0"
                  max="1.25"
                  step="0.02"
                  value={hoverScale}
                  onChange={e => setHoverScale(parseFloat(e.target.value))}
                  className="w-full accent-[#00a2ff]"
                />
              </div>

              <div>
                <span className="text-gray-400 text-[11px] block mb-1">Click Feedback Effect</span>
                <div className="flex gap-2">
                  {(['bounce', 'squish', 'none'] as const).map(eff => (
                    <button
                      key={eff}
                      type="button"
                      onClick={() => {
                        setClickEffect(eff);
                        soundEffects.play('click');
                      }}
                      className={`flex-1 py-1 rounded border text-center capitalize transition ${
                        clickEffect === eff
                          ? 'bg-[#007acc] text-white border-[#007acc] font-semibold'
                          : 'bg-[#1e1e1e] text-gray-400 border-[#3c3c3c]'
                      }`}
                    >
                      {eff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Generated Code Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs flex items-center space-x-1.5">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Generated Roblox Luau TweenService Script</span>
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-[#2d2d30] hover:bg-[#38383c] border border-[#444] rounded text-white flex items-center space-x-1.5 transition text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Script!' : 'Copy Luau Script'}</span>
              </button>
            </div>

            <pre className="bg-[#141416] border border-[#2e2e32] rounded-lg p-3 text-[11px] font-mono text-gray-300 max-h-44 overflow-y-auto overflow-x-auto leading-relaxed">
              <code>{luauScript}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between text-xs text-gray-400">
          <span>Targeting: <strong className="text-white">{targetName}</strong></span>
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
