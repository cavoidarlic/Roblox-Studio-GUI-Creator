/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RobloxElement,
  RobloxElementType,
  ModifierType,
  GuiRootType,
  RootProperties,
  ViewportState,
  ProjectState,
  GridSettings
} from './types/roblox';
import {
  calculatePixelBounds,
  calculateAbsolutePixelBounds,
  convertToScale,
  convertToParentScale,
  convertToScreenGuiScale,
  convertToOffset,
  convertElementToOffset,
  getParentPixelSize,
  generateLuauScript,
  alignElements
} from './utils/robloxMath';
import { parseLuauScript } from './utils/luauParser';
import { reorderAndReparent, DropPosition, sanitizeHierarchy, getAllDescendantIds } from './utils/hierarchy';
import { LoadScriptModal } from './components/LoadScriptModal';
import {
  saveToLocalCache,
  loadFromLocalCache,
  clearLocalCache,
  getAutosaveSetting,
  setAutosaveSetting,
  getAutosaveMetadata
} from './utils/autosaveCache';
import { soundEffects } from './utils/soundEffects';
import { GUI_TEMPLATES, GuiTemplate } from './data/templates';
import { TopHeader } from './components/TopHeader';
import { ExplorerSidebar } from './components/ExplorerSidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ThreeDWorldPreview } from './components/ThreeDWorldPreview';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { TemplatesModal } from './components/TemplatesModal';
import { RatioCalculatorModal } from './components/RatioCalculatorModal';
import { TweenServiceModal } from './components/TweenServiceModal';
import { AlignmentBar } from './components/AlignmentBar';
import {
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Sliders,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const INITIAL_ROOT_PROPERTIES: RootProperties = {
  ScreenGui: {
    Name: 'ScreenGui',
    ResetOnSpawn: true,
    IgnoreGuiInset: false,
    ZIndexBehavior: 'Sibling',
    DisplayOrder: 0
  },
  SurfaceGui: {
    Name: 'SurfaceGui',
    Face: 'Front',
    CanvasSize: { x: 800, y: 600 },
    AlwaysOnTop: false,
    AdorneePart: 'workspace.Part',
    LightInfluence: 0
  },
  BillboardGui: {
    Name: 'BillboardGui',
    Size: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 50 },
    StudsOffset: { x: 0, y: 3, z: 0 },
    AlwaysOnTop: true,
    MaxDistance: 100,
    AdorneePart: 'player.Character:WaitForChild("Head")'
  }
};

const INITIAL_VIEWPORT: ViewportState = {
  width: 1280,
  height: 720,
  preset: '1280x720',
  zoom: 1.0,
  panX: 0,
  panY: 0,
  showSafeInsets: true
};

