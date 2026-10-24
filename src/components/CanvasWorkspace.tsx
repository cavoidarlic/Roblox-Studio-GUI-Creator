import React, { useRef, useState, useEffect } from 'react';
import {
  RobloxElement,
  ViewportState,
  GuiRootType,
  ModifierType,
  GridSettings,
  GridStep
} from '../types/roblox';
import {
  calculatePixelBounds,
  calculateAbsolutePixelBounds,
  calculateZoomToPoint,
  snapToGrid,
  hexToRgb,
  PixelBounds
} from '../utils/robloxMath';
import { getFontDefinition } from '../data/robloxFonts';
import { soundEffects } from '../utils/soundEffects';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  ShieldCheck,
  Smartphone,
  Tablet,
  Tv,
  Wifi,
  MousePointer,
  Sparkles,
  Grid,
  Box,
  Upload,
  FolderOpen,
  Plus
} from 'lucide-react';

interface CanvasWorkspaceProps {
  rootType: GuiRootType;
  elements: RobloxElement[];
  selectedId: string | null;
  selectedIds?: string[];
  gridSettings: GridSettings;
  viewport: ViewportState;
  onSelectElement: (id: string | null, modKey?: ModifierType | null, isMulti?: boolean) => void;
  onUpdateElement: (updated: RobloxElement) => void;
  onUpdateViewport: (viewport: ViewportState) => void;
  onUpdateGridSettings: (settings: GridSettings) => void;
  onFitToScreen: () => void;
  onLoadFile?: (file: File) => void;
  onTriggerLoadFileDialog?: () => void;
  onOpenTemplates?: () => void;
  onAddStarterFrame?: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  rootType,
  elements,
  selectedId,
  selectedIds = [],
  gridSettings,
  viewport,
  onSelectElement,
  onUpdateElement,
  onUpdateViewport,
  onUpdateGridSettings,
  onFitToScreen,
  onLoadFile,
  onTriggerLoadFileDialog,
  onOpenTemplates,
  onAddStarterFrame
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; panX: number; panY: number }>({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0
  });

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Auto-fit canvas on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      onFitToScreen();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Wheel listener: Ctrl + Scroll to zoom to cursor position & scroll to pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseDx = e.clientX - centerX;
        const mouseDy = e.clientY - centerY;

        const next = calculateZoomToPoint(
          viewport.zoom,
          viewport.panX,
          viewport.panY,
          mouseDx,
          mouseDy,
          e.deltaY
        );

        onUpdateViewport({
          ...viewport,
          zoom: next.zoom,
          panX: next.panX,
          panY: next.panY
        });
      } else {
        e.preventDefault();
        onUpdateViewport({
          ...viewport,
          panX: viewport.panX - Math.round(e.deltaX * 0.8),
          panY: viewport.panY - Math.round(e.deltaY * 0.8)
        });
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, [viewport, onUpdateViewport]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    const nextZoom = Math.max(0.2, Math.min(2.5, Number((viewport.zoom + delta).toFixed(2))));
    onUpdateViewport({ ...viewport, zoom: nextZoom });
  };

  const handleResetZoom = () => {
    onUpdateViewport({ ...viewport, zoom: 1.0, panX: 0, panY: 0 });
  };

  const handleCenterPan = () => {
    onUpdateViewport({ ...viewport, panX: 0, panY: 0 });
  };

  // Viewport Presets
  const handlePresetChange = (presetStr: string) => {
    const [wStr, hStr] = presetStr.split('x');
    const w = parseInt(wStr, 10);
    const h = parseInt(hStr, 10);
    if (!isNaN(w) && !isNaN(h)) {
      onUpdateViewport({
        ...viewport,
        preset: presetStr,
        width: w,
        height: h,
        panX: 0,
        panY: 0
      });
      setTimeout(() => onFitToScreen(), 50);
    }
  };

  // Pan interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: viewport.panX,
        panY: viewport.panY
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.mouseX;
    const dy = e.clientY - panStartRef.current.mouseY;
    onUpdateViewport({
      ...viewport,
      panX: Math.round(panStartRef.current.panX + dx),
      panY: Math.round(panStartRef.current.panY + dy)
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Dragging element logic
  const handleElementMouseDown = (el: RobloxElement, e: React.MouseEvent) => {
    if (e.button !== 0 || isSpacePressed) return;
    e.stopPropagation();
    const isShift = e.shiftKey;
    soundEffects.play('click');
    onSelectElement(el.id, null, isShift);

    // If parent is layout managed, cannot freely reposition
    const parent = el.parentId ? elements.find(p => p.id === el.parentId) : null;
    if (parent?.modifiers?.UIListLayout || parent?.modifiers?.UIGridLayout) {
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const zoom = viewport.zoom;
    const safeW = parent ? 400 : viewport.width;
    const safeH = parent ? 300 : viewport.height - (viewport.showSafeInsets ? 24 : 0);

    const initialPos = { ...el.position };

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;

      let nextScaleX = initialPos.scaleX;
      let nextOffsetX = initialPos.offsetX;
      let nextScaleY = initialPos.scaleY;
      let nextOffsetY = initialPos.offsetY;

      if (initialPos.scaleX !== 0) {
        nextScaleX = Number((initialPos.scaleX + dx / safeW).toFixed(4));
      } else {
        let rawOffsetX = initialPos.offsetX + dx;
        if (gridSettings.enabled) {
          rawOffsetX = snapToGrid(rawOffsetX, gridSettings.step);
        }
        nextOffsetX = Math.round(rawOffsetX);
      }

      if (initialPos.scaleY !== 0) {
        nextScaleY = Number((initialPos.scaleY + dy / safeH).toFixed(4));
      } else {
        let rawOffsetY = initialPos.offsetY + dy;
        if (gridSettings.enabled) {
          rawOffsetY = snapToGrid(rawOffsetY, gridSettings.step);
        }
        nextOffsetY = Math.round(rawOffsetY);
      }

      onUpdateElement({
        ...el,
        position: {
          scaleX: nextScaleX,
          offsetX: nextOffsetX,
          scaleY: nextScaleY,
          offsetY: nextOffsetY
        }
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Resize Handle logic
  const handleResizeStart = (
    dir: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    if (!selectedElement) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const zoom = viewport.zoom;

    const parent = selectedElement.parentId
      ? elements.find(p => p.id === selectedElement.parentId)
      : null;
    const parentBounds = parent
      ? calculatePixelBounds(parent, { w: viewport.width, h: viewport.height })
      : { w: viewport.width, h: viewport.height - (viewport.showSafeInsets ? 24 : 0) };

    const initialBounds = calculatePixelBounds(selectedElement, parentBounds);
    const hasAspectLock = !!selectedElement.modifiers?.UIAspectRatioConstraint;
    const targetRatio =
      selectedElement.modifiers?.UIAspectRatioConstraint?.aspectRatio ||
      initialBounds.w / Math.max(1, initialBounds.h);

    const onMove = (me: MouseEvent) => {
      const dx = (me.clientX - startX) / zoom;
      const dy = (me.clientY - startY) / zoom;

      let newW = initialBounds.w;
      let newH = initialBounds.h;
      let newX = initialBounds.x;
      let newY = initialBounds.y;

      if (dir.includes('e')) newW = Math.max(16, initialBounds.w + dx);
      if (dir.includes('s')) newH = Math.max(16, initialBounds.h + dy);
      if (dir.includes('w')) {
        const proposedW = initialBounds.w - dx;
        if (proposedW > 16) {
          newW = proposedW;
          newX = initialBounds.x + dx;
        }
      }
      if (dir.includes('n')) {
        const proposedH = initialBounds.h - dy;
        if (proposedH > 16) {
          newH = proposedH;
          newY = initialBounds.y + dy;
        }
      }

      // Aspect ratio lock or Shift key
      if (hasAspectLock || me.shiftKey) {
        if (['e', 'w'].includes(dir)) {
          newH = Math.max(16, newW / targetRatio);
        } else if (['n', 's'].includes(dir)) {
          newW = Math.max(16, newH * targetRatio);
        } else {
          if (Math.abs(dx) > Math.abs(dy)) {
            newH = Math.max(16, newW / targetRatio);
          } else {
            newW = Math.max(16, newH * targetRatio);
          }
        }
      }

      if (gridSettings.enabled) {
        newW = Math.max(16, snapToGrid(newW, gridSettings.step));
        newH = Math.max(16, snapToGrid(newH, gridSettings.step));
        newX = snapToGrid(newX, gridSettings.step);
        newY = snapToGrid(newY, gridSettings.step);
      }

      // Commit to UDim2
      const updatedSize = { ...selectedElement.size };
      const updatedPos = { ...selectedElement.position };

      if (updatedSize.scaleX !== 0) {
        updatedSize.scaleX = Number((newW / parentBounds.w).toFixed(4));
        updatedSize.offsetX = 0;
      } else {
        updatedSize.offsetX = Math.round(newW);
      }

      if (updatedSize.scaleY !== 0) {
        updatedSize.scaleY = Number((newH / parentBounds.h).toFixed(4));
        updatedSize.offsetY = 0;
      } else {
        updatedSize.offsetY = Math.round(newH);
      }

      if (dir.includes('w')) {
        if (updatedPos.scaleX !== 0) {
          updatedPos.scaleX = Number((newX / parentBounds.w).toFixed(4));
          updatedPos.offsetX = 0;
        } else {
          updatedPos.offsetX = Math.round(newX);
        }
      }
      if (dir.includes('n')) {
        if (updatedPos.scaleY !== 0) {
          updatedPos.scaleY = Number((newY / parentBounds.h).toFixed(4));
          updatedPos.offsetY = 0;
        } else {
          updatedPos.offsetY = Math.round(newY);
        }
      }

      onUpdateElement({
        ...selectedElement,
        size: updatedSize,
        position: updatedPos
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Recursive element renderer
  const renderElementNode = (
    el: RobloxElement,
    parentBounds: { w: number; h: number },
    layoutOverride?: PixelBounds,
    visited = new Set<string>(),
    depth = 0
  ): React.ReactNode => {
    if (el.visible === false || visited.has(el.id) || depth > 40) return null;
    const nextVisited = new Set(visited);
    nextVisited.add(el.id);

    const bounds = layoutOverride || calculatePixelBounds(el, parentBounds);
    const isSelected = selectedId === el.id;

    const bgRgb = hexToRgb(el.backgroundColor || '#393939');
    const bgTrans = el.backgroundTransparency ?? 0;
    const bgAlpha = Math.max(0, Math.min(1, 1 - bgTrans));
    const backgroundColor = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${bgAlpha})`;

    const borderStyle: React.CSSProperties =
      el.borderSizePixel > 0
        ? {
            border: `${el.borderSizePixel}px solid ${el.borderColor || '#000000'}`
          }
        : {};

    // Modifiers styles
    const modStyles: React.CSSProperties = {};
    if (el.modifiers?.UICorner) {
      modStyles.borderRadius = `${el.modifiers.UICorner.cornerRadiusOffset || 0}px`;
    }
    if (el.modifiers?.UIStroke) {
      const s = el.modifiers.UIStroke;
      modStyles.outline = `${s.thickness || 2}px solid ${s.color || '#00a2ff'}`;
      modStyles.outlineOffset = s.applyStrokeMode === 'Border' ? `-${s.thickness || 2}px` : '0px';
    }
    if (el.modifiers?.UIGradient) {
      const g = el.modifiers.UIGradient;
      modStyles.backgroundImage = `linear-gradient(${g.rotation || 0}deg, ${g.color1 || '#ff007f'}, ${g.color2 || '#7928ca'})`;
    }
    if (el.modifiers?.UIPadding) {
      const p = el.modifiers.UIPadding;
      modStyles.padding = `${p.top || 0}px ${p.right || 0}px ${p.bottom || 0}px ${p.left || 0}px`;
    }

    const children = elements.filter(child => child.parentId === el.id);

    const isMultiSelected = selectedIds.includes(el.id);

    return (
      <div
        key={el.id}
        id={`dom_${el.id}`}
        onMouseEnter={() => soundEffects.play('hover')}
        onMouseDown={e => handleElementMouseDown(el, e)}
        onClick={e => {
          e.stopPropagation();
          onSelectElement(el.id, null, e.shiftKey);
        }}
        style={{
          position: 'absolute',
          left: `${bounds.x}px`,
          top: `${bounds.y}px`,
          width: `${bounds.w}px`,
          height: `${bounds.h}px`,
          backgroundColor,
          zIndex: el.zIndex || 1,
          ...borderStyle,
          ...modStyles
        }}
        className={`select-none transition-none group ${
          isSelected
            ? 'ring-2 ring-[#00a2ff] ring-offset-1 ring-offset-black'
            : isMultiSelected
            ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-black'
            : ''
        } ${el.type === 'ScrollingFrame' ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
      >
        {/* Element Content by Type */}
        {(el.type === 'TextLabel' || el.type === 'TextButton') && (() => {
          const fontDef = getFontDefinition(el.font);
          const fontStyle: React.CSSProperties = {
            fontFamily: fontDef.cssFamily,
            fontWeight: fontDef.weight || (el.font?.includes('Bold') ? 'bold' : 'normal'),
            fontStyle: (fontDef.style || (el.font?.includes('Italic') ? 'italic' : 'normal')) as any
          };

          // TextScaled simulation: dynamically scale font size to fit container height/width
          const computedSize = el.textScaled
            ? Math.max(10, Math.min(Math.round(bounds.h * 0.7), Math.round((bounds.w / Math.max(1, (el.text || 'A').length)) * 1.5)))
            : (el.textSize || 14);

          return (
            <div
              style={{
                color: el.textColor || '#ffffff',
                fontSize: `${computedSize}px`,
                justifyContent:
                  el.textXAlignment === 'Left'
                    ? 'flex-start'
                    : el.textXAlignment === 'Right'
                    ? 'flex-end'
                    : 'center',
                alignItems:
                  el.textYAlignment === 'Top'
                    ? 'flex-start'
                    : el.textYAlignment === 'Bottom'
                    ? 'flex-end'
                    : 'center',
                ...fontStyle
              }}
              className="w-full h-full flex px-1.5 cursor-default truncate whitespace-pre-wrap leading-tight"
            >
              {el.text || ''}
            </div>
          );
        })()}

        {el.type === 'TextBox' && (() => {
          const fontDef = getFontDefinition(el.font);
          const computedSize = el.textScaled
            ? Math.max(10, Math.min(Math.round(bounds.h * 0.65), 32))
            : (el.textSize || 14);

          return (
            <div
              style={{
                color: el.textColor || '#ffffff',
                fontSize: `${computedSize}px`,
                fontFamily: fontDef.cssFamily,
                fontWeight: fontDef.weight || 'normal'
              }}
              className="w-full h-full flex items-center px-2 text-gray-300"
            >
              {el.text || (
                <span className="text-gray-500 italic">
                  {el.placeholderText || 'Type here...'}
                </span>
              )}
            </div>
          );
        })()}

        {(el.type === 'ImageLabel' || el.type === 'ImageButton') && (
          <div className="w-full h-full relative pointer-events-none">
            {el.scaleType === 'Tile' ? (
              <div
                style={{
                  backgroundImage: `url("${el.image || ''}")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: `${el.tileSize?.x || 64}px ${el.tileSize?.y || 64}px`,
                  opacity: 1 - (el.imageTransparency ?? 0)
                }}
                className="w-full h-full"
              />
            ) : el.scaleType === 'Slice' && el.sliceCenter ? (
              <div
                style={{
                  borderStyle: 'solid',
                  borderWidth: `${el.sliceCenter.minY}px ${el.sliceCenter.maxX - el.sliceCenter.minX}px ${el.sliceCenter.maxY - el.sliceCenter.minY}px ${el.sliceCenter.minX}px`,
                  borderImageSource: `url("${el.image || ''}")`,
                  borderImageSlice: `${el.sliceCenter.minY} ${el.sliceCenter.maxX} ${el.sliceCenter.maxY} ${el.sliceCenter.minX} fill`,
                  borderImageRepeat: 'stretch',
                  opacity: 1 - (el.imageTransparency ?? 0)
                }}
                className="w-full h-full"
              />
            ) : (
              <img
                src={el.image || 'https://placehold.co/300x200/22222b/ffffff?text=Roblox+Decal'}
                alt={el.name}
                style={{
                  objectFit:
                    el.scaleType === 'Fit'
                      ? 'contain'
                      : el.scaleType === 'Crop'
                      ? 'cover'
                      : 'fill',
                  opacity: 1 - (el.imageTransparency ?? 0),
                  imageRendering: el.resampleMode === 'Pixelated' ? 'pixelated' : 'auto'
                }}
                className="w-full h-full pointer-events-none"
              />
            )}
          </div>
        )}

        {el.type === 'ViewportFrame' && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950/80 p-2 text-center pointer-events-none">
            <Box className="w-6 h-6 text-emerald-400 mb-1 animate-pulse" />
            <span className="text-[10px] text-emerald-300 font-mono">ViewportFrame 3D</span>
          </div>
        )}

        {/* Children rendering with Layout Modifiers support */}
        {children.length > 0 && (
          <div className="w-full h-full relative pointer-events-auto">
            {el.modifiers?.UIListLayout ? (
              (() => {
                const layout = el.modifiers.UIListLayout;
                const isVert = layout.fillDirection === 'Vertical';
                const pad = layout.padding || 0;
                let currentOffset = 0;

                return children.map(child => {
                  const childBounds = calculatePixelBounds(child, { w: bounds.w, h: bounds.h });
                  const override: PixelBounds = {
                    x: isVert ? 0 : currentOffset,
                    y: isVert ? currentOffset : 0,
                    w: childBounds.w,
                    h: childBounds.h
                  };
                  currentOffset += (isVert ? childBounds.h : childBounds.w) + pad;
                  return renderElementNode(
                    child,
                    { w: bounds.w, h: bounds.h },
                    override,
                    nextVisited,
                    depth + 1
                  );
                });
              })()
            ) : el.modifiers?.UIGridLayout ? (
              (() => {
                const grid = el.modifiers.UIGridLayout;
                const cellW = grid.cellSizeX || 80;
                const cellH = grid.cellSizeY || 80;
                const padX = grid.cellPaddingX || 8;
                const padY = grid.cellPaddingY || 8;
                const maxCols =
                  grid.maxCells > 0
                    ? grid.maxCells
                    : Math.max(1, Math.floor((bounds.w + padX) / (cellW + padX)));

                return children.map((child, idx) => {
                  const col = idx % maxCols;
                  const row = Math.floor(idx / maxCols);
                  const override: PixelBounds = {
                    x: col * (cellW + padX),
                    y: row * (cellH + padY),
                    w: cellW,
                    h: cellH
                  };
                  return renderElementNode(
                    child,
                    { w: bounds.w, h: bounds.h },
                    override,
                    nextVisited,
                    depth + 1
                  );
                });
              })()
            ) : (
              children.map(child =>
                renderElementNode(
                  child,
                  { w: bounds.w, h: bounds.h },
                  undefined,
                  nextVisited,
                  depth + 1
                )
              )
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate selected element bounding box on root canvas
  const getSelectedCanvasBounds = (): PixelBounds | null => {
    if (!selectedElement) return null;
    return calculateAbsolutePixelBounds(
      selectedElement,
      elements,
      { w: viewport.width, h: viewport.height - (viewport.showSafeInsets ? 24 : 0) }
    );
  };

  const selectedBounds = getSelectedCanvasBounds();

  // Drag and drop handlers for loading .rbxgui files directly onto the canvas
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDraggingFile(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (onLoadFile) {
        onLoadFile(file);
      }
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden relative select-none">
      {/* Top Workspace Toolbar */}
      <div className="h-9 bg-[#2d2d30] border-b border-[#3c3c3c] flex items-center justify-between px-3 text-xs shrink-0 z-20">
        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-1.5 bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#3e3e42]">
          <button
            onClick={() => handleZoom(-0.1)}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="p-1 hover:bg-[#2a2d2e] text-gray-300 rounded"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] text-gray-200 min-w-[42px] text-center font-semibold">
            {Math.round(viewport.zoom * 100)}%
          </span>

          <button
            onClick={() => handleZoom(0.1)}
            title="Zoom In"
            aria-label="Zoom In"
            className="p-1 hover:bg-[#2a2d2e] text-gray-300 rounded"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetZoom}
            title="Reset Zoom to 100%"
            className="px-1.5 py-0.5 hover:bg-[#2a2d2e] text-gray-400 hover:text-white rounded text-[11px] font-mono"
          >
            100%
          </button>

          <div className="h-3 w-px bg-[#3e3e42] mx-0.5" />

          <button
            onClick={handleCenterPan}
            title="Center Canvas"
            className="px-2 py-0.5 hover:bg-[#2a2d2e] text-gray-300 hover:text-white rounded text-[11px] flex items-center space-x-1"
          >
            <Crosshair className="w-3 h-3 text-[#00a2ff]" />
            <span>Center</span>
          </button>

          <button
            onClick={onFitToScreen}
            title="Fit canvas to view area"
            className="px-2 py-0.5 bg-[#007acc]/20 hover:bg-[#007acc] text-[#00a2ff] hover:text-white rounded text-[11px] font-medium flex items-center space-x-1 transition"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Fit Screen</span>
          </button>
        </div>

        {/* Viewport Presets, Safe Area & Snapping Grid */}
        <div className="flex items-center space-x-2">
          {/* Snapping Grid Controls */}
          <div className="flex items-center bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#3e3e42] space-x-1">
            <button
              onClick={() => {
                soundEffects.play('snap');
                onUpdateGridSettings({
                  ...gridSettings,
                  enabled: !gridSettings.enabled
                });
              }}
              title="Toggle Snapping to Grid"
              aria-label="Toggle Snapping to Grid"
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition ${
                gridSettings.enabled
                  ? 'bg-[#007acc] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2d2e]'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Snap</span>
            </button>

            <select
              value={gridSettings.step}
              onChange={e => {
                soundEffects.play('click');
                onUpdateGridSettings({
                  ...gridSettings,
                  step: parseInt(e.target.value) as GridStep
                });
              }}
              title="Grid Step (pixels)"
              className="bg-transparent text-[10px] font-mono text-gray-300 focus:outline-none cursor-pointer py-0.5"
            >
              <option value={4} className="bg-[#1e1e1e]">4px</option>
              <option value={8} className="bg-[#1e1e1e]">8px</option>
              <option value={16} className="bg-[#1e1e1e]">16px</option>
              <option value={32} className="bg-[#1e1e1e]">32px</option>
            </select>

            <button
              onClick={() => {
                soundEffects.play('click');
                onUpdateGridSettings({
                  ...gridSettings,
                  showGrid: !gridSettings.showGrid
                });
              }}
              title="Toggle Visual Grid Pattern Overlay"
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${
                gridSettings.showGrid
                  ? 'bg-emerald-600/30 text-emerald-300'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Grid
            </button>
          </div>

          <button
            onClick={() =>
              onUpdateViewport({ ...viewport, showSafeInsets: !viewport.showSafeInsets })
            }
            title="Toggle Roblox TopBar Safe Insets Mockup"
            className={`px-2 py-0.5 rounded border text-[11px] flex items-center space-x-1 transition ${
              viewport.showSafeInsets
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-[#1e1e1e] text-gray-400 border-[#3e3e42] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Safe Area</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400 text-[11px]">Device:</span>
            <select
              value={viewport.preset}
              onChange={e => handlePresetChange(e.target.value)}
              className="bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#007acc]"
            >
              <option value="1920x1080">1920 × 1080 (16:9 Full HD)</option>
              <option value="1280x720">1280 × 720 (16:9 Standard HD)</option>
              <option value="844x390">844 × 390 (iPhone 14)</option>
              <option value="1024x768">1024 × 768 (iPad 4:3)</option>
              <option value="2560x1440">2560 × 1440 (2K QHD)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-[#141416] ${
          isPanning
            ? 'cursor-grabbing'
            : isSpacePressed
            ? 'cursor-grab'
            : 'cursor-default'
        }`}
      >
        {/* Drag & Drop Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 bg-[#007acc]/20 backdrop-blur-xs border-2 border-dashed border-[#00a2ff] z-50 flex flex-col items-center justify-center pointer-events-none animate-pulse">
            <div className="bg-[#1e1e1e]/95 p-6 rounded-xl border border-[#00a2ff] flex flex-col items-center text-center shadow-2xl max-w-sm">
              <div className="w-16 h-16 rounded-full bg-[#007acc]/20 text-[#00a2ff] flex items-center justify-center mb-3">
                <Upload className="w-8 h-8 animate-bounce text-[#00a2ff]" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Drop .rbxgui File Here</h3>
              <p className="text-xs text-gray-300">
                Release to instantly load and restore your Roblox GUI Studio project
              </p>
              <div className="mt-3 px-2 py-0.5 bg-black/50 rounded text-[11px] font-mono text-[#00a2ff] border border-[#007acc]/40">
                *.rbxgui &bull; *.json
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            transformOrigin: 'center center'
          }}
          className="relative transition-transform duration-75 will-change-transform"
        >
          {/* Studio Canvas Box */}
          <div
            id="studioCanvas"
            onClick={() => onSelectElement(null, null)}
            style={{
              width: `${viewport.width}px`,
              height: `${viewport.height}px`
            }}
            className="relative bg-black shadow-2xl border border-[#404040] overflow-hidden select-none"
          >
            {/* SVG Grid Overlay */}
            {gridSettings.showGrid && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-25 z-10"
                width={viewport.width}
                height={viewport.height}
              >
                <defs>
                  <pattern
                    id="canvasGridPattern"
                    width={gridSettings.step}
                    height={gridSettings.step}
                    patternUnits="userSpaceOnUse"
                  >
                    <circle
                      cx={gridSettings.step / 2}
                      cy={gridSettings.step / 2}
                      r={1.2}
                      fill="#00a2ff"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#canvasGridPattern)" />
              </svg>
            )}

            {/* Roblox TopBar Safe Insets Mockup */}
            {viewport.showSafeInsets && (
              <div className="h-6 w-full bg-black/50 border-b border-white/10 flex items-center justify-between px-3 text-[10px] text-gray-300 pointer-events-none z-30 select-none">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#00a2ff]">ROBLOX</span>
                  <span className="text-gray-500">|</span>
                  <span className="font-mono text-gray-400">CoreGui TopBar</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Wifi className="w-3 h-3 text-emerald-400" />
                    <span>60 FPS</span>
                  </div>
                  <span>Ping: 24ms</span>
                </div>
              </div>
            )}

            {/* Elements container */}
            <div
              className={`absolute inset-0 ${
                viewport.showSafeInsets ? 'top-6' : 'top-0'
              } pointer-events-auto`}
            >
              {elements.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-gray-300 p-6 pointer-events-auto">
                  <div className="max-w-md w-full bg-[#252526]/90 backdrop-blur-md border border-[#3e3e42] rounded-xl p-8 flex flex-col items-center text-center shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00a2ff]/20 to-[#007acc]/10 border border-[#00a2ff]/30 flex items-center justify-center text-[#00a2ff] mb-4 shadow-inner">
                      <Box className="w-8 h-8" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1.5">Roblox Canvas is Empty</h3>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                      Start fresh by loading an existing <span className="text-[#00a2ff] font-mono font-semibold">.rbxgui</span> project file, creating a starter frame, or picking a pre-made template.
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
                      {onTriggerLoadFileDialog && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onTriggerLoadFileDialog();
                          }}
                          className="flex-1 px-4 py-2.5 bg-[#007acc] hover:bg-[#008be6] text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-[#007acc]/20 transition cursor-pointer"
                        >
                          <FolderOpen className="w-4 h-4 text-white" />
                          <span>Load .rbxgui File</span>
                        </button>
                      )}

                      {onAddStarterFrame && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onAddStarterFrame();
                          }}
                          className="flex-1 px-4 py-2.5 bg-[#2d2d30] hover:bg-[#38383c] border border-[#4a4a50] text-gray-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>New Frame</span>
                        </button>
                      )}
                    </div>

                    {onOpenTemplates && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenTemplates();
                        }}
                        className="mt-3.5 text-xs text-gray-400 hover:text-amber-300 flex items-center space-x-1.5 transition underline-offset-2 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Or explore pre-made templates</span>
                      </button>
                    )}

                    {/* Drop hint */}
                    <div className="mt-5 pt-3.5 border-t border-[#3e3e42] w-full flex items-center justify-center text-[11px] text-gray-400 space-x-2">
                      <Upload className="w-3.5 h-3.5 text-[#00a2ff]" />
                      <span>Drag &amp; drop any <b>.rbxgui</b> file here, or press <b>Ctrl+O</b></span>
                    </div>
                  </div>
                </div>
              ) : (
                elements
                  .filter(el => !el.parentId || el.parentId === null || !elements.some(p => p.id === el.parentId))
                  .map(el =>
                    renderElementNode(el, {
                      w: viewport.width,
                      h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
                    })
                  )
              )}
            </div>

            {/* Additional Multi-Selected Elements Outlines */}
            {selectedIds
              .filter(id => id !== selectedId)
              .map(id => {
                const el = elements.find(e => e.id === id);
                if (!el) return null;
                const bounds = calculateAbsolutePixelBounds(el, elements, {
                  w: viewport.width,
                  h: viewport.height - (viewport.showSafeInsets ? 24 : 0)
                });
                return (
                  <div
                    key={`multi_${id}`}
                    style={{
                      position: 'absolute',
                      left: `${bounds.x}px`,
                      top: `${bounds.y + (viewport.showSafeInsets ? 24 : 0)}px`,
                      width: `${bounds.w}px`,
                      height: `${bounds.h}px`,
                      pointerEvents: 'none',
                      zIndex: 35
                    }}
                    className="border-2 border-dashed border-amber-400"
                  >
                    <div className="absolute -top-5 left-0 bg-amber-400 text-black font-mono text-[9px] font-bold px-1 py-0.2 rounded shadow whitespace-nowrap">
                      {el.name}
                    </div>
                  </div>
                );
              })}

            {/* Interactive Wireframe Selection Box & 8 Resize Handles */}
            {selectedElement && selectedBounds && (
              <div
                style={{
                  position: 'absolute',
                  left: `${selectedBounds.x}px`,
                  top: `${selectedBounds.y + (viewport.showSafeInsets ? 24 : 0)}px`,
                  width: `${selectedBounds.w}px`,
                  height: `${selectedBounds.h}px`,
                  pointerEvents: 'none',
                  zIndex: 40
                }}
                className="border-2 border-[#00a2ff]"
              >
                {/* 8 Resize Handles */}
                <div
                  onMouseDown={e => handleResizeStart('nw', e)}
                  style={{ top: '-5px', left: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('ne', e)}
                  style={{ top: '-5px', right: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('se', e)}
                  style={{ bottom: '-5px', right: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('sw', e)}
                  style={{ bottom: '-5px', left: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm"
                />

                <div
                  onMouseDown={e => handleResizeStart('n', e)}
                  style={{ top: '-5px', left: 'calc(50% - 5px)' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('e', e)}
                  style={{ top: 'calc(50% - 5px)', right: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('s', e)}
                  style={{ bottom: '-5px', left: 'calc(50% - 5px)' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                />
                <div
                  onMouseDown={e => handleResizeStart('w', e)}
                  style={{ top: 'calc(50% - 5px)', left: '-5px' }}
                  className="absolute w-2.5 h-2.5 bg-white border border-[#00a2ff] rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                />

                {/* Selected Badge */}
                <div className="absolute -top-6 left-0 bg-[#00a2ff] text-black font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                  {selectedElement.name} ({Math.round(selectedBounds.w)} × {Math.round(selectedBounds.h)})
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
