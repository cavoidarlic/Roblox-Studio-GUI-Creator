import React, { useState } from 'react';
import {
  Upload,
  Copy,
  Check,
  X,
  FileCode,
  Info,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { parseLuauScript, ParsedLuauScript } from '../utils/luauParser';
import { RobloxElement } from '../types/roblox';

interface LoadScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsed: ParsedLuauScript) => void;
}

export const LoadScriptModal: React.FC<LoadScriptModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [scriptText, setScriptText] = useState<string>('');
  const [parsed, setParsed] = useState<ParsedLuauScript | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.match(/\.(lua|luau)$/i)) {
      setImportError('Please select a .lua or .luau script file.');
      return;
    }
    setFile(selectedFile);
    setImportError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setScriptText(text);
    };
    reader.onerror = () => {
      setImportError('Failed to read the selected file.');
    };
    reader.readAsText(selectedFile);
    e.target.value = '';
  };

  const handleParse = () => {
    if (!scriptText) return;
    setIsParsing(true);
    setImportError(null);
    try {
      const result = parseLuauScript(scriptText);
      setParsed(result);
      if (result.warnings.length > 0) {
        setImportError(result.warnings.join('\n'));
      }
    } catch (err: any) {
      setImportError(`Parse error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (!parsed) return;
    onImport(parsed);
    onClose();
  };

  if (!isOpen) return null;

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
            <div className="p-1.5 rounded-lg bg-[#00a2ff]/20 text-[#00a2ff]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Load Roblox Luau Script</h2>
              <p className="text-[11px] text-gray-400">
                Import a previously exported .lua / .luau script to rebuild GUI elements on the canvas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close load script modal"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3e3e42]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Selection */}
        <div className="p-4 bg-[#1e1e1e] border-b border-[#3c3c3c] flex flex-col gap-3">
          <div className="flex items-center space-x-3">
            <label
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded-lg text-sm font-medium text-white cursor-pointer transition"
            >
              <Upload className="w-4 h-4 text-[#00a2ff]" />
              <span>{file ? file.name : 'Select .lua / .luau file'}</span>
            </label>
            <input
              type="file"
              accept=".lua,.luau"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file && (
              <button
                onClick={handleParse}
                disabled={isParsing}
                className="px-4 py-2.5 bg-[#107c41] hover:bg-[#158f4b] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition flex items-center space-x-1.5"
              >
                {isParsing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isParsing ? 'Parsing...' : 'Parse Script'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Parsing Results */}
        {parsed && (
          <div className="flex-1 overflow-auto p-4 bg-[#141416] text-xs">
            <div className="flex items-center space-x-2 mb-3 text-xs font-semibold text-gray-300 border-b border-[#3c3c3c] pb-1">
              <FileCode className="w-4 h-4 text-[#00a2ff]" />
              <span>Import Preview</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Root Type</div>
                <div className="text-sm text-white font-mono">{parsed.rootType}</div>
              </div>
              <div className="p-3 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Elements</div>
                <div className="text-sm text-white font-mono">{parsed.elements.length}</div>
              </div>
            </div>
            <div className="mb-3">
              <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Elements to Import</div>
              <ul className="text-xs text-gray-300 space-y-1 max-h-32 overflow-y-auto font-mono pl-4">
                {parsed.elements.map((el, i) => (
                  <li key={el.id || i} className="flex items-center space-x-2">
                    <span className="text-[#00a2ff]">{el.type}</span>
                    <span className="text-gray-400">{el.name}</span>
                    {el.parentId && <span className="text-gray-500 text-[10px]">(nested)</span>}
                  </li>
                ))}
                {parsed.elements.length === 0 && (
                  <li className="text-gray-500 italic">No elements found</li>
                )}
              </ul>
            </div>
            {parsed.warnings.length > 0 && (
              <div className="p-3 bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 rounded-lg text-[11px] text-red-400 mb-3">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Warnings:
                <ul className="mt-1 list-disc list-inside text-xs text-red-300">
                  {parsed.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Import Error */}
        {importError && !parsed && (
          <div className="p-4 bg-[#7f1d1d]/20 border border-[#7f1d1d]/40 rounded-lg text-[11px] text-red-400">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {importError}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#2d2d30] border-t border-[#3c3c3c] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Info className="w-3 h-3" />
            <span>
              {file ? `File: {file.name} ({(file.size / 1024).toFixed(1)} KB)` : 'No file selected'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#37373d] hover:bg-[#404048] text-white rounded border border-[#484852] font-medium transition"
            >
              Cancel
            </button>
            {parsed && (
              <button
                onClick={handleImport}
                className="px-4 py-1.5 bg-[#007acc] hover:bg-blue-600 text-white rounded font-medium shadow transition flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Import Elements</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};