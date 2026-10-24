import React, { useState } from 'react';
import {
  RobloxElement,
  RobloxElementType,
  ModifierType,
  GuiRootType
} from '../types/roblox';
import {
  FolderTree,
  Plus,
  Square,
  Scroll,
  Box,
  Type,
  MousePointerClick,
  TextCursor,
  Image as ImageIcon,
  Circle,
  SquareCode,
  Sliders,
  Maximize2,
  ListOrdered,
  LayoutGrid,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  Sparkles,
  Layers,
  GripVertical,
  CornerDownRight
} from 'lucide-react';
import { canReparent, canReparentAll, DropPosition, isDescendant } from '../utils/hierarchy';
import { soundEffects } from '../utils/soundEffects';

interface ExplorerSidebarProps {
  rootType: GuiRootType;
  elements: RobloxElement[];
  selectedId: string | null;
  selectedIds?: string[];
  selectedModifierKey: ModifierType | null;
  onSelectElement: (id: string | null, modKey?: ModifierType | null, isMulti?: boolean) => void;
  onAddElement: (type: RobloxElementType) => void;
  onAddModifier: (modType: ModifierType) => void;
  onRemoveModifier: (elementId: string, modKey: ModifierType) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onClearAll: () => void;
  onReparentElement?: (draggedIds: string[], targetId: string | null, position: DropPosition) => void;
  onClose?: () => void;
}

