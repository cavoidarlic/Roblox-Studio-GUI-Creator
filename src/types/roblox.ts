export type GuiRootType = 'ScreenGui' | 'SurfaceGui' | 'BillboardGui';

export type RobloxElementType =
  | 'Frame'
  | 'ScrollingFrame'
  | 'ViewportFrame'
  | 'TextLabel'
  | 'TextButton'
  | 'TextBox'
  | 'ImageLabel'
  | 'ImageButton';

export type ModifierType =
  | 'UICorner'
  | 'UIStroke'
  | 'UIGradient'
  | 'UIPadding'
  | 'UIAspectRatioConstraint'
  | 'UIListLayout'
  | 'UIGridLayout'
  | 'UISizeConstraint';

export interface UDim2 {
  scaleX: number;
  offsetX: number;
  scaleY: number;
  offsetY: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Rect4D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface UICornerModifier {
  cornerRadiusOffset: number;
  cornerRadiusScale?: number;
}

export interface UIStrokeModifier {
  color: string;
  thickness: number;
  transparency: number;
  applyStrokeMode: 'Border' | 'Contextual';
}

export interface UIGradientModifier {
  color1: string;
  color2: string;
  rotation: number;
  transparency?: number;
}

export interface UIPaddingModifier {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface UIAspectRatioModifier {
  aspectRatio: number;
  dominantAxis: 'Width' | 'Height';
  aspectType: 'FitWithinMaxSize' | 'ScaleWithParentSize';
}

export interface UIListLayoutModifier {
  fillDirection: 'Vertical' | 'Horizontal';
  padding: number;
  horizontalAlignment: 'Left' | 'Center' | 'Right';
  verticalAlignment: 'Top' | 'Center' | 'Bottom';
}

export interface UIGridLayoutModifier {
  cellSizeX: number;
  cellSizeY: number;
  cellPaddingX: number;
  cellPaddingY: number;
  fillDirection: 'Horizontal' | 'Vertical';
  maxCells: number; // 0 = auto wrap
}

export interface UISizeConstraintModifier {
  minSizeX: number;
  minSizeY: number;
  maxSizeX: number;
  maxSizeY: number;
}

export interface ElementModifiers {
  UICorner?: UICornerModifier;
  UIStroke?: UIStrokeModifier;
  UIGradient?: UIGradientModifier;
  UIPadding?: UIPaddingModifier;
  UIAspectRatioConstraint?: UIAspectRatioModifier;
  UIListLayout?: UIListLayoutModifier;
  UIGridLayout?: UIGridLayoutModifier;
  UISizeConstraint?: UISizeConstraintModifier;
}

export interface RobloxElement {
  id: string;
  name: string;
  type: RobloxElementType;
  parentId: string | null;
  visible: boolean;
  zIndex: number;
  position: UDim2;
  size: UDim2;
  anchorPoint: Vector2D;
  backgroundColor: string;
  backgroundTransparency: number;
  borderSizePixel: number;
  borderColor: string;
  modifiers: ElementModifiers;

  // Text specific
  text?: string;
  textColor?: string;
  textSize?: number;
  font?: string;
  textScaled?: boolean;
  textXAlignment?: 'Left' | 'Center' | 'Right';
  textYAlignment?: 'Top' | 'Center' | 'Bottom';
  placeholderText?: string;
  placeholderColor?: string;

  // Image specific
  image?: string;
  imageColor?: string;
  imageTransparency?: number;
  scaleType?: 'Stretch' | 'Fit' | 'Crop' | 'Slice' | 'Tile';
  sliceCenter?: Rect4D;
  tileSize?: Vector2D;
  resampleMode?: 'Default' | 'Pixelated';

  // ScrollingFrame specific
  canvasSize?: UDim2;
  scrollBarThickness?: number;
  scrollBarColor?: string;

  // ViewportFrame specific
  lightColor?: string;
  ambient?: string;
}

export interface ScreenGuiProperties {
  Name: string;
  ResetOnSpawn: boolean;
  IgnoreGuiInset: boolean;
  ZIndexBehavior: 'Sibling' | 'Global';
  DisplayOrder: number;
}

export interface SurfaceGuiProperties {
  Name: string;
  Face: 'Front' | 'Back' | 'Top' | 'Bottom' | 'Left' | 'Right';
  CanvasSize: Vector2D;
  AlwaysOnTop: boolean;
  AdorneePart: string;
  LightInfluence: number;
}

export interface BillboardGuiProperties {
  Name: string;
  Size: UDim2;
  StudsOffset: Vector3D;
  AlwaysOnTop: boolean;
  MaxDistance: number;
  AdorneePart: string;
}

export interface RootProperties {
  ScreenGui: ScreenGuiProperties;
  SurfaceGui: SurfaceGuiProperties;
  BillboardGui: BillboardGuiProperties;
}

export interface ViewportState {
  width: number;
  height: number;
  preset: string;
  zoom: number;
  panX: number;
  panY: number;
  showSafeInsets: boolean;
}

export type GridStep = 4 | 8 | 16 | 32;

export interface GridSettings {
  enabled: boolean;
  step: GridStep;
  showGrid: boolean;
}

export interface TweenAnimationSettings {
  hoverScale: number;
  clickEffect: 'none' | 'bounce' | 'squish' | 'glow';
  easingStyle: 'Linear' | 'Quad' | 'Sine' | 'Back' | 'Elastic' | 'Bounce';
  easingDirection: 'In' | 'Out' | 'InOut';
  duration: number;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number;
}

export interface ProjectState {
  app: string;
  version: number;
  exportedAt: string;
  rootType: GuiRootType;
  rootProperties: RootProperties;
  viewport: ViewportState;
  elements: RobloxElement[];
  selectedId: string | null;
  selectedModifierKey: ModifierType | null;
  gridSettings?: GridSettings;
  audioSettings?: AudioSettings;
}
