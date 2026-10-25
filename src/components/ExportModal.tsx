import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  X,
  FileCode,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { RobloxElement } from '../types/roblox';
import { exportAllImagesAsZip } from '../utils/imageExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  luauScript: string;
  elements?: RobloxElement[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  luauScript,
  elements = []
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingImages, setIsExportingImages] = useState(false);

  const imageElements = elements.filter(
    el => (el.type === 'ImageLabel' || el.type === 'ImageButton') && el.image
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(luauScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = luauScript;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([luauScript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RobloxGui_${Date.now()}.lua`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
    >
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-[#00a2ff]/20 text-[#00a2ff]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Roblox Luau Script Export</h2>
              <p className="text-[11px] text-gray-400">
                Ready-to-use Roblox Luau code. Paste into a LocalScript in StarterGui.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close export modal"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3e3e42]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-3 bg-[#1e1e1e] border-b border-[#3c3c3c] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1.5 text-gray-400">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Full instance hierarchy, UDim2 transforms, and attached layout modifiers.</span>
          </div>

          <div className="flex items-center space-x-2">
            {imageElements.length > 0 && (
              <button
                onClick={async () => {
                  setIsExportingImages(true);
                  try {
                    await exportAllImagesAsZip(elements);
                  } finally {
                    setIsExportingImages(false);
                  }
                }}
                disabled={isExportingImages}
                title="Download all ImageLabel / ImageButton images as a ZIP archive for Roblox Studio Asset Manager"
                className="px-3 py-1.5 bg-[#1b3d2f] hover:bg-[#234e3c] text-emerald-300 hover:text-white border border-emerald-600/40 rounded font-medium flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isExportingImages ? 'Exporting...' : `Export ${imageElements.length} Images (.zip)`}</span>
              </button>
            )}

            <button
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-[#2d2d30] hover:bg-[#37373d] text-gray-200 hover:text-white border border-[#3c3c3c] rounded font-medium flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download .lua</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded font-semibold flex items-center space-x-1.5 shadow-sm transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#007acc] hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Luau Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#141416] font-mono text-xs select-text">
          <pre className="text-emerald-400 whitespace-pre leading-relaxed font-mono">
            {luauScript}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#2d2d30] border-t border-[#3c3c3c] flex items-center justify-between text-xs">
          <span className="text-gray-400">
            Tip: In Roblox Studio, add a <code className="text-white bg-black/40 px-1 py-0.5 rounded">LocalScript</code> inside <code className="text-white bg-black/40 px-1 py-0.5 rounded">StarterPlayerScripts</code>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#37373d] hover:bg-[#404048] text-white rounded border border-[#484852] font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