export default function App() {
  const [rootType, setRootType] = useState<GuiRootType>('ScreenGui');
  const [rootProperties, setRootProperties] = useState<RootProperties>(INITIAL_ROOT_PROPERTIES);
  const [elements, setElements] = useState<RobloxElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedModifierKey, setSelectedModifierKey] = useState<ModifierType | null>(null);
  const [viewport, setViewport] = useState<ViewportState>(INITIAL_VIEWPORT);
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(true);

  // Snapping Grid & Audio Settings
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: false,
    step: 16,
    showGrid: true
  });
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<RobloxElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Copy / Paste Clipboard
  const [clipboard, setClipboard] = useState<{
    roots: RobloxElement[];
    allElements: RobloxElement[];
  } | null>(null);

  // Modals & Notifications
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAnimationsOpen, setIsAnimationsOpen] = useState(false);
  const [isLoadScriptOpen, setIsLoadScriptOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Autosave state
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number | null>(null);
  const [autosaveEnabled, setAutosaveEnabledState] = useState<boolean>(true);
  const [hasCachedData, setHasCachedData] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextIdCounter = useRef(20);
  const autosaveTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Push to history
  const pushHistory = useCallback(
    (newElements: RobloxElement[]) => {
      setHistory(prev => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, JSON.parse(JSON.stringify(newElements))];
      });
      setHistoryIndex(prev => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setElements(JSON.parse(JSON.stringify(history[prevIdx])));
      setHistoryIndex(prevIdx);
      showToast('Undo');
    }
  }, [history, historyIndex, showToast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setElements(JSON.parse(JSON.stringify(history[nextIdx])));
      setHistoryIndex(nextIdx);
      showToast('Redo');
    }
  }, [history, historyIndex, showToast]);

  // Initial history push
  useEffect(() => {
    setHistory([[]]);
    setHistoryIndex(0);
  }, []);

  // Autosave: load user preference and check for existing cache on mount
  useEffect(() => {
    const savedEnabled = getAutosaveSetting();
    setAutosaveEnabledState(savedEnabled);

    const metadata = getAutosaveMetadata();
    setHasCachedData(metadata.exists);

    // If autosave is enabled and there is cached data, restore it automatically
    if (savedEnabled && metadata.exists && metadata.timestamp) {
      const cached = loadFromLocalCache();
      if (cached && cached.elements && cached.elements.length > 0) {
        setRootType(cached.rootType);
        if (cached.rootProperties) setRootProperties(cached.rootProperties);
        if (cached.viewport) setViewport(cached.viewport);
        if (cached.gridSettings) setGridSettings(cached.gridSettings);
        setElements(cached.elements);
        setSelectedId(cached.selectedId);
        setSelectedIds(cached.selectedId ? [cached.selectedId] : []);
        setSelectedModifierKey(cached.selectedModifierKey);
        setIsAudioEnabled(cached.isAudioEnabled ?? true);
        setLastSavedTimestamp(cached.timestamp);
        pushHistory(cached.elements);
        showToast(`Autosave restored (${cached.elements.length} elements)`);
      }
    }
  }, []);

  // Update elements helper with history
  const updateElementsWithHistory = useCallback(
    (updater: (prev: RobloxElement[]) => RobloxElement[], msg?: string) => {
      setElements(prev => {
        const updated = sanitizeHierarchy(updater(prev));
        pushHistory(updated);
        return updated;
      });
      if (msg) showToast(msg);
    },
    [pushHistory, showToast]
  );

  // Add Element
  const handleAddElement = useCallback(
    (type: RobloxElementType) => {
      const id = `el_${Date.now()}_${nextIdCounter.current++}`;
      const count = elements.filter(e => e.type === type).length + 1;
      const name = `${type}${count}`;

      // If a container is selected, insert as child
      let parentId: string | null = null;
      if (selectedId) {
        const sel = elements.find(e => e.id === selectedId);
        if (sel && ['Frame', 'ScrollingFrame', 'ViewportFrame'].includes(sel.type)) {
          parentId = sel.id;
        }
      }

      const newEl: RobloxElement = {
        id,
        name,
        type,
        parentId,
        visible: true,
        zIndex: 1,
        position: { scaleX: 0.1, offsetX: 0, scaleY: 0.1, offsetY: 0 },
        size: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 100 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {}
      };

      if (type === 'TextLabel') {
        newEl.text = 'TextLabel';
        newEl.textColor = '#ffffff';
        newEl.textSize = 16;
        newEl.font = 'SourceSans';
        newEl.backgroundTransparency = 1;
        newEl.size = { scaleX: 0, offsetX: 180, scaleY: 0, offsetY: 40 };
      } else if (type === 'TextButton') {
        newEl.text = 'Click Me';
        newEl.textColor = '#ffffff';
        newEl.textSize = 16;
        newEl.font = 'SourceSansBold';
        newEl.backgroundColor = '#00a2ff';
        newEl.size = { scaleX: 0, offsetX: 150, scaleY: 0, offsetY: 42 };
      } else if (type === 'TextBox') {
        newEl.text = '';
        newEl.placeholderText = 'Type here...';
        newEl.textColor = '#ffffff';
        newEl.textSize = 14;
        newEl.borderSizePixel = 1;
        newEl.borderColor = '#52525b';
        newEl.size = { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 36 };
      } else if (type === 'ImageLabel' || type === 'ImageButton') {
        newEl.image = 'https://placehold.co/300x200/22222b/ffffff?text=Roblox+Decal';
        newEl.imageColor = '#ffffff';
        newEl.imageTransparency = 0;
        newEl.scaleType = 'Stretch';
        newEl.backgroundTransparency = 1;
        newEl.size = { scaleX: 0, offsetX: 120, scaleY: 0, offsetY: 120 };
      } else if (type === 'ScrollingFrame') {
        newEl.canvasSize = { scaleX: 0, offsetX: 0, scaleY: 2, offsetY: 0 };
        newEl.scrollBarThickness = 8;
        newEl.size = { scaleX: 0, offsetX: 240, scaleY: 0, offsetY: 200 };
      } else if (type === 'ViewportFrame') {
        newEl.size = { scaleX: 0, offsetX: 180, scaleY: 0, offsetY: 180 };
      }

      updateElementsWithHistory(prev => {
        // If adding inside a selected container, insert right after the container's subtree
        if (parentId) {
          const parentIdx = prev.findIndex(e => e.id === parentId);
          if (parentIdx !== -1) {
            const descendants = new Set(getAllDescendantIds(parentId, prev));
            let insertAfterIdx = parentIdx;
            for (let i = parentIdx + 1; i < prev.length; i++) {
              if (descendants.has(prev[i].id)) {
                insertAfterIdx = i;
              }
            }
            const copy = [...prev];
            copy.splice(insertAfterIdx + 1, 0, newEl);
            return copy;
          }
        }
        return [...prev, newEl];
      }, `Added ${type}`);

      setSelectedId(id);
      setSelectedIds([id]);
      setSelectedModifierKey(null);
    },
    [elements, selectedId, updateElementsWithHistory]
  );

  // Add Modifier
  const handleAddModifier = useCallback(
    (modType: ModifierType) => {
      if (!selectedId) {
        showToast('Please select a GUI element first');
        return;
      }

      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== selectedId) return el;
          const updatedModifiers = { ...el.modifiers };

          if (modType === 'UICorner') {
            updatedModifiers.UICorner = { cornerRadiusOffset: 8, cornerRadiusScale: 0 };
          } else if (modType === 'UIStroke') {
            updatedModifiers.UIStroke = {
              color: '#00a2ff',
              thickness: 2,
              transparency: 0,
              applyStrokeMode: 'Border'
            };
          } else if (modType === 'UIGradient') {
            updatedModifiers.UIGradient = {
              color1: '#00a2ff',
              color2: '#005fb8',
              rotation: 90
            };
          } else if (modType === 'UIPadding') {
            updatedModifiers.UIPadding = { top: 8, bottom: 8, left: 8, right: 8 };
          } else if (modType === 'UIAspectRatioConstraint') {
            const bounds = calculatePixelBounds(el, { w: viewport.width, h: viewport.height });
            const ratio = Number((bounds.w / Math.max(1, bounds.h)).toFixed(3));
            updatedModifiers.UIAspectRatioConstraint = {
              aspectRatio: ratio,
              dominantAxis: 'Width',
              aspectType: 'FitWithinMaxSize'
            };
          } else if (modType === 'UIListLayout') {
            delete updatedModifiers.UIGridLayout;
            updatedModifiers.UIListLayout = {
              fillDirection: 'Vertical',
              padding: 6,
              horizontalAlignment: 'Left',
              verticalAlignment: 'Top'
            };
          } else if (modType === 'UIGridLayout') {
            delete updatedModifiers.UIListLayout;
            updatedModifiers.UIGridLayout = {
              cellSizeX: 80,
              cellSizeY: 80,
              cellPaddingX: 8,
              cellPaddingY: 8,
              fillDirection: 'Horizontal',
              maxCells: 0
            };
          }

          return { ...el, modifiers: updatedModifiers };
        });
      }, `Added ${modType}`);

      setSelectedModifierKey(modType);
    },
    [selectedId, updateElementsWithHistory, viewport.width, viewport.height, showToast]
  );

  // Remove Modifier
  const handleRemoveModifier = useCallback(
    (elementId: string, modKey: ModifierType) => {
      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== elementId) return el;
          const updated = { ...el.modifiers };
          delete updated[modKey];
          return { ...el, modifiers: updated };
        });
      }, `Removed ${modKey}`);

      if (selectedModifierKey === modKey) {
        setSelectedModifierKey(null);
      }
    },
    [selectedModifierKey, updateElementsWithHistory]
  );

  // Delete Element (and recursive children)
  const handleDeleteElement = useCallback(
    (id: string) => {
      const idsToDelete = new Set<string>([id]);
      const collectChildren = (parentId: string) => {
        elements
          .filter(e => e.parentId === parentId && !idsToDelete.has(e.id))
          .forEach(child => {
            idsToDelete.add(child.id);
            collectChildren(child.id);
          });
      };
      collectChildren(id);

      updateElementsWithHistory(
        prev => prev.filter(e => !idsToDelete.has(e.id)),
        'Deleted element'
      );

      if (idsToDelete.has(selectedId || '')) {
        setSelectedId(null);
        setSelectedModifierKey(null);
      }
    },
    [elements, selectedId, updateElementsWithHistory]
  );

  // Duplicate Element (handles single or multi-selection, including recursive children)
  const handleDuplicateSelected = useCallback((explicitTargetId?: string) => {
    let targetIds: string[] = [];
    if (explicitTargetId) {
      targetIds = [explicitTargetId];
    } else if (selectedIds.length > 0) {
      targetIds = selectedIds;
    } else if (selectedId) {
      targetIds = [selectedId];
    }

    if (targetIds.length === 0) return;

    // Filter target roots to avoid duplicating descendants twice if both parent and child were selected
    const rootTargetIds = targetIds.filter(id => {
      let curr = elements.find(e => e.id === id);
      while (curr && curr.parentId) {
        if (targetIds.includes(curr.parentId)) return false;
        curr = elements.find(e => e.id === curr?.parentId);
      }
      return true;
    });

    if (rootTargetIds.length === 0) return;

    // Track the new items to insert and where to insert them
    const newCreatedElements: RobloxElement[] = [];
    const newSelectedIds: string[] = [];

    // Helper to recursively duplicate an element and its children
    const duplicateRecursive = (origId: string, newParentId: string | null, isRootOfDuplication: boolean): string => {
      const orig = elements.find(e => e.id === origId);
      if (!orig) return '';

      const newId = `el_${Date.now()}_${nextIdCounter.current++}`;
      const clone: RobloxElement = JSON.parse(JSON.stringify(orig));
      clone.id = newId;
      clone.name = isRootOfDuplication ? `${orig.name}_Copy` : orig.name;
      clone.parentId = newParentId;

      if (isRootOfDuplication) {
        clone.position.offsetX += 16;
        clone.position.offsetY += 16;
        newSelectedIds.push(newId);
      }

      newCreatedElements.push(clone);

      const children = elements.filter(c => c.parentId === origId);
      children.forEach(child => {
        duplicateRecursive(child.id, newId, false);
      });

      return newId;
    };

    rootTargetIds.forEach(id => {
      const orig = elements.find(e => e.id === id);
      if (orig) {
        duplicateRecursive(id, orig.parentId, true);
      }
    });

    if (newCreatedElements.length === 0) return;

    const toastMsg = rootTargetIds.length === 1
      ? `Duplicated ${elements.find(e => e.id === rootTargetIds[0])?.name || 'element'}`
      : `Duplicated ${rootTargetIds.length} elements`;

    soundEffects.play('click');

    // Place the cloned elements immediately after the original element & its descendants in tree order
    updateElementsWithHistory(prev => {
      const result = [...prev];
      const lastRootId = rootTargetIds[rootTargetIds.length - 1];
      const lastRootIdx = result.findIndex(e => e.id === lastRootId);

      if (lastRootIdx === -1) {
        return [...result, ...newCreatedElements];
      }

      const allDescendants = new Set(getAllDescendantIds(lastRootId, result));
      let insertAfterIdx = lastRootIdx;
      for (let i = lastRootIdx + 1; i < result.length; i++) {
        if (allDescendants.has(result[i].id)) {
          insertAfterIdx = i;
        }
      }

      result.splice(insertAfterIdx + 1, 0, ...newCreatedElements);
      return result;
    }, toastMsg);

    if (newSelectedIds.length > 0) {
      setSelectedId(newSelectedIds[0]);
      setSelectedIds(newSelectedIds);
    }
  }, [elements, selectedId, selectedIds, updateElementsWithHistory]);

  // Copy Selected Element(s) to Clipboard (Ctrl+C)
  const handleCopySelected = useCallback(() => {
    const targetIds = selectedIds.length > 0 ? selectedIds : (selectedId ? [selectedId] : []);
    if (targetIds.length === 0) {
      showToast('Select an element to copy');
      return;
    }

    // Filter to top-level roots among selected elements
    const rootTargetIds = targetIds.filter(id => {
      let curr = elements.find(e => e.id === id);
      while (curr && curr.parentId) {
        if (targetIds.includes(curr.parentId)) return false;
        curr = elements.find(e => e.id === curr?.parentId);
      }
      return true;
    });

    const collectedElements: RobloxElement[] = [];
    const collectSubtree = (id: string) => {
      const el = elements.find(e => e.id === id);
      if (!el) return;
      collectedElements.push(JSON.parse(JSON.stringify(el)));
      elements.filter(child => child.parentId === id).forEach(child => collectSubtree(child.id));
    };

    rootTargetIds.forEach(id => collectSubtree(id));

    const rootElements = collectedElements.filter(e => rootTargetIds.includes(e.id));
    setClipboard({ roots: rootElements, allElements: collectedElements });

    soundEffects.play('click');
    const toastMsg = rootElements.length === 1
      ? `Copied ${rootElements[0].name} (Ctrl+C)`
      : `Copied ${rootElements.length} elements (Ctrl+C)`;
    showToast(toastMsg);
  }, [elements, selectedId, selectedIds, showToast]);

  // Paste Element(s) from Clipboard into selected target or parent (Ctrl+V)
  const handlePasteClipboard = useCallback(() => {
    if (!clipboard || clipboard.roots.length === 0) {
      showToast('Clipboard is empty (press Ctrl+C to copy an element first)');
      return;
    }

    // Determine target parent container
    let targetParentId: string | null = null;
    if (selectedId) {
      const sel = elements.find(e => e.id === selectedId);
      if (sel) {
        // If selected element is a container frame, paste INSIDE it
        if (['Frame', 'ScrollingFrame', 'ViewportFrame'].includes(sel.type)) {
          targetParentId = sel.id;
        } else {
          // If selected element is a leaf (e.g. TextButton/ImageLabel), paste as its sibling (in same parent)
          targetParentId = sel.parentId || null;
        }
      }
    }

    const newCreatedElements: RobloxElement[] = [];
    const newSelectedIds: string[] = [];

    clipboard.roots.forEach(root => {
      const idMap = new Map<string, string>();

      // Generate new IDs for the whole tree
      const getNewId = (origId: string) => {
        if (!idMap.has(origId)) {
          idMap.set(origId, `el_${nextIdCounter.current++}`);
        }
        return idMap.get(origId)!;
      };

      const cloneSubtree = (origId: string, currentParentId: string | null, isRootOfPaste: boolean) => {
        const orig = clipboard.allElements.find(e => e.id === origId);
        if (!orig) return;

        const newId = getNewId(origId);
        const clone: RobloxElement = JSON.parse(JSON.stringify(orig));
        clone.id = newId;
        clone.parentId = currentParentId;
        clone.name = isRootOfPaste ? `${orig.name}_Paste` : orig.name;

        if (isRootOfPaste) {
          // If pasting inside the same container, offset slightly; if pasting into a new container, put at top-left
          const isSameParent = targetParentId === orig.parentId;
          if (isSameParent) {
            clone.position.offsetX += 16;
            clone.position.offsetY += 16;
          } else {
            clone.position.offsetX = Math.max(0, clone.position.offsetX);
            clone.position.offsetY = Math.max(0, clone.position.offsetY);
          }
          newSelectedIds.push(newId);
        }

        newCreatedElements.push(clone);

        const children = clipboard.allElements.filter(c => c.parentId === origId);
        children.forEach(child => cloneSubtree(child.id, newId, false));
      };

      cloneSubtree(root.id, targetParentId, true);
    });

    if (newCreatedElements.length === 0) return;

    soundEffects.play('click');
    const targetParentName = targetParentId ? elements.find(e => e.id === targetParentId)?.name : rootType;
    updateElementsWithHistory(
      prev => [...prev, ...newCreatedElements],
      `Pasted ${clipboard.roots.length} element(s) into ${targetParentName}`
    );

    if (newSelectedIds.length > 0) {
      setSelectedId(newSelectedIds[0]);
      setSelectedIds(newSelectedIds);
    }
  }, [clipboard, elements, selectedId, rootType, updateElementsWithHistory, showToast]);

  // Convert Selected Element Type (e.g. Frame -> TextLabel -> ImageLabel)
  const handleConvertElementType = useCallback(
    (targetType: RobloxElementType) => {
      if (!selectedId) return;
      const target = elements.find(e => e.id === selectedId);
      if (!target || target.type === targetType) return;

      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== selectedId) return el;

          const updated: RobloxElement = {
            ...el,
            type: targetType
          };

          // If converting to a text-based element and it has no text yet, set friendly defaults
          if (['TextLabel', 'TextButton', 'TextBox'].includes(targetType)) {
            if (!updated.text) {
              updated.text = targetType === 'TextButton' ? 'Button' : el.name;
            }
            if (!updated.textColor) updated.textColor = '#ffffff';
            if (!updated.textSize) updated.textSize = 14;
            if (!updated.font) updated.font = targetType === 'TextButton' ? 'SourceSansBold' : 'SourceSans';
            if (targetType === 'TextBox' && !updated.placeholderText) {
              updated.placeholderText = 'Type here...';
            }
          }

          // If converting to an image-based element and it has no image yet, set a decal placeholder
          if (['ImageLabel', 'ImageButton'].includes(targetType)) {
            if (!updated.image) {
              updated.image = 'https://placehold.co/300x200/22222b/ffffff?text=Roblox+Decal';
            }
            if (!updated.scaleType) updated.scaleType = 'Stretch';
            if (updated.imageTransparency === undefined) updated.imageTransparency = 0;
          }

          // If converting to a ScrollingFrame, set canvas defaults
          if (targetType === 'ScrollingFrame') {
            if (!updated.canvasSize) {
              updated.canvasSize = { scaleX: 0, offsetX: 0, scaleY: 2, offsetY: 0 };
            }
            if (!updated.scrollBarThickness) updated.scrollBarThickness = 8;
          }

          return updated;
        });
      }, `Converted ${target.name} to ${targetType}`);

      soundEffects.play('click');
    },
    [elements, selectedId, updateElementsWithHistory]
  );

  // Drag and drop reparenting & reordering in Explorer tree
  const handleReparentElement = useCallback(
    (draggedIds: string[], targetId: string | null, position: DropPosition) => {
      if (draggedIds.length === 0) return;

      const draggedNames = draggedIds
        .map(id => elements.find(e => e.id === id)?.name)
        .filter(Boolean);
      const targetEl = targetId ? elements.find(e => e.id === targetId) : null;

      let toastMsg = '';
      if (position === 'inside') {
        if (targetEl) {
          toastMsg = `Moved ${draggedNames.join(', ')} into ${targetEl.name}`;
        } else {
          toastMsg = `Moved ${draggedNames.join(', ')} to Root (${rootType})`;
        }
      } else {
        toastMsg = `Reordered ${draggedNames.join(', ')} ${position} ${targetEl?.name || 'element'}`;
      }

      soundEffects.play('snap');

      updateElementsWithHistory(prev => {
        return reorderAndReparent(prev, draggedIds, targetId, position);
      }, toastMsg);

      if (draggedIds.length > 0) {
        setSelectedId(draggedIds[0]);
        setSelectedIds(draggedIds);
      }
    },
    [elements, rootType, updateElementsWithHistory]
  );

  // Convert Selected to Parent Scale (Scale ratio with immediate parent for children)
  const handleConvertToScale = useCallback(() => {
    if (!selectedId) return;
    const target = elements.find(e => e.id === selectedId);
    if (!target) return;

    const screenSize = {
      w: viewport.width,
      h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
    };

    const parent = target.parentId ? elements.find(p => p.id === target.parentId) : null;
    const converted = convertToParentScale(target, elements, screenSize);

    soundEffects.play('click');
    updateElementsWithHistory(prev => {
      return prev.map(el => {
        if (el.id !== selectedId) return el;
        return {
          ...el,
          size: converted.size,
          position: converted.position
        };
      });
    }, parent ? `Converted ${target.name} to Scale (%) relative to parent (${parent.name})` : `Converted ${target.name} to Scale (%)`);
  }, [elements, selectedId, viewport.width, viewport.height, viewport.showSafeInsets, updateElementsWithHistory]);

  // Convert Selected to ScreenGui Scale (Separate option for full-screen ratio)
  const handleConvertToScreenGuiScale = useCallback(() => {
    if (!selectedId) return;
    const target = elements.find(e => e.id === selectedId);
    if (!target) return;

    const screenSize = {
      w: viewport.width,
      h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
    };

    const converted = convertToScreenGuiScale(target, elements, screenSize);

    soundEffects.play('click');
    updateElementsWithHistory(prev => {
      return prev.map(el => {
        if (el.id !== selectedId) return el;
        return {
          ...el,
          size: converted.size,
          position: converted.position
        };
      });
    }, `Converted ${target.name} to Scale (%) relative to ScreenGui (${screenSize.w}×${screenSize.h})`);
  }, [elements, selectedId, viewport.width, viewport.height, viewport.showSafeInsets, updateElementsWithHistory]);

  // Convert Selected to Offset
  const handleConvertToOffset = useCallback(() => {
    if (!selectedId) return;
    const target = elements.find(e => e.id === selectedId);
    if (!target) return;

    const screenSize = {
      w: viewport.width,
      h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
    };

    const converted = convertElementToOffset(target, elements, screenSize);

    soundEffects.play('click');
    updateElementsWithHistory(prev => {
      return prev.map(el => {
        if (el.id !== selectedId) return el;
        return {
          ...el,
          size: converted.size,
          position: converted.position
        };
      });
    }, `Converted ${target.name} to Offset (px)`);
  }, [elements, selectedId, viewport.width, viewport.height, viewport.showSafeInsets, updateElementsWithHistory]);

  // Toggle Aspect Ratio Constraint
  const handleToggleAspectRatio = useCallback(() => {
    if (!selectedId) return;
    const target = elements.find(e => e.id === selectedId);
    if (!target) return;

    if (target.modifiers?.UIAspectRatioConstraint) {
      handleRemoveModifier(selectedId, 'UIAspectRatioConstraint');
      showToast('Aspect Ratio Unlocked');
    } else {
      handleAddModifier('UIAspectRatioConstraint');
      showToast('Aspect Ratio Locked');
    }
  }, [elements, selectedId, handleAddModifier, handleRemoveModifier, showToast]);

  // Selection Handler (supports Shift+Click multi-selection)
  const handleSelectElement = useCallback(
    (id: string | null, modKey?: ModifierType | null, isMulti?: boolean) => {
      if (!id) {
        setSelectedId(null);
        setSelectedIds([]);
        setSelectedModifierKey(null);
        return;
      }
      if (isMulti) {
        setSelectedIds(prev => {
          if (prev.includes(id)) {
            const next = prev.filter(x => x !== id);
            setSelectedId(next.length > 0 ? next[next.length - 1] : null);
            return next;
          } else {
            setSelectedId(id);
            return [...prev, id];
          }
        });
      } else {
        setSelectedId(id);
        setSelectedIds([id]);
      }
      setSelectedModifierKey(modKey || null);
    },
    []
  );

  // Multi-element alignment & distribution
  const handleAlignElements = useCallback(
    (
      type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV'
    ) => {
      if (selectedIds.length < 2) return;
      updateElementsWithHistory(prev => {
        const toAlign = prev.filter(e => selectedIds.includes(e.id));
        const aligned = alignElements(toAlign, type, {
          w: viewport.width,
          h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
        });
        const alignedMap = new Map(aligned.map(a => [a.id, a]));
        return prev.map(e => alignedMap.get(e.id) || e);
      }, `Aligned elements (${type})`);
    },
    [selectedIds, viewport.width, viewport.height, viewport.showSafeInsets, updateElementsWithHistory]
  );

  // Group multiple selected elements into a new parent Frame (Ctrl+G)
  const handleGroupIntoFrame = useCallback(() => {
    if (selectedIds.length < 2) {
      showToast('Select 2 or more elements to group (Shift+Click)');
      return;
    }
    const items = elements.filter(e => selectedIds.includes(e.id));
    if (items.length < 2) return;

    const boundsList = items.map(e =>
      calculatePixelBounds(e, {
        w: viewport.width,
        h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
      })
    );
    const minX = Math.min(...boundsList.map(b => b.x));
    const minY = Math.min(...boundsList.map(b => b.y));
    const maxX = Math.max(...boundsList.map(b => b.x + b.w));
    const maxY = Math.max(...boundsList.map(b => b.y + b.h));
    const groupW = Math.max(20, maxX - minX);
    const groupH = Math.max(20, maxY - minY);

    const newGroupId = `group_${nextIdCounter.current++}`;
    const newGroupFrame: RobloxElement = {
      id: newGroupId,
      name: `GroupFrame_${nextIdCounter.current}`,
      type: 'Frame',
      parentId: items[0].parentId,
      visible: true,
      zIndex: Math.max(...items.map(i => i.zIndex || 1)),
      position: { scaleX: 0, offsetX: Math.round(minX), scaleY: 0, offsetY: Math.round(minY) },
      size: { scaleX: 0, offsetX: Math.round(groupW), scaleY: 0, offsetY: Math.round(groupH) },
      anchorPoint: { x: 0, y: 0 },
      backgroundColor: '#27272a',
      backgroundTransparency: 1,
      borderSizePixel: 0,
      borderColor: '#000000',
      modifiers: {}
    };

    updateElementsWithHistory(prev => {
      const updated = prev.map(e => {
        if (selectedIds.includes(e.id)) {
          const b = calculatePixelBounds(e, {
            w: viewport.width,
            h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
          });
          return {
            ...e,
            parentId: newGroupId,
            position: {
              scaleX: 0,
              offsetX: Math.round(b.x - minX),
              scaleY: 0,
              offsetY: Math.round(b.y - minY)
            }
          };
        }
        return e;
      });
      return [...updated, newGroupFrame];
    }, 'Grouped elements into Frame');

    setSelectedId(newGroupId);
    setSelectedIds([newGroupId]);
    soundEffects.play('group');
  }, [selectedIds, elements, viewport.width, viewport.height, viewport.showSafeInsets, updateElementsWithHistory, showToast]);

  // Ratio Calculator handlers
  const handleApplyAspectRatio = useCallback(
    (aspectRatio: number, dominantAxis: 'Width' | 'Height') => {
      if (!selectedId) return;
      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== selectedId) return el;
          return {
            ...el,
            modifiers: {
              ...el.modifiers,
              UIAspectRatioConstraint: {
                aspectRatio,
                dominantAxis,
                aspectType: 'FitWithinMaxSize'
              }
            }
          };
        });
      }, `Applied Aspect Ratio ${aspectRatio}`);
    },
    [selectedId, updateElementsWithHistory]
  );

  const handleApplyScale = useCallback(
    (scaleX: number, scaleY: number) => {
      if (!selectedId) return;
      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== selectedId) return el;
          return {
            ...el,
            size: { scaleX, offsetX: 0, scaleY, offsetY: 0 }
          };
        });
      }, `Applied Scale (${scaleX}, ${scaleY})`);
    },
    [selectedId, updateElementsWithHistory]
  );

  const handleApplyOffset = useCallback(
    (offsetX: number, offsetY: number) => {
      if (!selectedId) return;
      updateElementsWithHistory(prev => {
        return prev.map(el => {
          if (el.id !== selectedId) return el;
          return {
            ...el,
            size: { scaleX: 0, offsetX, scaleY: 0, offsetY }
          };
        });
      }, `Applied Offset (${offsetX}px, ${offsetY}px)`);
    },
    [selectedId, updateElementsWithHistory]
  );

  // Audio Toggle
  const handleToggleAudio = useCallback(() => {
    setIsAudioEnabled(prev => {
      const next = !prev;
      soundEffects.setEnabled(next);
      if (next) soundEffects.play('chime');
      showToast(next ? 'Roblox UI Audio Enabled' : 'Roblox UI Audio Muted');
      return next;
    });
  }, [showToast]);

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    const availW = Math.max(300, window.innerWidth - 640);
    const availH = Math.max(300, window.innerHeight - 140);
    const scaleX = availW / viewport.width;
    const scaleY = availH / viewport.height;
    const fitZoom = Math.min(scaleX, scaleY);

    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.2, Math.min(1.5, Number(fitZoom.toFixed(2)))),
      panX: 0,
      panY: 0
    }));
    showToast(`Fitted Canvas (${Math.round(fitZoom * 100)}%)`);
  }, [viewport.width, viewport.height, showToast]);

  // New Blank Project (Clear Canvas)
  const handleNewProject = useCallback(() => {
    if (elements.length > 0) {
      const confirmNew = window.confirm('Start a new blank project? Any unsaved changes will be cleared.');
      if (!confirmNew) return;
    }
    soundEffects.play('click');
    updateElementsWithHistory(() => [], 'Created new blank board');
    setSelectedId(null);
    setSelectedIds([]);
    setSelectedModifierKey(null);
  }, [elements.length, updateElementsWithHistory]);

  // Save Project to File (.rbxgui)
  const handleSaveFile = useCallback(() => {
    const projectState: ProjectState = {
      app: 'RobloxStudioGuiCreator',
      version: 1,
      exportedAt: new Date().toISOString(),
      rootType,
      rootProperties,
      viewport,
      elements,
      selectedId,
      selectedModifierKey,
      gridSettings,
      audioSettings: {
        enabled: isAudioEnabled,
        volume: soundEffects.getVolume()
      }
    };

    const json = JSON.stringify(projectState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RobloxGUI_${rootType.toLowerCase()}_${Date.now()}.rbxgui`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Project file saved (.rbxgui)');
  }, [rootType, rootProperties, viewport, elements, selectedId, selectedModifierKey, gridSettings, isAudioEnabled, showToast]);

  // Load Project File (.rbxgui / .json)
  const handleLoadProjectFile = useCallback(
    (file: File) => {
      setIsLoadingFile(true);
      showToast(`Loading ${file.name}...`);

      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const text = evt.target?.result as string;
          const parsed = JSON.parse(text);

          let elementsToLoad: RobloxElement[] = [];

          if (Array.isArray(parsed)) {
            // Backward compatibility for raw array of elements
            elementsToLoad = parsed;
          } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.elements)) {
            elementsToLoad = parsed.elements;
            if (parsed.rootType) setRootType(parsed.rootType);
            if (parsed.rootProperties) setRootProperties(parsed.rootProperties);
            if (parsed.viewport) {
              setViewport(prev => ({ ...prev, ...parsed.viewport }));
            }
            if (parsed.gridSettings) {
              setGridSettings(parsed.gridSettings);
            }
            if (parsed.audioSettings) {
              setIsAudioEnabled(parsed.audioSettings.enabled);
              soundEffects.setEnabled(parsed.audioSettings.enabled);
            }
          } else {
            throw new Error('Project file missing valid "elements" hierarchy');
          }

          const sanitized = sanitizeHierarchy(elementsToLoad);
          setElements(sanitized);
          const firstId = sanitized[0]?.id || null;
          setSelectedId(firstId);
          setSelectedIds(firstId ? [firstId] : []);
          setSelectedModifierKey(null);
          pushHistory(sanitized);
          soundEffects.play('click');
          showToast(`Loaded ${file.name} (${sanitized.length} elements restored)`);
        } catch (err: any) {
          soundEffects.play('error');
          showToast(`Failed to load ${file.name}: ${err?.message || 'Invalid format'}`);
        } finally {
          setIsLoadingFile(false);
        }
      };

      reader.onerror = () => {
        setIsLoadingFile(false);
        showToast(`Error reading file: ${file.name}`);
      };

      reader.readAsText(file);
    },
    [pushHistory, showToast]
  );

  const handleLoadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLoadProjectFile(file);
    }
    e.target.value = '';
  };

  // Select Template
  const handleSelectTemplate = (template: GuiTemplate) => {
    const copiedElements = sanitizeHierarchy(JSON.parse(JSON.stringify(template.elements)));
    setElements(copiedElements);
    setSelectedId(copiedElements[0]?.id || null);
    setSelectedIds(copiedElements[0]?.id ? [copiedElements[0].id] : []);
    setSelectedModifierKey(null);
    pushHistory(copiedElements);
    showToast(`Loaded ${template.name}`);
  };

  // Keyboard shortcuts (Delete, Duplicate, Undo, Redo, Open, Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          handleDeleteElement(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleGroupIntoFrame();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLoadScriptOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    handleDeleteElement,
    handleCopySelected,
    handlePasteClipboard,
    handleDuplicateSelected,
    handleGroupIntoFrame,
    handleSaveFile,
    handleUndo,
    handleRedo
  ]);

  // Autosave: debounced save to localStorage whenever project state changes
  useEffect(() => {
    if (!autosaveEnabled) return;

    if (autosaveTimerRef.current !== null) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      setIsAutosaving(true);
      try {
        const saved = saveToLocalCache({
          rootType,
          rootProperties,
          viewport,
          elements,
          selectedId,
          selectedModifierKey,
          gridSettings,
          isAudioEnabled
        });
        if (saved) {
          const now = Date.now();
          setLastSavedTimestamp(now);
          setHasCachedData(true);
        }
      } finally {
        setIsAutosaving(false);
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current !== null) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [autosaveEnabled, rootType, rootProperties, viewport, elements, selectedId, selectedModifierKey, gridSettings, isAudioEnabled]);

  // Autosave handlers for the badge popover
  const handleToggleAutosave = useCallback((enabled: boolean) => {
    setAutosaveEnabledState(enabled);
    setAutosaveSetting(enabled);
    if (enabled) {
      showToast('Autosave enabled');
    } else {
      showToast('Autosave disabled');
    }
  }, [showToast]);

  const handleRestoreCache = useCallback(() => {
    const cached = loadFromLocalCache();
    if (cached && cached.elements && cached.elements.length > 0) {
      setRootType(cached.rootType);
      if (cached.rootProperties) setRootProperties(cached.rootProperties);
      if (cached.viewport) setViewport(cached.viewport);
      if (cached.gridSettings) setGridSettings(cached.gridSettings);
      setElements(cached.elements);
      setSelectedId(cached.selectedId);
      setSelectedIds(cached.selectedId ? [cached.selectedId] : []);
      setSelectedModifierKey(cached.selectedModifierKey);
      setIsAudioEnabled(cached.isAudioEnabled ?? true);
      setLastSavedTimestamp(cached.timestamp);
      pushHistory(cached.elements);
      showToast(`Cache restored (${cached.elements.length} elements)`);
    } else {
      showToast('No cached data to restore');
    }
  }, [pushHistory, showToast]);

  const handleClearCache = useCallback(() => {
    clearLocalCache();
    setHasCachedData(false);
    setLastSavedTimestamp(null);
    showToast('Autosave cache cleared');
  }, [showToast]);

  const selectedElement = elements.find(el => el.id === selectedId) || null;
  const selectedParentElement = selectedElement?.parentId
    ? elements.find(el => el.id === selectedElement.parentId) || null
    : null;
  const selectedParentPixelSize = selectedElement && selectedParentElement
    ? getParentPixelSize(selectedElement, elements, {
        w: viewport.width,
        h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
      })
    : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-gray-200 font-sans select-none overflow-hidden">
      {/* Top Header */}
      <TopHeader
        rootType={rootType}
        onSwitchRoot={setRootType}
        onNewCanvas={handleNewProject}
        onSaveFile={handleSaveFile}
        onLoadFileTrigger={() => fileInputRef.current?.click()}
        onLoadScriptTrigger={() => setIsLoadScriptOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenAnimations={() => setIsAnimationsOpen(true)}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        selectedElement={selectedElement}
        parentElement={selectedParentElement}
        onConvertToScale={handleConvertToScale}
        onConvertToScreenGuiScale={handleConvertToScreenGuiScale}
        onConvertToOffset={handleConvertToOffset}
        onToggleAspectRatio={handleToggleAspectRatio}
        onDuplicateSelected={handleDuplicateSelected}
        onDeleteSelected={() => selectedId && handleDeleteElement(selectedId)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isExplorerOpen={isExplorerOpen}
        isPropertiesOpen={isPropertiesOpen}
        onToggleExplorer={() => setIsExplorerOpen(prev => !prev)}
        onToggleProperties={() => setIsPropertiesOpen(prev => !prev)}
        // Autosave & Crash Protection
        isAutosaving={isAutosaving}
        lastSavedTimestamp={lastSavedTimestamp}
        elementCount={elements.length}
        autosaveEnabled={autosaveEnabled}
        onToggleAutosave={handleToggleAutosave}
        onRestoreCache={handleRestoreCache}
        onClearCache={handleClearCache}
        hasCachedData={hasCachedData}
      />

      {/* Main Studio Body: Sidebars sit cleanly on the side without taking up the entire screen */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Explorer Sidebar (or compact edge toggle rail when collapsed) */}
        {isExplorerOpen ? (
          <div className="h-full z-20 flex shrink-0 w-64 max-w-[85vw] border-r border-[#3c3c3c] bg-[#252526] transition-all duration-200">
            <ExplorerSidebar
              rootType={rootType}
              elements={elements}
              selectedId={selectedId}
              selectedIds={selectedIds}
              selectedModifierKey={selectedModifierKey}
              onSelectElement={handleSelectElement}
              onAddElement={handleAddElement}
              onAddModifier={handleAddModifier}
              onRemoveModifier={handleRemoveModifier}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={id => {
                handleDuplicateSelected(id);
              }}
              onToggleVisibility={id => {
                updateElementsWithHistory(prev =>
                  prev.map(el => (el.id === id ? { ...el, visible: !el.visible } : el))
                );
              }}
              onClearAll={() => {
                if (elements.length > 0) {
                  updateElementsWithHistory(() => [], 'Cleared canvas');
                  setSelectedId(null);
                  setSelectedIds([]);
                }
              }}
              onReparentElement={handleReparentElement}
              onClose={() => setIsExplorerOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsExplorerOpen(true)}
            title="Expand Explorer sidebar"
            aria-label="Expand Explorer sidebar"
            className="h-full w-8 bg-[#252526] hover:bg-[#2d2d30] border-r border-[#3c3c3c] flex flex-col items-center justify-start py-3 space-y-3 text-gray-400 hover:text-white transition cursor-pointer select-none z-10 shrink-0"
          >
            <FolderTree className="w-3.5 h-3.5 text-[#00a2ff]" />
            <span className="text-[10px] uppercase font-bold tracking-widest [writing-mode:vertical-lr] text-gray-400">
              Explorer
            </span>
            <ChevronRight className="w-3 h-3 text-gray-500" />
          </button>
        )}

        {/* Center Workspace: Canvas is always visible in the center */}
        <div className="h-full flex-1 min-w-0 flex flex-col overflow-hidden relative">
          {/* Multi-selection Alignment Bar */}
          <AlignmentBar
            selectedCount={selectedIds.length}
            onAlign={handleAlignElements}
            onGroupIntoFrame={handleGroupIntoFrame}
            onDuplicateSelected={handleDuplicateSelected}
            onClearSelection={() => {
              setSelectedId(null);
              setSelectedIds([]);
            }}
          />

          {rootType === 'ScreenGui' ? (
            <CanvasWorkspace
              rootType={rootType}
              elements={elements}
              selectedId={selectedId}
              selectedIds={selectedIds}
              gridSettings={gridSettings}
              viewport={viewport}
              onSelectElement={handleSelectElement}
              onUpdateElement={updated => {
                setElements(prev => prev.map(el => (el.id === updated.id ? updated : el)));
              }}
              onUpdateViewport={setViewport}
              onUpdateGridSettings={setGridSettings}
              onFitToScreen={handleFitToScreen}
              onLoadFile={handleLoadProjectFile}
              onTriggerLoadFileDialog={() => fileInputRef.current?.click()}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onAddStarterFrame={() => handleAddElement('Frame')}
            />
          ) : (
            <ThreeDWorldPreview
              rootType={rootType}
              rootProperties={rootProperties}
              elements={elements}
              onBackTo2D={() => setRootType('ScreenGui')}
              onUpdateRootProperties={setRootProperties}
            />
          )}
        </div>

        {/* Right Side: Properties Panel (or compact edge toggle rail when collapsed) */}
        {isPropertiesOpen ? (
          <div className="h-full z-20 flex shrink-0 w-72 lg:w-80 max-w-[85vw] border-l border-[#3c3c3c] bg-[#252526] transition-all duration-200">
            <PropertiesPanel
              rootType={rootType}
              rootProperties={rootProperties}
              selectedElement={selectedElement}
              selectedModifierKey={selectedModifierKey}
              parentElement={selectedParentElement}
              onUpdateElement={updated => {
                updateElementsWithHistory(prev =>
                  prev.map(el => (el.id === updated.id ? updated : el))
                );
              }}
              onUpdateRootProperties={setRootProperties}
              onRemoveModifier={handleRemoveModifier}
              onConvertToScale={handleConvertToScale}
              onConvertToScreenGuiScale={handleConvertToScreenGuiScale}
              onConvertToOffset={handleConvertToOffset}
              onToggleAspectRatio={handleToggleAspectRatio}
              onConvertType={handleConvertElementType}
              onSelectModifierOnly={setSelectedModifierKey}
              onClose={() => setIsPropertiesOpen(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsPropertiesOpen(true)}
            title="Expand Properties panel"
            aria-label="Expand Properties panel"
            className="h-full w-8 bg-[#252526] hover:bg-[#2d2d30] border-l border-[#3c3c3c] flex flex-col items-center justify-start py-3 space-y-3 text-gray-400 hover:text-white transition cursor-pointer select-none z-10 shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest [writing-mode:vertical-lr] text-gray-400">
              Properties
            </span>
            <ChevronLeft className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {/* Hidden File Input for .rbxgui Loading */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".rbxgui,.json"
        onChange={handleLoadFileChange}
        className="hidden"
      />

      {/* Luau Script Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        luauScript={generateLuauScript(rootType, rootProperties, elements)}
      />

      {/* Luau Script Import Modal */}
      <LoadScriptModal
        isOpen={isLoadScriptOpen}
        onClose={() => setIsLoadScriptOpen(false)}
        onImport={(parsed) => {
          setIsLoadScriptOpen(false);
          setRootType(parsed.rootType);
          setRootProperties(parsed.rootProperties);
          const sanitized = sanitizeHierarchy(parsed.elements);
          setElements(sanitized);
          const firstId = sanitized[0]?.id || null;
          setSelectedId(firstId);
          setSelectedIds(firstId ? [firstId] : []);
          setSelectedModifierKey(null);
          pushHistory(sanitized);
          const warnMsg = parsed.warnings.length > 0
            ? ` (${parsed.warnings.length} warning(s))`
            : '';
          showToast(
            `Script imported: ${sanitized.length} element(s) restored${warnMsg}`
          );
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Ratio & Pixel Calculator Modal */}
      <RatioCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        selectedElement={selectedElement}
        parentElement={selectedParentElement}
        parentPixelSize={selectedParentPixelSize}
        viewportSize={{ width: viewport.width, height: viewport.height }}
        onApplyAspectRatio={handleApplyAspectRatio}
        onApplyScale={handleApplyScale}
        onApplyOffset={handleApplyOffset}
      />

      {/* TweenService Animation Previewer Modal */}
      <TweenServiceModal
        isOpen={isAnimationsOpen}
        onClose={() => setIsAnimationsOpen(false)}
        selectedElement={selectedElement}
      />

      {/* File Loading Modal / Indicator */}
      {isLoadingFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in pointer-events-auto">
          <div className="bg-[#252526] border border-[#007acc] rounded-xl p-6 shadow-2xl flex flex-col items-center space-y-3 min-w-[280px]">
            <div className="w-10 h-10 border-3 border-[#007acc] border-t-transparent rounded-full animate-spin" />
            <div className="text-sm font-semibold text-white">Loading .rbxgui Project...</div>
            <div className="text-xs text-gray-400">Restoring GUI hierarchy &amp; properties</div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-[#007acc] text-white px-4 py-2 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
