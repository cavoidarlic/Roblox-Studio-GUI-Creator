export interface RobloxBrickColor {
  id: number;
  name: string;
  hex: string;
  category: 'Greys' | 'Colors' | 'Pastels' | 'Vibrant';
}

export const ROBLOX_BRICK_COLORS: RobloxBrickColor[] = [
  // Classic Greys & Neutrals
  { id: 1, name: 'White', hex: '#F2F3F3', category: 'Greys' },
  { id: 208, name: 'Light stone grey', hex: '#E5E4DF', category: 'Greys' },
  { id: 194, name: 'Medium stone grey', hex: '#A3A2A5', category: 'Greys' },
  { id: 199, name: 'Dark stone grey', hex: '#635F62', category: 'Greys' },
  { id: 26, name: 'Black', hex: '#1B2A35', category: 'Greys' },
  { id: 1003, name: 'Really black', hex: '#111111', category: 'Greys' },
  { id: 1001, name: 'Institutional white', hex: '#F8F8F8', category: 'Greys' },
  { id: 1002, name: 'Mid gray', hex: '#CDCDCD', category: 'Greys' },
  { id: 2, name: 'Grey', hex: '#A1A5A2', category: 'Greys' },
  { id: 338, name: 'Smoky grey', hex: '#5B5D58', category: 'Greys' },

  // Primary & Vibrant
  { id: 21, name: 'Bright red', hex: '#C4281C', category: 'Vibrant' },
  { id: 1004, name: 'Really red', hex: '#FF0000', category: 'Vibrant' },
  { id: 23, name: 'Bright blue', hex: '#0D69AC', category: 'Vibrant' },
  { id: 1010, name: 'Really blue', hex: '#0000FF', category: 'Vibrant' },
  { id: 24, name: 'Bright yellow', hex: '#F5CD30', category: 'Vibrant' },
  { id: 28, name: 'Dark green', hex: '#287F47', category: 'Colors' },
  { id: 37, name: 'Bright green', hex: '#4B974B', category: 'Vibrant' },
  { id: 106, name: 'Bright orange', hex: '#DA8541', category: 'Vibrant' },
  { id: 107, name: 'Bright bluish green', hex: '#008F9C', category: 'Colors' },
  { id: 104, name: 'Bright violet', hex: '#6B327C', category: 'Colors' },
  { id: 1007, name: 'Dusty Rose', hex: '#A34B4B', category: 'Colors' },
  { id: 1008, name: 'Mustard', hex: '#D7C59A', category: 'Colors' },

  // Blues & Teals
  { id: 11, name: 'Pastel Blue', hex: '#80B3D0', category: 'Pastels' },
  { id: 102, name: 'Medium blue', hex: '#6E99C9', category: 'Colors' },
  { id: 1011, name: 'Navy blue', hex: '#002060', category: 'Colors' },
  { id: 1012, name: 'Deep blue', hex: '#213158', category: 'Colors' },
  { id: 1013, name: 'Cyan', hex: '#04AFEC', category: 'Vibrant' },
  { id: 1014, name: 'Teal', hex: '#125F5C', category: 'Colors' },
  { id: 1015, name: 'Toothpaste', hex: '#00FFFF', category: 'Vibrant' },

  // Warm & Reds & Earthy
  { id: 1016, name: 'Crimson', hex: '#970000', category: 'Colors' },
  { id: 1017, name: 'Maroon', hex: '#751343', category: 'Colors' },
  { id: 1018, name: 'Rust', hex: '#8F4C2A', category: 'Colors' },
  { id: 1019, name: 'Brown', hex: '#7C5C40', category: 'Colors' },
  { id: 1020, name: 'Dark orange', hex: '#A05F35', category: 'Colors' },
  { id: 1021, name: 'Nougat', hex: '#D7AE94', category: 'Pastels' },
  { id: 1022, name: 'Cashmere', hex: '#D3AC8B', category: 'Pastels' },
  { id: 1023, name: 'Khaki', hex: '#E29B40', category: 'Colors' },

  // Greens & Limish
  { id: 1024, name: 'Lime green', hex: '#00FF00', category: 'Vibrant' },
  { id: 1025, name: 'Camo', hex: '#3A7D44', category: 'Colors' },
  { id: 1026, name: 'Mint', hex: '#BCE5C2', category: 'Pastels' },
  { id: 1027, name: 'Forest green', hex: '#1F4725', category: 'Colors' },
  { id: 1028, name: 'Olive', hex: '#697B48', category: 'Colors' },

  // Purples & Pinks
  { id: 1029, name: 'Royal purple', hex: '#6B238E', category: 'Colors' },
  { id: 1030, name: 'Magenta', hex: '#AA00AA', category: 'Vibrant' },
  { id: 1031, name: 'Hot pink', hex: '#FF007F', category: 'Vibrant' },
  { id: 1032, name: 'Carnation pink', hex: '#FF99C8', category: 'Pastels' },
  { id: 1033, name: 'Lilac', hex: '#C8A2C8', category: 'Pastels' }
];

export interface UiColorTheme {
  id: string;
  name: string;
  primary: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
  border: string;
}

export const ROBLOX_UI_THEMES: UiColorTheme[] = [
  {
    id: 'studio-dark',
    name: 'Roblox Studio Dark',
    primary: '#00a2ff',
    background: '#1e1e1e',
    surface: '#252526',
    accent: '#007acc',
    text: '#ffffff',
    border: '#3c3c3c'
  },
  {
    id: 'cyber-cyan',
    name: 'Sci-Fi Cyberpunk',
    primary: '#00f0ff',
    background: '#0a0d14',
    surface: '#121824',
    accent: '#ff0055',
    text: '#e6f6ff',
    border: '#00f0ff44'
  },
  {
    id: 'crimson-tactical',
    name: 'Tactical Crimson',
    primary: '#e63946',
    background: '#151518',
    surface: '#202026',
    accent: '#ff4d5a',
    text: '#f8f9fa',
    border: '#451016'
  },
  {
    id: 'royal-gold',
    name: 'Royal RPG Gold',
    primary: '#f59e0b',
    background: '#14120f',
    surface: '#24201a',
    accent: '#fbbf24',
    text: '#fef3c7',
    border: '#785517'
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Tycoon',
    primary: '#10b981',
    background: '#0d1912',
    surface: '#152b1f',
    accent: '#34d399',
    text: '#ecfdf5',
    border: '#065f46'
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Anime',
    primary: '#a855f7',
    background: '#100e19',
    surface: '#1e1a2e',
    accent: '#ec4899',
    text: '#f5f3ff',
    border: '#581c87'
  }
];