export const ExplorerSidebar: React.FC<ExplorerSidebarProps> = ({
  rootType,
  elements,
  selectedId,
  selectedIds = [],
  selectedModifierKey,
  onSelectElement,
  onAddElement,
  onAddModifier,
  onRemoveModifier,
  onDeleteElement,
  onDuplicateElement,
  onToggleVisibility,
  onClearAll,
  onReparentElement,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Drag and drop hierarchy state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string | null;
    position: DropPosition;
  } | null>(null);

  const autoExpandTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getElementIcon = (type: RobloxElementType) => {
    switch (type) {
      case 'TextLabel':
        return <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'TextButton':
        return <MousePointerClick className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
      case 'TextBox':
        return <TextCursor className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
      case 'ImageLabel':
      case 'ImageButton':
        return <ImageIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
      case 'ScrollingFrame':
        return <Scroll className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'ViewportFrame':
        return <Box className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'Frame':
      default:
        return <Square className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  const getModifierIcon = (modKey: ModifierType) => {
    switch (modKey) {
      case 'UICorner':
        return <Circle className="w-3 h-3 text-orange-400 shrink-0" />;
      case 'UIStroke':
        return <SquareCode className="w-3 h-3 text-indigo-400 shrink-0" />;
      case 'UIGradient':
        return <Sliders className="w-3 h-3 text-cyan-400 shrink-0" />;
      case 'UIPadding':
        return <Maximize2 className="w-3 h-3 text-emerald-400 shrink-0" />;
      case 'UIAspectRatioConstraint':
        return <Maximize2 className="w-3 h-3 text-blue-400 shrink-0" />;
      case 'UIListLayout':
        return <ListOrdered className="w-3 h-3 text-red-400 shrink-0" />;
      case 'UIGridLayout':
        return <LayoutGrid className="w-3 h-3 text-yellow-400 shrink-0" />;
      default:
        return <Sparkles className="w-3 h-3 text-gray-400 shrink-0" />;
    }
  };

  const filteredElements = searchQuery.trim()
    ? elements.filter(el =>
        el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        el.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : elements;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverTarget(null);
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
  };

  const handleDragOverItem = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId) return;

    // Cycle check: can draggedId be reparented into targetId?
    const isValid = canReparent(draggedId, targetId, elements);
    if (!isValid) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const pct = relY / rect.height;

    let pos: DropPosition = 'inside';
    if (pct < 0.25) {
      pos = 'before';
    } else if (pct > 0.75) {
      pos = 'after';
    } else {
      pos = 'inside';
    }

    if (dragOverTarget?.id !== targetId || dragOverTarget?.position !== pos) {
      setDragOverTarget({ id: targetId, position: pos });

      // If hovering in the middle (inside) on a node with children that is collapsed, auto-expand after 600ms
      if (autoExpandTimerRef.current) {
        clearTimeout(autoExpandTimerRef.current);
        autoExpandTimerRef.current = null;
      }
      if (pos === 'inside' && collapsedNodes[targetId]) {
        autoExpandTimerRef.current = setTimeout(() => {
          setCollapsedNodes(prev => ({ ...prev, [targetId]: false }));
        }, 600);
      }
    }
  };

  const handleDragLeaveItem = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTarget?.id === targetId) {
      // Don't clear immediately if moving within the element's children
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !e.currentTarget.contains(related)) {
        setDragOverTarget(null);
      }
    }
  };

  const handleDropOnItem = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }

    if (!draggedId) return;
    const idsToMove = selectedIds.includes(draggedId) ? selectedIds : [draggedId];

    // Filter out the target itself and any dragged element that is an ancestor of
    // the target (would create a cycle). reorderAndReparent already handles this,
    // but canReparentAll rejects the whole batch if ANY element is invalid, so we
    // pre-filter here to avoid blocking valid reparenting of sibling elements.
    const validIds = idsToMove.filter(id => {
      if (id === targetId) return false;
      if (targetId && isDescendant(targetId, id, elements)) return false;
      return true;
    });

    if (validIds.length === 0) {
      setDraggedId(null);
      setDragOverTarget(null);
      return;
    }

    if (!canReparentAll(validIds, targetId, elements)) {
      soundEffects.play('error');
      setDraggedId(null);
      setDragOverTarget(null);
      return;
    }

    const position = dragOverTarget?.id === targetId ? dragOverTarget.position : 'inside';

    if (position === 'inside') {
      // Auto-expand the target so children are immediately visible
      setCollapsedNodes(prev => ({ ...prev, [targetId]: false }));
    }

    onReparentElement?.(validIds, targetId, position);
    setDraggedId(null);
    setDragOverTarget(null);
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTarget?.id !== null || dragOverTarget?.position !== 'inside') {
      setDragOverTarget({ id: null, position: 'inside' });
    }
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId) return;

    const idsToMove = selectedIds.includes(draggedId) ? selectedIds : [draggedId];
    onReparentElement?.(idsToMove, null, 'inside');
    setDraggedId(null);
    setDragOverTarget(null);
  };

  const renderTree = (
    parentId: string | null = null,
    depth = 0,
    visited = new Set<string>()
  ): React.ReactNode => {
    // Hard depth limit to safeguard against unexpected cycles or overflow
    if (depth > 40) return null;

    const children = elements.filter(el => {
      if (parentId === null) {
        return !el.parentId || el.parentId === null || !elements.some(p => p.id === el.parentId);
      }
      return el.parentId === parentId;
    });

    if (children.length === 0) return null;

    return (
      <div className="space-y-0.5">
        {children.map(el => {
          // Cycle protection: if this element is already an ancestor in this branch, avoid infinite recursion
          if (visited.has(el.id)) {
            return null;
          }
          const nextVisited = new Set(visited);
          nextVisited.add(el.id);

          const isSelected = selectedId === el.id && !selectedModifierKey;
          const isMultiSelected = selectedIds.includes(el.id);
          const hasChildren = elements.some(
            child => child.parentId === el.id && child.id !== el.id && !nextVisited.has(child.id)
          );
          const isCollapsed = !!collapsedNodes[el.id];
          const hasModifiers = el.modifiers && Object.keys(el.modifiers).length > 0;
          const isBeingDragged = draggedId === el.id;

          const isOverThis = dragOverTarget?.id === el.id;
          const dropPos = isOverThis ? dragOverTarget.position : null;

          if (searchQuery.trim() && !filteredElements.some(f => f.id === el.id)) {
            return null;
          }

          // Build class names for drag over indicators
          let dropHighlightClass = '';
          if (isOverThis) {
            if (dropPos === 'inside') {
              dropHighlightClass = 'bg-[#007acc]/25 ring-2 ring-[#00a2ff] shadow-inner';
            } else if (dropPos === 'before') {
              dropHighlightClass = 'border-t-2 border-[#00a2ff] bg-[#00a2ff]/10';
            } else if (dropPos === 'after') {
              dropHighlightClass = 'border-b-2 border-[#00a2ff] bg-[#00a2ff]/10';
            }
          }

          return (
            <div key={el.id} className="select-none">
              <div
                draggable={true}
                onDragStart={e => handleDragStart(e, el.id)}
                onDragEnd={handleDragEnd}
                onDragOver={e => handleDragOverItem(e, el.id)}
                onDragLeave={e => handleDragLeaveItem(e, el.id)}
                onDrop={e => handleDropOnItem(e, el.id)}
                onClick={e => {
                  onSelectElement(el.id, null, e.shiftKey);
                }}
                style={{ paddingLeft: `${depth * 14 + 6}px` }}
                className={`group relative flex items-center justify-between py-1 pr-1.5 rounded cursor-pointer text-xs transition ${
                  isBeingDragged ? 'opacity-40 border border-dashed border-gray-500' : ''
                } ${dropHighlightClass} ${
                  isSelected && !isOverThis
                    ? 'bg-[#007acc] text-white font-medium'
                    : isMultiSelected && !isOverThis
                    ? 'bg-[#007acc]/30 text-amber-300 font-medium border-l-2 border-amber-400'
                    : !isOverThis
                    ? 'text-gray-300 hover:bg-[#2a2d2e] hover:text-white'
                    : ''
                }`}
              >
                {/* Visual before/after dot indicator */}
                {isOverThis && dropPos === 'before' && (
                  <div className="absolute -top-1 left-1 w-2 h-2 rounded-full bg-[#00a2ff] shadow" />
                )}
                {isOverThis && dropPos === 'after' && (
                  <div className="absolute -bottom-1 left-1 w-2 h-2 rounded-full bg-[#00a2ff] shadow" />
                )}

                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  {/* Drag handle grip */}
                  <span title="Drag to reparent or reorder" className="shrink-0 flex items-center">
                    <GripVertical
                      className="w-3 h-3 text-gray-500/50 group-hover:text-gray-400 cursor-grab active:cursor-grabbing -mr-0.5"
                    />
                  </span>

                  {hasChildren || hasModifiers ? (
                    <button
                      onClick={e => toggleCollapse(el.id, e)}
                      className="p-0.5 text-gray-400 hover:text-white rounded"
                      aria-label="Toggle children"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    <span className="w-3 shrink-0" />
                  )}

                  {getElementIcon(el.type)}
                  <span className="truncate">{el.name}</span>

                  {/* Drop as child indicator badge */}
                  {isOverThis && dropPos === 'inside' && (
                    <span className="ml-1.5 px-1 py-0.2 bg-[#00a2ff] text-white text-[9px] rounded font-semibold flex items-center space-x-0.5 shrink-0 shadow-sm">
                      <CornerDownRight className="w-2.5 h-2.5" />
                      <span>Child</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onDuplicateElement && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDuplicateElement(el.id);
                      }}
                      title="Duplicate element (Ctrl+D)"
                      aria-label="Duplicate element"
                      className="p-0.5 text-gray-400 hover:text-[#00a2ff]"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleVisibility(el.id);
                    }}
                    title={el.visible ? 'Hide element' : 'Show element'}
                    aria-label="Toggle element visibility"
                    className="p-0.5 text-gray-400 hover:text-white"
                  >
                    {el.visible !== false ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-red-400" />
                    )}
                  </button>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteElement(el.id);
                    }}
                    title="Delete element"
                    aria-label="Delete element"
                    className="p-0.5 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Render Modifiers as sub-nodes if not collapsed */}
              {!isCollapsed && hasModifiers && (
                <div className="space-y-0.5">
                  {(Object.keys(el.modifiers) as ModifierType[]).map(modKey => {
                    const isModSelected =
                      selectedId === el.id && selectedModifierKey === modKey;

                    return (
                      <div
                        key={modKey}
                        onClick={() => onSelectElement(el.id, modKey)}
                        style={{ paddingLeft: `${(depth + 1) * 14 + 18}px` }}
                        className={`group flex items-center justify-between py-0.5 pr-1.5 rounded cursor-pointer text-[11px] transition ${
                          isModSelected
                            ? 'bg-[#005fb8] text-white font-semibold'
                            : 'text-gray-400 hover:bg-[#2a2d2e]/80 hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          {getModifierIcon(modKey)}
                          <span className="truncate">{modKey}</span>
                        </div>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onRemoveModifier(el.id, modKey);
                          }}
                          title={`Remove ${modKey}`}
                          aria-label={`Remove ${modKey}`}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Render Nested Children if not collapsed */}
              {!isCollapsed && renderTree(el.id, depth + 1, nextVisited)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-full lg:w-64 bg-[#252526] border-r border-[#3c3c3c] flex flex-col shrink-0 select-none overflow-hidden">
      {/* Explorer Header */}
      <div className="h-8 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-2.5 text-xs font-semibold text-gray-300">
        <div className="flex items-center space-x-1.5">
          <FolderTree className="w-3.5 h-3.5 text-[#00a2ff]" />
          <span>Explorer</span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onClearAll}
            title="Clear all canvas elements"
            className="text-gray-400 hover:text-red-400 px-1 py-0.5 rounded text-[11px] flex items-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Collapse Explorer sidebar"
              aria-label="Collapse Explorer"
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#37373d]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Insert Object Quick Palette */}
      <div className="p-2 border-b border-[#3c3c3c] bg-[#1e1e1e]/60 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Insert UI Object</span>
          <Plus className="w-3 h-3 text-[#00a2ff]" />
        </div>

        <div className="grid grid-cols-2 gap-1 text-xs">
          <button
            onClick={() => onAddElement('Frame')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <Square className="w-3 h-3 text-blue-400" />
            <span className="truncate">Frame</span>
          </button>

          <button
            onClick={() => onAddElement('ScrollingFrame')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <Scroll className="w-3 h-3 text-purple-400" />
            <span className="truncate">ScrollFrame</span>
          </button>

          <button
            onClick={() => onAddElement('TextLabel')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <Type className="w-3 h-3 text-amber-400" />
            <span className="truncate">TextLabel</span>
          </button>

          <button
            onClick={() => onAddElement('TextButton')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <MousePointerClick className="w-3 h-3 text-yellow-400" />
            <span className="truncate">TextButton</span>
          </button>

          <button
            onClick={() => onAddElement('TextBox')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <TextCursor className="w-3 h-3 text-teal-400" />
            <span className="truncate">TextBox</span>
          </button>

          <button
            onClick={() => onAddElement('ImageLabel')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <ImageIcon className="w-3 h-3 text-pink-400" />
            <span className="truncate">ImageLabel</span>
          </button>

          <button
            onClick={() => onAddElement('ImageButton')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <ImageIcon className="w-3 h-3 text-rose-400" />
            <span className="truncate">ImageButton</span>
          </button>

          <button
            onClick={() => onAddElement('ViewportFrame')}
            className="p-1.5 bg-[#2d2d30] hover:bg-[#37373d] hover:border-[#007acc] border border-[#3c3c3c] rounded text-left flex items-center space-x-1.5 transition text-gray-200"
          >
            <Box className="w-3 h-3 text-emerald-400" />
            <span className="truncate">Viewport</span>
          </button>
        </div>

        {/* Modifiers & Layouts section */}
        <div className="pt-1.5 border-t border-[#3c3c3c]/60">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Modifiers & Layouts
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              onClick={() => onAddModifier('UICorner')}
              title="Add rounded corners to selected element"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <Circle className="w-2.5 h-2.5 text-orange-400 shrink-0" />
              <span className="truncate">UICorner</span>
            </button>

            <button
              onClick={() => onAddModifier('UIStroke')}
              title="Add border outline stroke to selected element"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <SquareCode className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
              <span className="truncate">UIStroke</span>
            </button>

            <button
              onClick={() => onAddModifier('UIGradient')}
              title="Add color gradient to selected element"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <Sliders className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              <span className="truncate">UIGradient</span>
            </button>

            <button
              onClick={() => onAddModifier('UIPadding')}
              title="Add inner padding to selected element"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <Maximize2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span className="truncate">UIPadding</span>
            </button>

            <button
              onClick={() => onAddModifier('UIAspectRatioConstraint')}
              title="Lock width-to-height aspect ratio"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <Maximize2 className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="truncate">UIAspectLock</span>
            </button>

            <button
              onClick={() => onAddModifier('UIListLayout')}
              title="Auto-arrange children in a vertical or horizontal list"
              className="p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-gray-300 flex items-center space-x-1"
            >
              <ListOrdered className="w-2.5 h-2.5 text-red-400 shrink-0" />
              <span className="truncate">UIListLayout</span>
            </button>

            <button
              onClick={() => onAddModifier('UIGridLayout')}
              title="Auto-arrange children in a 2D responsive grid"
              className="col-span-2 p-1 bg-[#2d2d30] hover:bg-[#37373d] border border-[#3c3c3c] rounded text-left truncate text-yellow-300 font-medium flex items-center space-x-1"
            >
              <LayoutGrid className="w-3 h-3 text-yellow-400 shrink-0" />
              <span className="truncate">UIGridLayout (Grid Arrangement)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-1.5 border-b border-[#3c3c3c] bg-[#1e1e1e]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter explorer..."
            className="w-full bg-[#252526] border border-[#3c3c3c] rounded pl-7 pr-2 py-0.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#007acc]"
          />
        </div>
      </div>

      {/* Tree Hierarchy */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {/* Root Element (ScreenGui / SurfaceGui / BillboardGui) */}
        <div
          onClick={() => onSelectElement(null, null)}
          onDragOver={handleDragOverRoot}
          onDrop={handleDropOnRoot}
          className={`flex items-center space-x-2 py-1 px-2 rounded cursor-pointer text-xs transition relative ${
            dragOverTarget?.id === null
              ? 'bg-[#007acc]/25 ring-2 ring-[#00a2ff] text-white shadow-inner font-medium'
              : selectedId === null
              ? 'bg-[#007acc] text-white font-semibold'
              : 'text-gray-200 hover:bg-[#2a2d2e]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#00a2ff]" />
          <span>{rootType}</span>
          {dragOverTarget?.id === null && (
            <span className="ml-1 text-[9px] bg-[#00a2ff] text-white px-1.5 py-0.5 rounded font-mono font-semibold">
              ↳ Make Root
            </span>
          )}
          <span className="text-[10px] text-gray-400 ml-auto font-mono">
            ({elements.length})
          </span>
        </div>

        {/* Child Elements Tree */}
        {elements.length > 0 ? (
          renderTree(null, 0)
        ) : (
          <div className="p-4 text-center text-xs text-gray-500 italic">
            Canvas is empty. Click an object above to insert.
          </div>
        )}

        {/* Drag-to-Root Drop Area when dragging */}
        {draggedId && (
          <div
            onDragOver={handleDragOverRoot}
            onDrop={handleDropOnRoot}
            className={`mt-2 py-2.5 px-2 border border-dashed rounded text-center text-[10px] transition ${
              dragOverTarget?.id === null
                ? 'border-[#00a2ff] bg-[#007acc]/20 text-[#00a2ff] font-semibold ring-1 ring-[#00a2ff]'
                : 'border-[#3c3c3c] text-gray-400 hover:border-gray-500 hover:text-gray-300'
            }`}
          >
            Drop here to unparent to Root ({rootType})
          </div>
        )}
      </div>
    </aside>
  );
};
