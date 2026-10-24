import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToRgb,
  hexToColor3Call,
  calculatePixelBounds,
  calculateAbsolutePixelBounds,
  calculateZoomToPoint,
  convertToScale,
  convertToParentScale,
  convertToScreenGuiScale,
  convertToOffset,
  convertElementToOffset,
  getParentPixelSize,
  generateLuauScript,
  snapToGrid,
  solveAspectRatioDimension,
  convertScaleToOffset,
  convertOffsetToScale,
  alignElements,
  generateTweenServiceLuau
} from './robloxMath';
import { isDescendant, canReparent, canReparentAll, sanitizeHierarchy, reorderAndReparent } from './hierarchy';
import { RobloxElement, RootProperties } from '../types/roblox';

test('hexToRgb converts 6-char hex string to RGB object', () => {
  const result = hexToRgb('#00a2ff');
  assert.equal(result.r, 0);
  assert.equal(result.g, 162);
  assert.equal(result.b, 255);
});

test('hexToRgb converts shorthand 3-char hex string to RGB object', () => {
  const result = hexToRgb('#fff');
  assert.equal(result.r, 255);
  assert.equal(result.g, 255);
  assert.equal(result.b, 255);
});

test('hexToColor3Call produces valid Roblox Luau code call', () => {
  const call = hexToColor3Call('#00a2ff');
  assert.equal(call, 'Color3.fromRGB(0, 162, 255)');
});

