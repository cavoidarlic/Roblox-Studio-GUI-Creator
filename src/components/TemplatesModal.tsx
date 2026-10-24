import React from 'react';
import { GUI_TEMPLATES, GuiTemplate } from '../data/templates';
import {
  Sparkles,
  X,
  Heart,
  ShoppingBag,
  MessageSquare,
  Trophy,
  CheckCircle2
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GuiTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  if (!isOpen) return null;

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'HUD':
        return <Heart className="w-5 h-5 text-emerald-400" />;
      case 'Inventory':
        return <ShoppingBag className="w-5 h-5 text-blue-400" />;
      case 'Dialogue':
        return <MessageSquare className="w-5 h-5 text-amber-400" />;
      case 'Leaderboard':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none"
    >
      <div className="bg-[#252526] border border-[#3c3c3c] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Roblox GUI Starter Templates</h2>
              <p className="text-[11px] text-gray-400">
                Choose a pre-built Roblox GUI layout with styled elements and layouts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close templates modal"
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#3e3e42]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {GUI_TEMPLATES.map(tpl => (
            <div
              key={tpl.id}
              className="p-3.5 bg-[#1e1e1e] hover:bg-[#28282e] border border-[#3c3c3c] hover:border-[#00a2ff]/60 rounded-xl flex items-center justify-between gap-4 transition shadow-sm group"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-lg bg-[#252526] border border-[#3c3c3c] group-hover:border-[#00a2ff]/40 transition">
                  {getTemplateIcon(tpl.category)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-white text-sm group-hover:text-[#00a2ff] transition">
                      {tpl.name}
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2d2d30] text-gray-300 border border-[#3c3c3c]">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                  <div className="text-[11px] text-gray-500 mt-1 font-mono">
                    Includes {tpl.elements.length} nested elements with modifiers
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectTemplate(tpl);
                  onClose();
                }}
                aria-label={`Load ${tpl.name} template`}
                className="px-3.5 py-2 bg-[#007acc] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shrink-0 shadow-sm transition flex items-center space-x-1.5"
              >
                <span>Load Template</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#2d2d30] border-t border-[#3c3c3c] flex justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#37373d] hover:bg-[#404048] text-white rounded border border-[#484852] font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
