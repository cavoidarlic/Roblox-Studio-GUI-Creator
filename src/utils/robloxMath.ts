import {
  RobloxElement,
  UDim2,
  Vector2D,
  GuiRootType,
  RootProperties
} from '../types/roblox';

export interface PixelBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ParentSize {
  w: number;
  h: number;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '#393939').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean || '0', 16);
  if (isNaN(num)) return { r: 57, g: 57, b: 57 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function hexToColor3Call(hex: string): string {
  const rgb = hexToRgb(hex);
  return `Color3.fromRGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function calculatePixelBounds(
  element: RobloxElement,
  parentSize: ParentSize
): PixelBounds {
  const safeParentW = Math.max(1, parentSize.w);
  const safeParentH = Math.max(1, parentSize.h);

  let w = (element.size.scaleX * safeParentW) + element.size.offsetX;
  let h = (element.size.scaleY * safeParentH) + element.size.offsetY;

  // Apply UIAspectRatioConstraint if present
  if (element.modifiers?.UIAspectRatioConstraint) {
    const ratio = Math.max(0.01, element.modifiers.UIAspectRatioConstraint.aspectRatio || 1);
    const dominant = element.modifiers.UIAspectRatioConstraint.dominantAxis || 'Width';
    if (dominant === 'Width') {
      h = w / ratio;
    } else {
      w = h * ratio;
    }
  }

  // UISizeConstraint
  if (element.modifiers?.UISizeConstraint) {
    const sc = element.modifiers.UISizeConstraint;
    if (sc.minSizeX > 0) w = Math.max(sc.minSizeX, w);
    if (sc.minSizeY > 0) h = Math.max(sc.minSizeY, h);
    if (sc.maxSizeX > 0) w = Math.min(sc.maxSizeX, w);
    if (sc.maxSizeY > 0) h = Math.min(sc.maxSizeY, h);
  }

  const finalW = Math.max(1, w);
  const finalH = Math.max(1, h);

  let x = (element.position.scaleX * safeParentW) + element.position.offsetX;
  let y = (element.position.scaleY * safeParentH) + element.position.offsetY;

  const ax = element.anchorPoint ? element.anchorPoint.x : 0;
  const ay = element.anchorPoint ? element.anchorPoint.y : 0;

  x -= ax * finalW;
  y -= ay * finalH;

  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    w: Math.round(finalW * 100) / 100,
    h: Math.round(finalH * 100) / 100
  };
}

export function calculateZoomToPoint(
  currentZoom: number,
  currentPanX: number,
  currentPanY: number,
  mouseDx: number,
  mouseDy: number,
  deltaY: number
): { zoom: number; panX: number; panY: number } {
  const zoomFactor = deltaY < 0 ? 1.12 : 0.88;
  const nextZoom = Math.max(0.15, Math.min(3.0, Number((currentZoom * zoomFactor).toFixed(3))));
  const ratio = nextZoom / currentZoom;
  const nextPanX = Math.round(mouseDx - (mouseDx - currentPanX) * ratio);
  const nextPanY = Math.round(mouseDy - (mouseDy - currentPanY) * ratio);

  return {
    zoom: nextZoom,
    panX: nextPanX,
    panY: nextPanY
  };
}

export function calculateAbsolutePixelBounds(
  element: RobloxElement,
  allElements: RobloxElement[],
  screenSize: { w: number; h: number }
): PixelBounds {
  const ancestors: RobloxElement[] = [];
  const visited = new Set<string>([element.id]);
  let curr: RobloxElement | undefined = element;
  while (curr && curr.parentId) {
    if (visited.has(curr.parentId)) {
      break;
    }
    visited.add(curr.parentId);
    const parent = allElements.find(e => e.id === curr?.parentId);
    if (parent) {
      ancestors.unshift(parent);
      curr = parent;
    } else {
      break;
    }
  }

  let currentParentBounds = { w: screenSize.w, h: screenSize.h };
  let currentOrigin = { x: 0, y: 0 };

  for (const ancestor of ancestors) {
    const bounds = calculatePixelBounds(ancestor, currentParentBounds);
    currentOrigin.x += bounds.x;
    currentOrigin.y += bounds.y;
    currentParentBounds = { w: bounds.w, h: bounds.h };
  }

  const localBounds = calculatePixelBounds(element, currentParentBounds);
  return {
    x: Math.round((currentOrigin.x + localBounds.x) * 100) / 100,
    y: Math.round((currentOrigin.y + localBounds.y) * 100) / 100,
    w: localBounds.w,
    h: localBounds.h
  };
}

export function getParentPixelSize(
  element: RobloxElement,
  allElements: RobloxElement[],
  screenSize: { w: number; h: number }
): ParentSize {
  if (!element.parentId) {
    return {
      w: Math.max(1, screenSize.w),
      h: Math.max(1, screenSize.h)
    };
  }

  const parent = allElements.find(e => e.id === element.parentId);
  if (!parent) {
    return {
      w: Math.max(1, screenSize.w),
      h: Math.max(1, screenSize.h)
    };
  }

  const parentBounds = calculateAbsolutePixelBounds(parent, allElements, screenSize);
  return {
    w: Math.max(1, parentBounds.w),
    h: Math.max(1, parentBounds.h)
  };
}

export function convertToScale(
  element: RobloxElement,
  parentSize: ParentSize
): { size: UDim2; position: UDim2 } {
  const safeParentW = Math.max(1, parentSize.w);
  const safeParentH = Math.max(1, parentSize.h);
  const bounds = calculatePixelBounds(element, parentSize);

  // Undo anchor point offset for position
  const ax = element.anchorPoint?.x || 0;
  const ay = element.anchorPoint?.y || 0;
  const originX = bounds.x + (ax * bounds.w);
  const originY = bounds.y + (ay * bounds.h);

  return {
    size: {
      scaleX: Number((bounds.w / safeParentW).toFixed(4)),
      offsetX: 0,
      scaleY: Number((bounds.h / safeParentH).toFixed(4)),
      offsetY: 0
    },
    position: {
      scaleX: Number((originX / safeParentW).toFixed(4)),
      offsetX: 0,
      scaleY: Number((originY / safeParentH).toFixed(4)),
      offsetY: 0
    }
  };
}

/**
 * Converts an element to pure Scale relative to its immediate Parent container.
 * In Roblox, children calculate Scale UDim2 as a ratio of their immediate Parent!
 */
export function convertToParentScale(
  element: RobloxElement,
  allElements: RobloxElement[],
  screenSize: { w: number; h: number }
): { size: UDim2; position: UDim2 } {
  const parentSize = getParentPixelSize(element, allElements, screenSize);
  return convertToScale(element, parentSize);
}

/**
 * Converts an element to pure Scale relative to the entire ScreenGui root.
 */
export function convertToScreenGuiScale(
  element: RobloxElement,
  allElements: RobloxElement[],
  screenSize: { w: number; h: number }
): { size: UDim2; position: UDim2 } {
  const screenParentSize = {
    w: Math.max(1, screenSize.w),
    h: Math.max(1, screenSize.h)
  };

  if (!element.parentId) {
    return convertToScale(element, screenParentSize);
  }

  const parentSize = getParentPixelSize(element, allElements, screenSize);
  const bounds = calculatePixelBounds(element, parentSize);

  const ax = element.anchorPoint?.x || 0;
  const ay = element.anchorPoint?.y || 0;
  const originX = bounds.x + (ax * bounds.w);
  const originY = bounds.y + (ay * bounds.h);

  return {
    size: {
      scaleX: Number((bounds.w / screenParentSize.w).toFixed(4)),
      offsetX: 0,
      scaleY: Number((bounds.h / screenParentSize.h).toFixed(4)),
      offsetY: 0
    },
    position: {
      scaleX: Number((originX / screenParentSize.w).toFixed(4)),
      offsetX: 0,
      scaleY: Number((originY / screenParentSize.h).toFixed(4)),
      offsetY: 0
    }
  };
}

export function convertToOffset(
  element: RobloxElement,
  parentSize: ParentSize
): { size: UDim2; position: UDim2 } {
  const bounds = calculatePixelBounds(element, parentSize);
  const ax = element.anchorPoint?.x || 0;
  const ay = element.anchorPoint?.y || 0;
  const originX = bounds.x + (ax * bounds.w);
  const originY = bounds.y + (ay * bounds.h);

  return {
    size: {
      scaleX: 0,
      offsetX: Math.round(bounds.w),
      scaleY: 0,
      offsetY: Math.round(bounds.h)
    },
    position: {
      scaleX: 0,
      offsetX: Math.round(originX),
      scaleY: 0,
      offsetY: Math.round(originY)
    }
  };
}

export function convertElementToOffset(
  element: RobloxElement,
  allElements: RobloxElement[],
  screenSize: { w: number; h: number }
): { size: UDim2; position: UDim2 } {
  const parentSize = getParentPixelSize(element, allElements, screenSize);
  return convertToOffset(element, parentSize);
}

export function sanitizeVariableName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleaned || /^[0-9]/.test(cleaned)) {
    return 'ui_' + cleaned;
  }
  return cleaned;
}

export function generateLuauScript(
  rootType: GuiRootType,
  rootProps: RootProperties,
  elements: RobloxElement[]
): string {
  let script = `--[[
    ========================================================
    Roblox Studio GUI Auto-Generated Script
    Target Container: ${rootType}
    Element Count: ${elements.length}
    Export Date: ${new Date().toISOString()}
    Generated by Roblox Studio GUI Creator
    ========================================================
--]]

local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

`;

  if (rootType === 'ScreenGui') {
    const props = rootProps.ScreenGui;
    script += `-- Initialize Root ScreenGui\n`;
    script += `local root = Instance.new("ScreenGui")\n`;
    script += `root.Name = "${props.Name}"\n`;
    script += `root.ResetOnSpawn = ${props.ResetOnSpawn}\n`;
    script += `root.IgnoreGuiInset = ${props.IgnoreGuiInset}\n`;
    script += `root.ZIndexBehavior = Enum.ZIndexBehavior.${props.ZIndexBehavior}\n`;
    script += `root.DisplayOrder = ${props.DisplayOrder || 0}\n`;
    script += `root.Parent = playerGui\n\n`;
  } else if (rootType === 'SurfaceGui') {
    const props = rootProps.SurfaceGui;
    script += `-- Initialize Root SurfaceGui\n`;
    script += `local root = Instance.new("SurfaceGui")\n`;
    script += `root.Name = "${props.Name}"\n`;
    script += `root.Face = Enum.NormalId.${props.Face}\n`;
    script += `root.CanvasSize = Vector2.new(${props.CanvasSize.x}, ${props.CanvasSize.y})\n`;
    script += `root.AlwaysOnTop = ${props.AlwaysOnTop}\n`;
    script += `root.LightInfluence = ${props.LightInfluence || 0}\n`;
    script += `root.Adornee = ${props.AdorneePart || 'workspace.Part'}\n`;
    script += `root.Parent = root.Adornee\n\n`;
  } else if (rootType === 'BillboardGui') {
    const props = rootProps.BillboardGui;
    script += `-- Initialize Root BillboardGui\n`;
    script += `local root = Instance.new("BillboardGui")\n`;
    script += `root.Name = "${props.Name}"\n`;
    script += `root.Size = UDim2.new(${props.Size.scaleX}, ${props.Size.offsetX}, ${props.Size.scaleY}, ${props.Size.offsetY})\n`;
    script += `root.StudsOffset = Vector3.new(${props.StudsOffset.x}, ${props.StudsOffset.y}, ${props.StudsOffset.z})\n`;
    script += `root.AlwaysOnTop = ${props.AlwaysOnTop}\n`;
    script += `root.MaxDistance = ${props.MaxDistance}\n`;
    script += `root.Adornee = ${props.AdorneePart || 'player.Character:WaitForChild("Head")'}\n`;
    script += `root.Parent = playerGui\n\n`;
  }

  const varMap = new Map<string, string>();

  elements.forEach((el, index) => {
    const baseVar = sanitizeVariableName(el.name);
    const varName = `${baseVar}_${index + 1}`;
    varMap.set(el.id, varName);

    const parentVar = el.parentId && varMap.has(el.parentId)
      ? varMap.get(el.parentId)!
      : 'root';

    script += `-- [ Element: ${el.name} (${el.type}) ] --\n`;
    script += `local ${varName} = Instance.new("${el.type}")\n`;
    script += `${varName}.Name = "${el.name}"\n`;
    script += `${varName}.Size = UDim2.new(${el.size.scaleX}, ${el.size.offsetX}, ${el.size.scaleY}, ${el.size.offsetY})\n`;
    script += `${varName}.Position = UDim2.new(${el.position.scaleX}, ${el.position.offsetX}, ${el.position.scaleY}, ${el.position.offsetY})\n`;

    if (el.anchorPoint && (el.anchorPoint.x !== 0 || el.anchorPoint.y !== 0)) {
      script += `${varName}.AnchorPoint = Vector2.new(${el.anchorPoint.x}, ${el.anchorPoint.y})\n`;
    }

    script += `${varName}.BackgroundColor3 = ${hexToColor3Call(el.backgroundColor)}\n`;
    script += `${varName}.BackgroundTransparency = ${el.backgroundTransparency ?? 0}\n`;

    if (el.borderSizePixel > 0) {
      script += `${varName}.BorderSizePixel = ${el.borderSizePixel}\n`;
      script += `${varName}.BorderColor3 = ${hexToColor3Call(el.borderColor || '#000000')}\n`;
    } else {
      script += `${varName}.BorderSizePixel = 0\n`;
    }

    script += `${varName}.ZIndex = ${el.zIndex || 1}\n`;
    script += `${varName}.Visible = ${el.visible !== false}\n`;

    // Type-specific properties
    if (el.type === 'TextLabel' || el.type === 'TextButton' || el.type === 'TextBox') {
      script += `${varName}.Text = "${(el.text || '').replace(/"/g, '\\"')}"\n`;
      script += `${varName}.TextColor3 = ${hexToColor3Call(el.textColor || '#ffffff')}\n`;
      if (el.textTransparency !== undefined && el.textTransparency > 0) {
        script += `${varName}.TextTransparency = ${el.textTransparency}\n`;
      }
      script += `${varName}.TextSize = ${el.textSize || 14}\n`;
      script += `${varName}.Font = Enum.Font.${el.font || 'SourceSans'}\n`;
      if (el.textScaled) script += `${varName}.TextScaled = true\n`;
      if (el.textXAlignment) script += `${varName}.TextXAlignment = Enum.TextXAlignment.${el.textXAlignment}\n`;
      if (el.textYAlignment) script += `${varName}.TextYAlignment = Enum.TextYAlignment.${el.textYAlignment}\n`;
    }

    if (el.type === 'TextBox' && el.placeholderText) {
      script += `${varName}.PlaceholderText = "${el.placeholderText.replace(/"/g, '\\"')}"\n`;
      if (el.placeholderColor) script += `${varName}.PlaceholderColor3 = ${hexToColor3Call(el.placeholderColor)}\n`;
    }

    if (el.type === 'ImageLabel' || el.type === 'ImageButton') {
      const imgVal = el.image || 'rbxassetid://0';
      script += `${varName}.Image = "${imgVal}"\n`;
      script += `${varName}.ScaleType = Enum.ScaleType.${el.scaleType || 'Stretch'}\n`;
      script += `${varName}.ImageColor3 = ${hexToColor3Call(el.imageColor || '#ffffff')}\n`;
      script += `${varName}.ImageTransparency = ${el.imageTransparency ?? 0}\n`;
      if (el.resampleMode === 'Pixelated') {
        script += `${varName}.ResampleMode = Enum.ResamplerMode.Pixelated\n`;
      }
      if (el.scaleType === 'Slice' && el.sliceCenter) {
        const sc = el.sliceCenter;
        script += `${varName}.SliceCenter = Rect.new(${sc.minX}, ${sc.minY}, ${sc.maxX}, ${sc.maxY})\n`;
      }
      if (el.scaleType === 'Tile' && el.tileSize) {
        script += `${varName}.TileSize = UDim2.fromOffset(${el.tileSize.x}, ${el.tileSize.y})\n`;
      }
    }

    if (el.type === 'ScrollingFrame') {
      if (el.canvasSize) {
        script += `${varName}.CanvasSize = UDim2.new(${el.canvasSize.scaleX}, ${el.canvasSize.offsetX}, ${el.canvasSize.scaleY}, ${el.canvasSize.offsetY})\n`;
      }
      script += `${varName}.ScrollBarThickness = ${el.scrollBarThickness || 8}\n`;
      if (el.scrollBarColor) {
        script += `${varName}.ScrollBarImageColor3 = ${hexToColor3Call(el.scrollBarColor)}\n`;
      }
    }

    // Modifiers & Layouts
    if (el.modifiers) {
      if (el.modifiers.UICorner) {
        const c = el.modifiers.UICorner;
        const cornerVar = `${varName}_Corner`;
        script += `local ${cornerVar} = Instance.new("UICorner")\n`;
        script += `${cornerVar}.CornerRadius = UDim.new(${c.cornerRadiusScale || 0}, ${c.cornerRadiusOffset || 8})\n`;
        script += `${cornerVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIStroke) {
        const s = el.modifiers.UIStroke;
        const strokeVar = `${varName}_Stroke`;
        script += `local ${strokeVar} = Instance.new("UIStroke")\n`;
        script += `${strokeVar}.Color = ${hexToColor3Call(s.color || '#00a2ff')}\n`;
        script += `${strokeVar}.Thickness = ${s.thickness || 2}\n`;
        script += `${strokeVar}.Transparency = ${s.transparency || 0}\n`;
        script += `${strokeVar}.ApplyStrokeMode = Enum.ApplyStrokeMode.${s.applyStrokeMode || 'Border'}\n`;
        script += `${strokeVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIGradient) {
        const g = el.modifiers.UIGradient;
        const gradVar = `${varName}_Gradient`;
        script += `local ${gradVar} = Instance.new("UIGradient")\n`;
        script += `${gradVar}.Rotation = ${g.rotation || 0}\n`;
        if (g.transparency !== undefined && g.transparency > 0) {
          script += `${gradVar}.Transparency = NumberSequence.new(${g.transparency})\n`;
        }
        if (g.keypoints && g.keypoints.length > 0) {
          const sorted = [...g.keypoints].sort((a, b) => a.time - b.time);
          script += `${gradVar}.Color = ColorSequence.new({\n`;
          sorted.forEach((kp, idx) => {
            const isLast = idx === sorted.length - 1;
            script += `    ColorSequenceKeypoint.new(${kp.time.toFixed(3).replace(/\.?0+$/, '') || '0'}, ${hexToColor3Call(kp.color)})${isLast ? '' : ','}\n`;
          });
          script += `})\n`;
        } else {
          script += `${gradVar}.Color = ColorSequence.new({\n`;
          script += `    ColorSequenceKeypoint.new(0, ${hexToColor3Call(g.color1 || '#ff007f')}),\n`;
          script += `    ColorSequenceKeypoint.new(1, ${hexToColor3Call(g.color2 || '#7928ca')})\n`;
          script += `})\n`;
        }
        script += `${gradVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIPadding) {
        const p = el.modifiers.UIPadding;
        const padVar = `${varName}_Padding`;
        script += `local ${padVar} = Instance.new("UIPadding")\n`;
        script += `${padVar}.PaddingTop = UDim.new(0, ${p.top || 0})\n`;
        script += `${padVar}.PaddingBottom = UDim.new(0, ${p.bottom || 0})\n`;
        script += `${padVar}.PaddingLeft = UDim.new(0, ${p.left || 0})\n`;
        script += `${padVar}.PaddingRight = UDim.new(0, ${p.right || 0})\n`;
        script += `${padVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIAspectRatioConstraint) {
        const a = el.modifiers.UIAspectRatioConstraint;
        const aspectVar = `${varName}_AspectRatio`;
        script += `local ${aspectVar} = Instance.new("UIAspectRatioConstraint")\n`;
        script += `${aspectVar}.AspectRatio = ${a.aspectRatio || 1}\n`;
        script += `${aspectVar}.DominantAxis = Enum.DominantAxis.${a.dominantAxis || 'Width'}\n`;
        script += `${aspectVar}.AspectType = Enum.AspectType.${a.aspectType || 'FitWithinMaxSize'}\n`;
        script += `${aspectVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIListLayout) {
        const l = el.modifiers.UIListLayout;
        const listVar = `${varName}_ListLayout`;
        script += `local ${listVar} = Instance.new("UIListLayout")\n`;
        script += `${listVar}.FillDirection = Enum.FillDirection.${l.fillDirection || 'Vertical'}\n`;
        script += `${listVar}.Padding = UDim.new(0, ${l.padding || 0})\n`;
        script += `${listVar}.HorizontalAlignment = Enum.HorizontalAlignment.${l.horizontalAlignment || 'Left'}\n`;
        script += `${listVar}.VerticalAlignment = Enum.VerticalAlignment.${l.verticalAlignment || 'Top'}\n`;
        script += `${listVar}.Parent = ${varName}\n`;
      }

      if (el.modifiers.UIGridLayout) {
        const g = el.modifiers.UIGridLayout;
        const gridVar = `${varName}_GridLayout`;
        script += `local ${gridVar} = Instance.new("UIGridLayout")\n`;
        script += `${gridVar}.CellSize = UDim2.new(0, ${g.cellSizeX || 80}, 0, ${g.cellSizeY || 80})\n`;
        script += `${gridVar}.CellPadding = UDim2.new(0, ${g.cellPaddingX || 8}, 0, ${g.cellPaddingY || 8})\n`;
        script += `${gridVar}.FillDirection = Enum.FillDirection.${g.fillDirection || 'Horizontal'}\n`;
        if (g.maxCells > 0) {
          script += `${gridVar}.FillDirectionMaxCells = ${g.maxCells}\n`;
        }
        script += `${gridVar}.Parent = ${varName}\n`;
      }
    }

    script += `${varName}.Parent = ${parentVar}\n\n`;
  });

  script += `print("Loaded ${elements.length} Roblox GUI elements successfully!")\n`;
  return script;
}

export function snapToGrid(val: number, step: number): number {
  if (!step || step <= 1) return val;
  return Math.round(val / step) * step;
}

export function solveAspectRatioDimension(
  knownDim: 'width' | 'height',
  knownValue: number,
  ratioWidth: number,
  ratioHeight: number
): { calculatedValue: number; ratioDecimal: number } {
  const safeRW = Math.max(0.0001, ratioWidth);
  const safeRH = Math.max(0.0001, ratioHeight);
  const ratioDecimal = safeRW / safeRH;
  let calculatedValue = 0;
  if (knownDim === 'width') {
    calculatedValue = Math.round(knownValue / ratioDecimal);
  } else {
    calculatedValue = Math.round(knownValue * ratioDecimal);
  }
  return {
    calculatedValue: Math.max(1, calculatedValue),
    ratioDecimal: Number(ratioDecimal.toFixed(4))
  };
}

export function convertScaleToOffset(
  scaleX: number,
  scaleY: number,
  screenW: number,
  screenH: number
): { offsetX: number; offsetY: number } {
  return {
    offsetX: Math.round(scaleX * Math.max(1, screenW)),
    offsetY: Math.round(scaleY * Math.max(1, screenH))
  };
}

export function convertOffsetToScale(
  offsetX: number,
  offsetY: number,
  screenW: number,
  screenH: number
): { scaleX: number; scaleY: number } {
  const safeW = Math.max(1, screenW);
  const safeH = Math.max(1, screenH);
  return {
    scaleX: Number((offsetX / safeW).toFixed(4)),
    scaleY: Number((offsetY / safeH).toFixed(4))
  };
}

export function alignElements(
  elementsToAlign: RobloxElement[],
  alignType: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distributeH' | 'distributeV',
  parentBounds: { w: number; h: number }
): RobloxElement[] {
  if (elementsToAlign.length < 2) return elementsToAlign;

  const computed = elementsToAlign.map(el => {
    const bounds = calculatePixelBounds(el, parentBounds);
    return { el, bounds };
  });

  if (alignType === 'left') {
    const minLeft = Math.min(...computed.map(c => c.bounds.x));
    return computed.map(({ el, bounds }) => {
      const deltaX = minLeft - bounds.x;
      return {
        ...el,
        position: {
          ...el.position,
          offsetX: Math.round(el.position.offsetX + deltaX)
        }
      };
    });
  }

  if (alignType === 'right') {
    const maxRight = Math.max(...computed.map(c => c.bounds.x + c.bounds.w));
    return computed.map(({ el, bounds }) => {
      const deltaX = maxRight - (bounds.x + bounds.w);
      return {
        ...el,
        position: {
          ...el.position,
          offsetX: Math.round(el.position.offsetX + deltaX)
        }
      };
    });
  }

  if (alignType === 'center') {
    // Find min and max to determine center of the bounding group
    const minX = Math.min(...computed.map(c => c.bounds.x));
    const maxX = Math.max(...computed.map(c => c.bounds.x + c.bounds.w));
    const groupCenterX = (minX + maxX) / 2;
    return computed.map(({ el, bounds }) => {
      const currentCenterX = bounds.x + bounds.w / 2;
      const deltaX = groupCenterX - currentCenterX;
      return {
        ...el,
        position: {
          ...el.position,
          offsetX: Math.round(el.position.offsetX + deltaX)
        }
      };
    });
  }

  if (alignType === 'top') {
    const minTop = Math.min(...computed.map(c => c.bounds.y));
    return computed.map(({ el, bounds }) => {
      const deltaY = minTop - bounds.y;
      return {
        ...el,
        position: {
          ...el.position,
          offsetY: Math.round(el.position.offsetY + deltaY)
        }
      };
    });
  }

  if (alignType === 'bottom') {
    const maxBottom = Math.max(...computed.map(c => c.bounds.y + c.bounds.h));
    return computed.map(({ el, bounds }) => {
      const deltaY = maxBottom - (bounds.y + bounds.h);
      return {
        ...el,
        position: {
          ...el.position,
          offsetY: Math.round(el.position.offsetY + deltaY)
        }
      };
    });
  }

  if (alignType === 'middle') {
    const minY = Math.min(...computed.map(c => c.bounds.y));
    const maxY = Math.max(...computed.map(c => c.bounds.y + c.bounds.h));
    const groupCenterY = (minY + maxY) / 2;
    return computed.map(({ el, bounds }) => {
      const currentCenterY = bounds.y + bounds.h / 2;
      const deltaY = groupCenterY - currentCenterY;
      return {
        ...el,
        position: {
          ...el.position,
          offsetY: Math.round(el.position.offsetY + deltaY)
        }
      };
    });
  }

  if (alignType === 'distributeH') {
    // Sort left to right
    const sorted = [...computed].sort((a, b) => a.bounds.x - b.bounds.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.bounds.x + last.bounds.w) - first.bounds.x;
    const totalItemWidths = sorted.reduce((sum, item) => sum + item.bounds.w, 0);
    const availableGap = totalSpan - totalItemWidths;
    const gap = sorted.length > 1 ? availableGap / (sorted.length - 1) : 0;

    let currentX = first.bounds.x;
    const result: RobloxElement[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (i === 0) {
        result.push(item.el);
        currentX += item.bounds.w + gap;
      } else {
        const deltaX = currentX - item.bounds.x;
        result.push({
          ...item.el,
          position: {
            ...item.el.position,
            offsetX: Math.round(item.el.position.offsetX + deltaX)
          }
        });
        currentX += item.bounds.w + gap;
      }
    }
    return result;
  }

  if (alignType === 'distributeV') {
    // Sort top to bottom
    const sorted = [...computed].sort((a, b) => a.bounds.y - b.bounds.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = (last.bounds.y + last.bounds.h) - first.bounds.y;
    const totalItemHeights = sorted.reduce((sum, item) => sum + item.bounds.h, 0);
    const availableGap = totalSpan - totalItemHeights;
    const gap = sorted.length > 1 ? availableGap / (sorted.length - 1) : 0;

    let currentY = first.bounds.y;
    const result: RobloxElement[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      if (i === 0) {
        result.push(item.el);
        currentY += item.bounds.h + gap;
      } else {
        const deltaY = currentY - item.bounds.y;
        result.push({
          ...item.el,
          position: {
            ...item.el.position,
            offsetY: Math.round(item.el.position.offsetY + deltaY)
          }
        });
        currentY += item.bounds.h + gap;
      }
    }
    return result;
  }

  return elementsToAlign;
}

export function generateTweenServiceLuau(
  elementName: string,
  config: {
    hoverScale: number;
    clickEffect: string;
    easingStyle: string;
    easingDirection: string;
    duration: number;
  }
): string {
  const safeName = sanitizeVariableName(elementName || 'TargetElement');
  return `--[[
  ======================================================
  Roblox TweenService Interactive Animation Controller
  Element: ${elementName}
  Easing: Enum.EasingStyle.${config.easingStyle}, Enum.EasingDirection.${config.easingDirection}
  Duration: ${config.duration}s
  ======================================================
--]]

local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")

local target = script.Parent:WaitForChild("${elementName}")
local originalSize = target.Size
local originalPosition = target.Position

-- TweenInfo configuration
local tweenInfo = TweenInfo.new(
    ${config.duration},
    Enum.EasingStyle.${config.easingStyle},
    Enum.EasingDirection.${config.easingDirection},
    0,
    false,
    0
)

local fastReturnInfo = TweenInfo.new(
    ${Math.max(0.08, Number((config.duration * 0.75).toFixed(2)))},
    Enum.EasingStyle.${config.easingStyle},
    Enum.EasingDirection.Out
)

-- Hover Effects
local hoverGoal = {
    Size = UDim2.new(
        originalSize.X.Scale * ${config.hoverScale},
        originalSize.X.Offset * ${config.hoverScale},
        originalSize.Y.Scale * ${config.hoverScale},
        originalSize.Y.Offset * ${config.hoverScale}
    )
}
local normalGoal = {
    Size = originalSize
}

local hoverTween = TweenService:Create(target, tweenInfo, hoverGoal)
local unhoverTween = TweenService:Create(target, fastReturnInfo, normalGoal)

target.MouseEnter:Connect(function()
    unhoverTween:Cancel()
    hoverTween:Play()
end)

target.MouseLeave:Connect(function()
    hoverTween:Cancel()
    unhoverTween:Play()
end)

-- Click Effects (${config.clickEffect})
${config.clickEffect === 'squish' ? `
local clickGoal = {
    Size = UDim2.new(
        originalSize.X.Scale * 1.08,
        originalSize.X.Offset * 1.08,
        originalSize.Y.Scale * 0.90,
        originalSize.Y.Offset * 0.90
    )
}
local clickTween = TweenService:Create(target, TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), clickGoal)

target.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        clickTween:Play()
    end
end)

target.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        unhoverTween:Play()
    end
end)
` : config.clickEffect === 'bounce' ? `
local clickGoal = {
    Size = UDim2.new(
        originalSize.X.Scale * 0.92,
        originalSize.X.Offset * 0.92,
        originalSize.Y.Scale * 0.92,
        originalSize.Y.Offset * 0.92
    )
}
local clickTween = TweenService:Create(target, TweenInfo.new(0.07, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), clickGoal)

target.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        clickTween:Play()
    end
end)

target.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        hoverTween:Play()
    end
end)
` : `-- No special click deformation`}
`;
}