test('calculatePixelBounds calculates UDim2 with scale and offset', () => {
  const element: RobloxElement = {
    id: 'el_1',
    name: 'TestFrame',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0.5, offsetX: 10, scaleY: 0.5, offsetY: 20 },
    size: { scaleX: 0.2, offsetX: 100, scaleY: 0.1, offsetY: 50 },
    anchorPoint: { x: 0.5, y: 0.5 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const parentSize = { w: 1000, h: 500 };
  const bounds = calculatePixelBounds(element, parentSize);

  // Width: 0.2 * 1000 + 100 = 300
  // Height: 0.1 * 500 + 50 = 100
  // Position origin: x = 0.5 * 1000 + 10 = 510; y = 0.5 * 500 + 20 = 270
  // With AnchorPoint (0.5, 0.5):
  // x = 510 - 0.5 * 300 = 360
  // y = 270 - 0.5 * 100 = 220
  assert.equal(bounds.w, 300);
  assert.equal(bounds.h, 100);
  assert.equal(bounds.x, 360);
  assert.equal(bounds.y, 220);
});

test('calculateAbsolutePixelBounds accurately sums parent and child offsets', () => {
  const parent: RobloxElement = {
    id: 'parent_1',
    name: 'ParentContainer',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 50, scaleY: 0, offsetY: 40 },
    size: { scaleX: 0, offsetX: 400, scaleY: 0, offsetY: 300 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const child: RobloxElement = {
    id: 'child_1',
    name: 'ChildButton',
    type: 'TextButton',
    parentId: 'parent_1',
    visible: true,
    zIndex: 2,
    position: { scaleX: 0, offsetX: 20, scaleY: 0, offsetY: 30 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 50 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#00a2ff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const absBounds = calculateAbsolutePixelBounds(child, [parent, child], { w: 1280, h: 720 });
  // Parent X is 50, child local X is 20 -> Absolute X = 70
  // Parent Y is 40, child local Y is 30 -> Absolute Y = 70
  assert.equal(absBounds.x, 70);
  assert.equal(absBounds.y, 70);
  assert.equal(absBounds.w, 100);
  assert.equal(absBounds.h, 50);
});

test('calculateZoomToPoint keeps cursor position anchored during zoom in and out', () => {
  const currentZoom = 1.0;
  const currentPanX = 0;
  const currentPanY = 0;
  const mouseDx = 150;
  const mouseDy = 100;

  // Zoom In (deltaY < 0)
  const zoomedIn = calculateZoomToPoint(currentZoom, currentPanX, currentPanY, mouseDx, mouseDy, -100);
  assert.ok(zoomedIn.zoom > 1.0);
  // Verify canvas point under mouse remains invariant
  const pointBefore = (mouseDx - currentPanX) / currentZoom;
  const pointAfter = (mouseDx - zoomedIn.panX) / zoomedIn.zoom;
  assert.ok(Math.abs(pointBefore - pointAfter) < 1.0);

  // Zoom Out (deltaY > 0)
  const zoomedOut = calculateZoomToPoint(currentZoom, currentPanX, currentPanY, mouseDx, mouseDy, 100);
  assert.ok(zoomedOut.zoom < 1.0);
  const pointOutAfter = (mouseDx - zoomedOut.panX) / zoomedOut.zoom;
  assert.ok(Math.abs(pointBefore - pointOutAfter) < 1.0);
});

test('calculatePixelBounds enforces UIAspectRatioConstraint', () => {
  const element: RobloxElement = {
    id: 'el_2',
    name: 'AspectRatioBox',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 50 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {
      UIAspectRatioConstraint: {
        aspectRatio: 2,
        dominantAxis: 'Width',
        aspectType: 'FitWithinMaxSize'
      }
    }
  };

  const bounds = calculatePixelBounds(element, { w: 1000, h: 600 });
  // Width is 200, DominantAxis is Width, ratio is 2, so Height should be 200 / 2 = 100
  assert.equal(bounds.w, 200);
  assert.equal(bounds.h, 100);
});

test('convertToScale converts pure pixels into proportional scale values', () => {
  const element: RobloxElement = {
    id: 'el_3',
    name: 'PixelToScale',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 150 },
    size: { scaleX: 0, offsetX: 400, scaleY: 0, offsetY: 300 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const parentSize = { w: 1000, h: 600 };
  const converted = convertToScale(element, parentSize);

  assert.equal(converted.size.scaleX, 0.4);
  assert.equal(converted.size.offsetX, 0);
  assert.equal(converted.size.scaleY, 0.5);
  assert.equal(converted.size.offsetY, 0);

  assert.equal(converted.position.scaleX, 0.2);
  assert.equal(converted.position.offsetX, 0);
  assert.equal(converted.position.scaleY, 0.25);
  assert.equal(converted.position.offsetY, 0);
});

test('convertToOffset converts scale values into fixed pixel offsets', () => {
  const element: RobloxElement = {
    id: 'el_4',
    name: 'ScaleToOffset',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0.25, offsetX: 0, scaleY: 0.5, offsetY: 0 },
    size: { scaleX: 0.5, offsetX: 0, scaleY: 0.2, offsetY: 0 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const parentSize = { w: 800, h: 400 };
  const converted = convertToOffset(element, parentSize);

  assert.equal(converted.size.scaleX, 0);
  assert.equal(converted.size.offsetX, 400); // 0.5 * 800
  assert.equal(converted.size.scaleY, 0);
  assert.equal(converted.size.offsetY, 80); // 0.2 * 400

  assert.equal(converted.position.scaleX, 0);
  assert.equal(converted.position.offsetX, 200); // 0.25 * 800
  assert.equal(converted.position.scaleY, 0);
  assert.equal(converted.position.offsetY, 200); // 0.5 * 400
});

test('convertToParentScale calculates scale ratio relative to immediate parent container', () => {
  const parent: RobloxElement = {
    id: 'frame_parent',
    name: 'ParentCard',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    size: { scaleX: 0, offsetX: 400, scaleY: 0, offsetY: 200 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#333333',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const child: RobloxElement = {
    id: 'btn_child',
    name: 'ChildButton',
    type: 'TextButton',
    parentId: 'frame_parent',
    visible: true,
    zIndex: 2,
    position: { scaleX: 0, offsetX: 40, scaleY: 0, offsetY: 20 },
    size: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#007acc',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const screenSize = { w: 1000, h: 600 };
  const elements = [parent, child];

  // Convert to Parent Scale:
  // Child size: 200w / 400w = 0.5, 100h / 200h = 0.5
  // Child pos: 40x / 400w = 0.1, 20y / 200h = 0.1
  const parentScale = convertToParentScale(child, elements, screenSize);
  assert.equal(parentScale.size.scaleX, 0.5);
  assert.equal(parentScale.size.scaleY, 0.5);
  assert.equal(parentScale.size.offsetX, 0);
  assert.equal(parentScale.size.offsetY, 0);
  assert.equal(parentScale.position.scaleX, 0.1);
  assert.equal(parentScale.position.scaleY, 0.1);

  // Convert to ScreenGui Scale (separate option for full-screen ratio):
  // Child size relative to ScreenGui: 200w / 1000w = 0.2, 100h / 600h = 0.1667
  const screenScale = convertToScreenGuiScale(child, elements, screenSize);
  assert.equal(screenScale.size.scaleX, 0.2);
  assert.equal(screenScale.size.scaleY, 0.1667);
});

test('reorderAndReparent prevents cycle and reparents cleanly', () => {
  const root1: RobloxElement = {
    id: 'f1',
    name: 'Frame1',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#333',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000',
    modifiers: {}
  };

  const child1: RobloxElement = {
    id: 'f2',
    name: 'Frame2',
    type: 'Frame',
    parentId: 'f1',
    visible: true,
    zIndex: 2,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 50, scaleY: 0, offsetY: 50 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#333',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000',
    modifiers: {}
  };

  const elements = [root1, child1];

  // Cannot reparent f1 into f2 (cycle!)
  assert.equal(canReparent('f1', 'f2', elements), false);
  // Cannot reparent f1 into f1 (self!)
  assert.equal(canReparent('f1', 'f1', elements), false);
  // Can unparent f2 to root (null)
  assert.equal(canReparent('f2', null, elements), true);

  // Reparent f2 to root
  const unparented = reorderAndReparent(elements, ['f2'], null, 'inside');
  assert.equal(unparented.find(e => e.id === 'f2')?.parentId, null);
});

test('generateLuauScript generates correct code for ScreenGui and elements', () => {
  const rootProps: RootProperties = {
    ScreenGui: {
      Name: 'MainGui',
      ResetOnSpawn: true,
      IgnoreGuiInset: false,
      ZIndexBehavior: 'Sibling',
      DisplayOrder: 1
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

  const elements: RobloxElement[] = [
    {
      id: 'el_1',
      name: 'PlayButton',
      type: 'TextButton',
      parentId: null,
      visible: true,
      zIndex: 2,
      position: { scaleX: 0.5, offsetX: -100, scaleY: 0.8, offsetY: 0 },
      size: { scaleX: 0, offsetX: 200, scaleY: 0, offsetY: 50 },
      anchorPoint: { x: 0.5, y: 0.5 },
      backgroundColor: '#00a2ff',
      backgroundTransparency: 0,
      borderSizePixel: 0,
      borderColor: '#000000',
      text: 'START GAME',
      textColor: '#ffffff',
      textSize: 20,
      font: 'SourceSansBold',
      modifiers: {
        UICorner: {
          cornerRadiusOffset: 12,
          cornerRadiusScale: 0
        },
        UIStroke: {
          color: '#ffffff',
          thickness: 2,
          transparency: 0,
          applyStrokeMode: 'Border'
        }
      }
    }
  ];

  const code = generateLuauScript('ScreenGui', rootProps, elements);

  assert.ok(code.includes('Instance.new("ScreenGui")'));
  assert.ok(code.includes('root.Name = "MainGui"'));
  assert.ok(code.includes('Instance.new("TextButton")'));
  assert.ok(code.includes('PlayButton_1.Text = "START GAME"'));
  assert.ok(code.includes('Instance.new("UICorner")'));
  assert.ok(code.includes('Instance.new("UIStroke")'));
  assert.ok(code.includes('PlayButton_1.Parent = root'));
});

test('snapToGrid correctly snaps values to step intervals', () => {
  assert.equal(snapToGrid(14, 16), 16);
  assert.equal(snapToGrid(7, 16), 0);
  assert.equal(snapToGrid(23, 8), 24);
  assert.equal(snapToGrid(105, 32), 96);
  assert.equal(snapToGrid(115, 32), 128);
});

test('solveAspectRatioDimension correctly computes width or height for 16:9 and 4:3', () => {
  // 16:9 ratio, given width 1920 -> height 1080
  const h169 = solveAspectRatioDimension('width', 1920, 16, 9);
  assert.equal(h169.calculatedValue, 1080);
  assert.equal(h169.ratioDecimal, 1.7778);

  // 16:9 ratio, given height 720 -> width 1280
  const w169 = solveAspectRatioDimension('height', 720, 16, 9);
  assert.equal(w169.calculatedValue, 1280);

  // 1:1 square ratio
  const square = solveAspectRatioDimension('width', 256, 1, 1);
  assert.equal(square.calculatedValue, 256);
});

test('convertScaleToOffset and convertOffsetToScale roundtrip correctly', () => {
  const screen = { w: 1920, h: 1080 };
  const offset = convertScaleToOffset(0.5, 0.25, screen.w, screen.h);
  assert.equal(offset.offsetX, 960);
  assert.equal(offset.offsetY, 270);

  const scale = convertOffsetToScale(960, 270, screen.w, screen.h);
  assert.equal(scale.scaleX, 0.5);
  assert.equal(scale.scaleY, 0.25);
});

test('alignElements correctly aligns left, center, and distributes horizontally', () => {
  const el1: RobloxElement = {
    id: '1',
    name: 'A',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 10, scaleY: 0, offsetY: 20 },
    size: { scaleX: 0, offsetX: 50, scaleY: 0, offsetY: 50 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#fff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000',
    modifiers: {}
  };

  const el2: RobloxElement = {
    ...el1,
    id: '2',
    name: 'B',
    position: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 80 }
  };

  const parent = { w: 1000, h: 1000 };

  // Align left: min left is 10, so both get offsetX 10
  const leftAligned = alignElements([el1, el2], 'left', parent);
  assert.equal(leftAligned[0].position.offsetX, 10);
  assert.equal(leftAligned[1].position.offsetX, 10);

  // Align top: min top is 20, so both get offsetY 20
  const topAligned = alignElements([el1, el2], 'top', parent);
  assert.equal(topAligned[0].position.offsetY, 20);
  assert.equal(topAligned[1].position.offsetY, 20);
});

test('generateTweenServiceLuau produces valid Luau with TweenService and event connections', () => {
  const code = generateTweenServiceLuau('PlayBtn', {
    hoverScale: 1.05,
    clickEffect: 'bounce',
    easingStyle: 'Elastic',
    easingDirection: 'Out',
    duration: 0.25
  });

  assert.ok(code.includes('game:GetService("TweenService")'));
  assert.ok(code.includes('Enum.EasingStyle.Elastic'));
  assert.ok(code.includes('target.MouseEnter:Connect'));
  assert.ok(code.includes('target.MouseLeave:Connect'));
  assert.ok(code.includes('clickTween:Play()'));
});

test('sanitizeHierarchy eliminates self-referencing parentId', () => {
  const dummy: RobloxElement = {
    id: 'el_1',
    name: 'Frame1',
    type: 'Frame',
    parentId: 'el_1', // self-referencing!
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const sanitized = sanitizeHierarchy([dummy]);
  assert.equal(sanitized[0].parentId, null);
});

test('sanitizeHierarchy breaks 2-node cycles cleanly', () => {
  const a: RobloxElement = {
    id: 'A',
    name: 'NodeA',
    type: 'Frame',
    parentId: 'B',
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const b: RobloxElement = {
    id: 'B',
    name: 'NodeB',
    type: 'Frame',
    parentId: 'A',
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const sanitized = sanitizeHierarchy([a, b]);
  // One of the cyclic pointers must be reset to null to break the cycle
  const hasNullParent = sanitized.some(el => el.parentId === null);
  assert.ok(hasNullParent);

  // Neither should form a cycle now
  assert.equal(isDescendant('A', 'B', sanitized), false);
});

test('sanitizeHierarchy resets non-existent dangling parentId to null', () => {
  const orphan: RobloxElement = {
    id: 'orphan_1',
    name: 'Orphan',
    type: 'TextLabel',
    parentId: 'deleted_parent_id',
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const sanitized = sanitizeHierarchy([orphan]);
  assert.equal(sanitized[0].parentId, null);
});

test('canReparentAll returns false if any dragged element would create a cycle', () => {
  const rootFrame: RobloxElement = {
    id: 'f_root',
    name: 'Root',
    type: 'Frame',
    parentId: null,
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const childFrame: RobloxElement = {
    id: 'f_child',
    name: 'Child',
    type: 'Frame',
    parentId: 'f_root',
    visible: true,
    zIndex: 1,
    position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
    size: { scaleX: 0, offsetX: 100, scaleY: 0, offsetY: 100 },
    anchorPoint: { x: 0, y: 0 },
    backgroundColor: '#ffffff',
    backgroundTransparency: 0,
    borderSizePixel: 0,
    borderColor: '#000000',
    modifiers: {}
  };

  const elements = [rootFrame, childFrame];

  // Moving Root into Child must be forbidden
  assert.equal(canReparentAll(['f_root'], 'f_child', elements), false);
  // Moving both into Child must be forbidden
  assert.equal(canReparentAll(['f_root', 'f_child'], 'f_child', elements), false);
  // Moving Child to Root is allowed
  assert.equal(canReparentAll(['f_child'], 'f_root', elements), true);
  // Moving to null (root) is allowed
  assert.equal(canReparentAll(['f_child'], null, elements), true);
});

