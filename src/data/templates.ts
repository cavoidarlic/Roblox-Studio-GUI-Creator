import { RobloxElement, RootProperties } from '../types/roblox';

export interface GuiTemplate {
  id: string;
  name: string;
  description: string;
  category: 'HUD' | 'Menu' | 'Inventory' | 'Dialogue' | 'Leaderboard';
  icon: string;
  elements: RobloxElement[];
  rootProperties?: Partial<RootProperties>;
}

export const GUI_TEMPLATES: GuiTemplate[] = [
  {
    id: 'rpg_hud',
    name: 'RPG Player HUD (Health & Mana)',
    description: 'Clean modern game HUD with styled Health and Mana bars, Player Level badge, and Coin counter.',
    category: 'HUD',
    icon: 'fa-heart-pulse',
    elements: [
      {
        id: 'hud_container',
        name: 'HUDContainer',
        type: 'Frame',
        parentId: null,
        visible: true,
        zIndex: 5,
        position: { scaleX: 0.02, offsetX: 0, scaleY: 0.03, offsetY: 0 },
        size: { scaleX: 0, offsetX: 320, scaleY: 0, offsetY: 120 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#18181b',
        backgroundTransparency: 0.25,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 12, cornerRadiusScale: 0 },
          UIStroke: { color: '#3f3f46', thickness: 2, transparency: 0.2, applyStrokeMode: 'Border' },
          UIPadding: { top: 12, bottom: 12, left: 14, right: 14 }
        }
      },
      {
        id: 'hud_player_name',
        name: 'PlayerName',
        type: 'TextLabel',
        parentId: 'hud_container',
        visible: true,
        zIndex: 6,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0.7, offsetX: 0, scaleY: 0, offsetY: 22 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: 'Adventurer [Lv. 42]',
        textColor: '#ffffff',
        textSize: 15,
        font: 'SourceSansBold',
        textXAlignment: 'Left',
        modifiers: {}
      },
      {
        id: 'hud_coins_badge',
        name: 'CoinsBadge',
        type: 'TextLabel',
        parentId: 'hud_container',
        visible: true,
        zIndex: 6,
        position: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0.3, offsetX: 0, scaleY: 0, offsetY: 22 },
        anchorPoint: { x: 1, y: 0 },
        backgroundColor: '#eab308',
        backgroundTransparency: 0.8,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '🪙 12,450 G',
        textColor: '#facc15',
        textSize: 13,
        font: 'SourceSansBold',
        textXAlignment: 'Right',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'hud_health_bg',
        name: 'HealthBarBackground',
        type: 'Frame',
        parentId: 'hud_container',
        visible: true,
        zIndex: 6,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 32 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 22 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.2,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'hud_health_fill',
        name: 'HealthBarFill',
        type: 'Frame',
        parentId: 'hud_health_bg',
        visible: true,
        zIndex: 7,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0.82, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#22c55e',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 },
          UIGradient: { color1: '#16a34a', color2: '#4ade80', rotation: 90 }
        }
      },
      {
        id: 'hud_health_text',
        name: 'HealthText',
        type: 'TextLabel',
        parentId: 'hud_health_bg',
        visible: true,
        zIndex: 8,
        position: { scaleX: 0.5, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0.5, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '820 / 1000 HP',
        textColor: '#ffffff',
        textSize: 12,
        font: 'SourceSansBold',
        modifiers: {}
      },
      {
        id: 'hud_mana_bg',
        name: 'ManaBarBackground',
        type: 'Frame',
        parentId: 'hud_container',
        visible: true,
        zIndex: 6,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 62 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 18 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.2,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'hud_mana_fill',
        name: 'ManaBarFill',
        type: 'Frame',
        parentId: 'hud_mana_bg',
        visible: true,
        zIndex: 7,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0.65, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#00a2ff',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 },
          UIGradient: { color1: '#0284c7', color2: '#38bdf8', rotation: 90 }
        }
      },
      {
        id: 'hud_mana_text',
        name: 'ManaText',
        type: 'TextLabel',
        parentId: 'hud_mana_bg',
        visible: true,
        zIndex: 8,
        position: { scaleX: 0.5, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0.5, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '325 / 500 MP',
        textColor: '#ffffff',
        textSize: 11,
        font: 'SourceSansBold',
        modifiers: {}
      }
    ]
  },
  {
    id: 'shop_grid',
    name: 'Item Shop & Inventory Grid',
    description: 'Game store window with title header, close button, and dynamic UIGridLayout item slots.',
    category: 'Inventory',
    icon: 'fa-store',
    elements: [
      {
        id: 'shop_window',
        name: 'ShopWindow',
        type: 'Frame',
        parentId: null,
        visible: true,
        zIndex: 10,
        position: { scaleX: 0.5, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0, offsetX: 500, scaleY: 0, offsetY: 380 },
        anchorPoint: { x: 0.5, y: 0.5 },
        backgroundColor: '#1c1c24',
        backgroundTransparency: 0.1,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 16, cornerRadiusScale: 0 },
          UIStroke: { color: '#00a2ff', thickness: 2, transparency: 0.3, applyStrokeMode: 'Border' }
        }
      },
      {
        id: 'shop_header',
        name: 'HeaderBar',
        type: 'Frame',
        parentId: 'shop_window',
        visible: true,
        zIndex: 11,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 48 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#262633',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 16, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'shop_title',
        name: 'TitleText',
        type: 'TextLabel',
        parentId: 'shop_header',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0.04, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0.6, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '⚔️ ARMORY & WEAPON SHOP',
        textColor: '#ffffff',
        textSize: 16,
        font: 'SourceSansBold',
        textXAlignment: 'Left',
        modifiers: {}
      },
      {
        id: 'shop_close_btn',
        name: 'CloseButton',
        type: 'TextButton',
        parentId: 'shop_header',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0.96, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0, offsetX: 32, scaleY: 0, offsetY: 32 },
        anchorPoint: { x: 1, y: 0.5 },
        backgroundColor: '#ef4444',
        backgroundTransparency: 0.1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '✕',
        textColor: '#ffffff',
        textSize: 14,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'shop_grid_container',
        name: 'GridContainer',
        type: 'Frame',
        parentId: 'shop_window',
        visible: true,
        zIndex: 11,
        position: { scaleX: 0.04, offsetX: 0, scaleY: 0, offsetY: 64 },
        size: { scaleX: 0.92, offsetX: 0, scaleY: 0, offsetY: 290 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#121217',
        backgroundTransparency: 0.6,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 10, cornerRadiusScale: 0 },
          UIPadding: { top: 12, bottom: 12, left: 12, right: 12 },
          UIGridLayout: {
            cellSizeX: 98,
            cellSizeY: 120,
            cellPaddingX: 10,
            cellPaddingY: 10,
            fillDirection: 'Horizontal',
            maxCells: 4
          }
        }
      },
      {
        id: 'slot_1',
        name: 'ItemSlot_Sword',
        type: 'TextButton',
        parentId: 'shop_grid_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0, offsetX: 98, scaleY: 0, offsetY: 120 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#232331',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '⚔️\nIron Blade\n$150',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 },
          UIStroke: { color: '#3b82f6', thickness: 1.5, transparency: 0.4, applyStrokeMode: 'Border' }
        }
      },
      {
        id: 'slot_2',
        name: 'ItemSlot_Shield',
        type: 'TextButton',
        parentId: 'shop_grid_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0, offsetX: 98, scaleY: 0, offsetY: 120 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#232331',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '🛡️\nTower Shield\n$220',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 },
          UIStroke: { color: '#a855f7', thickness: 1.5, transparency: 0.4, applyStrokeMode: 'Border' }
        }
      },
      {
        id: 'slot_3',
        name: 'ItemSlot_Potion',
        type: 'TextButton',
        parentId: 'shop_grid_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0, offsetX: 98, scaleY: 0, offsetY: 120 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#232331',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '🧪\nHealth Potion\n$45',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 },
          UIStroke: { color: '#22c55e', thickness: 1.5, transparency: 0.4, applyStrokeMode: 'Border' }
        }
      },
      {
        id: 'slot_4',
        name: 'ItemSlot_Bow',
        type: 'TextButton',
        parentId: 'shop_grid_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0, offsetX: 98, scaleY: 0, offsetY: 120 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#232331',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '🏹\nRecurve Bow\n$310',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 },
          UIStroke: { color: '#f59e0b', thickness: 1.5, transparency: 0.4, applyStrokeMode: 'Border' }
        }
      }
    ]
  },
  {
    id: 'npc_dialogue',
    name: 'NPC Dialogue & Speech Box',
    description: 'Story dialogue frame with speaker portrait, nameplate tag, typewriter-style dialogue, and action prompt.',
    category: 'Dialogue',
    icon: 'fa-comments',
    elements: [
      {
        id: 'dialog_frame',
        name: 'DialogueBox',
        type: 'Frame',
        parentId: null,
        visible: true,
        zIndex: 15,
        position: { scaleX: 0.5, offsetX: 0, scaleY: 0.95, offsetY: 0 },
        size: { scaleX: 0.8, offsetX: 0, scaleY: 0, offsetY: 140 },
        anchorPoint: { x: 0.5, y: 1 },
        backgroundColor: '#111827',
        backgroundTransparency: 0.1,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 14, cornerRadiusScale: 0 },
          UIStroke: { color: '#00a2ff', thickness: 2, transparency: 0.2, applyStrokeMode: 'Border' },
          UIPadding: { top: 14, bottom: 14, left: 18, right: 18 }
        }
      },
      {
        id: 'speaker_name_tag',
        name: 'SpeakerNameTag',
        type: 'TextLabel',
        parentId: 'dialog_frame',
        visible: true,
        zIndex: 16,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: -34 },
        size: { scaleX: 0, offsetX: 160, scaleY: 0, offsetY: 28 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#0284c7',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: 'Elder Knight Gareth',
        textColor: '#ffffff',
        textSize: 13,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'dialog_text',
        name: 'DialogueBody',
        type: 'TextLabel',
        parentId: 'dialog_frame',
        visible: true,
        zIndex: 16,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 0.82, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '"Greetings, traveler. The gates to the ancient Roblox citadel have opened once more. Are you prepared for the trial that lies ahead?"',
        textColor: '#f3f4f6',
        textSize: 15,
        font: 'SourceSans',
        textXAlignment: 'Left',
        textYAlignment: 'Top',
        modifiers: {}
      },
      {
        id: 'dialog_next_btn',
        name: 'ContinueButton',
        type: 'TextButton',
        parentId: 'dialog_frame',
        visible: true,
        zIndex: 16,
        position: { scaleX: 1, offsetX: 0, scaleY: 1, offsetY: 0 },
        size: { scaleX: 0, offsetX: 110, scaleY: 0, offsetY: 36 },
        anchorPoint: { x: 1, y: 1 },
        backgroundColor: '#00a2ff',
        backgroundTransparency: 0,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: 'Continue ▶',
        textColor: '#ffffff',
        textSize: 13,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 8, cornerRadiusScale: 0 },
          UIGradient: { color1: '#0284c7', color2: '#38bdf8', rotation: 45 }
        }
      }
    ]
  },
  {
    id: 'leaderboard_list',
    name: 'Live Leaderboard (UIListLayout)',
    description: 'Server player leaderboard displaying ranks, usernames, and scores with automatic vertical stacking.',
    category: 'Leaderboard',
    icon: 'fa-trophy',
    elements: [
      {
        id: 'leaderboard_panel',
        name: 'LeaderboardPanel',
        type: 'Frame',
        parentId: null,
        visible: true,
        zIndex: 10,
        position: { scaleX: 0.98, offsetX: 0, scaleY: 0.05, offsetY: 0 },
        size: { scaleX: 0, offsetX: 260, scaleY: 0, offsetY: 320 },
        anchorPoint: { x: 1, y: 0 },
        backgroundColor: '#18181b',
        backgroundTransparency: 0.2,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 12, cornerRadiusScale: 0 },
          UIStroke: { color: '#3f3f46', thickness: 1.5, transparency: 0.3, applyStrokeMode: 'Border' },
          UIPadding: { top: 8, bottom: 8, left: 8, right: 8 }
        }
      },
      {
        id: 'lb_title',
        name: 'LeaderboardTitle',
        type: 'TextLabel',
        parentId: 'leaderboard_panel',
        visible: true,
        zIndex: 11,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 28 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.4,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '🏆 TOP PLAYERS',
        textColor: '#fbbf24',
        textSize: 13,
        font: 'SourceSansBold',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'lb_list_container',
        name: 'ListContainer',
        type: 'Frame',
        parentId: 'leaderboard_panel',
        visible: true,
        zIndex: 11,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 34 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 260 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UIListLayout: {
            fillDirection: 'Vertical',
            padding: 6,
            horizontalAlignment: 'Left',
            verticalAlignment: 'Top'
          }
        }
      },
      {
        id: 'lb_row_1',
        name: 'PlayerRow_1',
        type: 'Frame',
        parentId: 'lb_list_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 36 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.3,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 },
          UIStroke: { color: '#fbbf24', thickness: 1, transparency: 0.5, applyStrokeMode: 'Border' }
        }
      },
      {
        id: 'lb_row_1_txt',
        name: 'Row1Text',
        type: 'TextLabel',
        parentId: 'lb_row_1',
        visible: true,
        zIndex: 13,
        position: { scaleX: 0.05, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0.9, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '#1  BuildMaster99    48,200',
        textColor: '#ffffff',
        textSize: 12,
        font: 'SourceSansBold',
        textXAlignment: 'Left',
        modifiers: {}
      },
      {
        id: 'lb_row_2',
        name: 'PlayerRow_2',
        type: 'Frame',
        parentId: 'lb_list_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 36 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.5,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'lb_row_2_txt',
        name: 'Row2Text',
        type: 'TextLabel',
        parentId: 'lb_row_2',
        visible: true,
        zIndex: 13,
        position: { scaleX: 0.05, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0.9, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '#2  SpeedyNinja      39,150',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSans',
        textXAlignment: 'Left',
        modifiers: {}
      },
      {
        id: 'lb_row_3',
        name: 'PlayerRow_3',
        type: 'Frame',
        parentId: 'lb_list_container',
        visible: true,
        zIndex: 12,
        position: { scaleX: 0, offsetX: 0, scaleY: 0, offsetY: 0 },
        size: { scaleX: 1, offsetX: 0, scaleY: 0, offsetY: 36 },
        anchorPoint: { x: 0, y: 0 },
        backgroundColor: '#27272a',
        backgroundTransparency: 0.5,
        borderSizePixel: 0,
        borderColor: '#000000',
        modifiers: {
          UICorner: { cornerRadiusOffset: 6, cornerRadiusScale: 0 }
        }
      },
      {
        id: 'lb_row_3_txt',
        name: 'Row3Text',
        type: 'TextLabel',
        parentId: 'lb_row_3',
        visible: true,
        zIndex: 13,
        position: { scaleX: 0.05, offsetX: 0, scaleY: 0.5, offsetY: 0 },
        size: { scaleX: 0.9, offsetX: 0, scaleY: 1, offsetY: 0 },
        anchorPoint: { x: 0, y: 0.5 },
        backgroundColor: '#000000',
        backgroundTransparency: 1,
        borderSizePixel: 0,
        borderColor: '#000000',
        text: '#3  PixelKnight       31,400',
        textColor: '#e4e4e7',
        textSize: 12,
        font: 'SourceSans',
        textXAlignment: 'Left',
        modifiers: {}
      }
    ]
  }
];
