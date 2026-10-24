export interface RobloxFontDefinition {
  enumName: string;
  displayName: string;
  category: 'Modern' | 'Sans' | 'Serif' | 'Display' | 'Handwriting' | 'Monospace';
  cssFamily: string;
  weight?: string | number;
  style?: string;
  googleFontFamily?: string;
}

export const ROBLOX_FONTS: RobloxFontDefinition[] = [
  // Core System & Standard Fonts
  {
    enumName: 'SourceSans',
    displayName: 'Source Sans',
    category: 'Sans',
    cssFamily: '"Source Sans Pro", "Source Sans 3", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400'
  },
  {
    enumName: 'SourceSansBold',
    displayName: 'Source Sans Bold',
    category: 'Sans',
    cssFamily: '"Source Sans Pro", "Source Sans 3", sans-serif',
    weight: 'bold',
    googleFontFamily: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400'
  },
  {
    enumName: 'SourceSansLight',
    displayName: 'Source Sans Light',
    category: 'Sans',
    cssFamily: '"Source Sans Pro", "Source Sans 3", sans-serif',
    weight: '300',
    googleFontFamily: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400'
  },
  {
    enumName: 'SourceSansItalic',
    displayName: 'Source Sans Italic',
    category: 'Sans',
    cssFamily: '"Source Sans Pro", "Source Sans 3", sans-serif',
    weight: 'normal',
    style: 'italic',
    googleFontFamily: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400'
  },
  {
    enumName: 'SourceSansSemibold',
    displayName: 'Source Sans Semibold',
    category: 'Sans',
    cssFamily: '"Source Sans Pro", "Source Sans 3", sans-serif',
    weight: '600',
    googleFontFamily: 'Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400'
  },
  {
    enumName: 'Arial',
    displayName: 'Arial (Arimo)',
    category: 'Sans',
    cssFamily: 'Arimo, Arial, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Arimo:wght@400;700'
  },
  {
    enumName: 'ArialBold',
    displayName: 'Arial Bold (Arimo Bold)',
    category: 'Sans',
    cssFamily: 'Arimo, Arial, sans-serif',
    weight: 'bold',
    googleFontFamily: 'Arimo:wght@400;700'
  },
  {
    enumName: 'Arimo',
    displayName: 'Arimo',
    category: 'Sans',
    cssFamily: 'Arimo, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Arimo:wght@400;700'
  },
  {
    enumName: 'ArimoBold',
    displayName: 'Arimo Bold',
    category: 'Sans',
    cssFamily: 'Arimo, sans-serif',
    weight: 'bold',
    googleFontFamily: 'Arimo:wght@400;700'
  },

  // Gotham / Montserrat family
  {
    enumName: 'Gotham',
    displayName: 'Gotham (Montserrat)',
    category: 'Modern',
    cssFamily: 'Montserrat, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Montserrat:wght@400;500;700;900'
  },
  {
    enumName: 'GothamMedium',
    displayName: 'Gotham Medium',
    category: 'Modern',
    cssFamily: 'Montserrat, sans-serif',
    weight: '500',
    googleFontFamily: 'Montserrat:wght@400;500;700;900'
  },
  {
    enumName: 'GothamBold',
    displayName: 'Gotham Bold',
    category: 'Modern',
    cssFamily: 'Montserrat, sans-serif',
    weight: 'bold',
    googleFontFamily: 'Montserrat:wght@400;500;700;900'
  },
  {
    enumName: 'GothamBlack',
    displayName: 'Gotham Black',
    category: 'Modern',
    cssFamily: 'Montserrat, sans-serif',
    weight: '900',
    googleFontFamily: 'Montserrat:wght@400;500;700;900'
  },

  // Builder Sans family
  {
    enumName: 'BuilderSans',
    displayName: 'Builder Sans',
    category: 'Modern',
    cssFamily: '"Plus Jakarta Sans", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Plus+Jakarta+Sans:wght@400;500;700;800'
  },
  {
    enumName: 'BuilderSansMedium',
    displayName: 'Builder Sans Medium',
    category: 'Modern',
    cssFamily: '"Plus Jakarta Sans", sans-serif',
    weight: '500',
    googleFontFamily: 'Plus+Jakarta+Sans:wght@400;500;700;800'
  },
  {
    enumName: 'BuilderSansBold',
    displayName: 'Builder Sans Bold',
    category: 'Modern',
    cssFamily: '"Plus Jakarta Sans", sans-serif',
    weight: 'bold',
    googleFontFamily: 'Plus+Jakarta+Sans:wght@400;500;700;800'
  },
  {
    enumName: 'BuilderSansExtraBold',
    displayName: 'Builder Sans Extra Bold',
    category: 'Modern',
    cssFamily: '"Plus Jakarta Sans", sans-serif',
    weight: '800',
    googleFontFamily: 'Plus+Jakarta+Sans:wght@400;500;700;800'
  },

  // Display, Retro & Gaming Fonts
  {
    enumName: 'Arcade',
    displayName: 'Arcade ("Press Start 2P")',
    category: 'Display',
    cssFamily: '"Press Start 2P", monospace',
    weight: 'normal',
    googleFontFamily: 'Press+Start+2P'
  },
  {
    enumName: 'Cartoon',
    displayName: 'Cartoon (Chewy)',
    category: 'Display',
    cssFamily: 'Chewy, cursive',
    weight: 'normal',
    googleFontFamily: 'Chewy'
  },
  {
    enumName: 'Code',
    displayName: 'Code (Fira Code)',
    category: 'Monospace',
    cssFamily: '"Fira Code", monospace',
    weight: 'normal',
    googleFontFamily: 'Fira+Code:wght@400;700'
  },
  {
    enumName: 'Highway',
    displayName: 'Highway (Roadgeek / Overpass)',
    category: 'Sans',
    cssFamily: 'Overpass, sans-serif',
    weight: 'bold',
    googleFontFamily: 'Overpass:wght@400;700'
  },
  {
    enumName: 'SciFi',
    displayName: 'SciFi (Orbitron)',
    category: 'Display',
    cssFamily: 'Orbitron, sans-serif',
    weight: 'bold',
    googleFontFamily: 'Orbitron:wght@400;700;900'
  },
  {
    enumName: 'Fantasy',
    displayName: 'Fantasy (Cinzel Decorative)',
    category: 'Display',
    cssFamily: '"Cinzel Decorative", serif',
    weight: 'normal',
    googleFontFamily: 'Cinzel+Decorative:wght@400;700'
  },
  {
    enumName: 'Antique',
    displayName: 'Antique (UnifrakturMaguntia)',
    category: 'Display',
    cssFamily: 'UnifrakturMaguntia, serif',
    weight: 'normal',
    googleFontFamily: 'UnifrakturMaguntia'
  },

  // Distinctive Google Fonts used by Roblox
  {
    enumName: 'AmaticSC',
    displayName: 'Amatic SC',
    category: 'Handwriting',
    cssFamily: '"Amatic SC", cursive',
    weight: 'bold',
    googleFontFamily: 'Amatic+SC:wght@400;700'
  },
  {
    enumName: 'Bangers',
    displayName: 'Bangers (Comic Action)',
    category: 'Display',
    cssFamily: 'Bangers, cursive',
    weight: 'normal',
    googleFontFamily: 'Bangers'
  },
  {
    enumName: 'Creepster',
    displayName: 'Creepster (Spooky Horror)',
    category: 'Display',
    cssFamily: 'Creepster, cursive',
    weight: 'normal',
    googleFontFamily: 'Creepster'
  },
  {
    enumName: 'DenkOne',
    displayName: 'Denk One',
    category: 'Sans',
    cssFamily: '"Denk One", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Denk+One'
  },
  {
    enumName: 'Fondamento',
    displayName: 'Fondamento (Calligraphic)',
    category: 'Display',
    cssFamily: 'Fondamento, cursive',
    weight: 'normal',
    googleFontFamily: 'Fondamento'
  },
  {
    enumName: 'FredokaOne',
    displayName: 'Fredoka One (Fredoka)',
    category: 'Display',
    cssFamily: 'Fredoka, cursive, sans-serif',
    weight: '600',
    googleFontFamily: 'Fredoka:wght@400;600;700'
  },
  {
    enumName: 'GrenzeGotisch',
    displayName: 'Grenze Gotisch',
    category: 'Display',
    cssFamily: '"Grenze Gotisch", cursive',
    weight: 'normal',
    googleFontFamily: 'Grenze+Gotisch:wght@400;700'
  },
  {
    enumName: 'IndieFlower',
    displayName: 'Indie Flower (Handwritten)',
    category: 'Handwriting',
    cssFamily: '"Indie Flower", cursive',
    weight: 'normal',
    googleFontFamily: 'Indie+Flower'
  },
  {
    enumName: 'JosefinSans',
    displayName: 'Josefin Sans (Geometric)',
    category: 'Sans',
    cssFamily: '"Josefin Sans", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Josefin+Sans:wght@400;700'
  },
  {
    enumName: 'Jura',
    displayName: 'Jura (Futuristic Sans)',
    category: 'Sans',
    cssFamily: 'Jura, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Jura:wght@400;700'
  },
  {
    enumName: 'Kalam',
    displayName: 'Kalam (Marker Pen)',
    category: 'Handwriting',
    cssFamily: 'Kalam, cursive',
    weight: 'normal',
    googleFontFamily: 'Kalam:wght@400;700'
  },
  {
    enumName: 'LuckiestGuy',
    displayName: 'Luckiest Guy (Bold Comic)',
    category: 'Display',
    cssFamily: '"Luckiest Guy", cursive',
    weight: 'normal',
    googleFontFamily: 'Luckiest+Guy'
  },
  {
    enumName: 'Merriweather',
    displayName: 'Merriweather',
    category: 'Serif',
    cssFamily: 'Merriweather, serif',
    weight: 'normal',
    googleFontFamily: 'Merriweather:wght@400;700'
  },
  {
    enumName: 'Michroma',
    displayName: 'Michroma (Techno / Square)',
    category: 'Modern',
    cssFamily: 'Michroma, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Michroma'
  },
  {
    enumName: 'Nunito',
    displayName: 'Nunito (Rounded Sans)',
    category: 'Sans',
    cssFamily: 'Nunito, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Nunito:wght@400;700'
  },
  {
    enumName: 'Oswald',
    displayName: 'Oswald (Condensed Impact)',
    category: 'Sans',
    cssFamily: 'Oswald, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Oswald:wght@400;600;700'
  },
  {
    enumName: 'PatrickHand',
    displayName: 'Patrick Hand',
    category: 'Handwriting',
    cssFamily: '"Patrick Hand", cursive',
    weight: 'normal',
    googleFontFamily: 'Patrick+Hand'
  },
  {
    enumName: 'PermanentMarker',
    displayName: 'Permanent Marker',
    category: 'Handwriting',
    cssFamily: '"Permanent Marker", cursive',
    weight: 'normal',
    googleFontFamily: 'Permanent+Marker'
  },
  {
    enumName: 'Roboto',
    displayName: 'Roboto',
    category: 'Sans',
    cssFamily: 'Roboto, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Roboto:wght@400;500;700'
  },
  {
    enumName: 'RobotoCondensed',
    displayName: 'Roboto Condensed',
    category: 'Sans',
    cssFamily: '"Roboto Condensed", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Roboto+Condensed:wght@400;700'
  },
  {
    enumName: 'RobotoMono',
    displayName: 'Roboto Mono',
    category: 'Monospace',
    cssFamily: '"Roboto Mono", monospace',
    weight: 'normal',
    googleFontFamily: 'Roboto+Mono:wght@400;700'
  },
  {
    enumName: 'Sarpanch',
    displayName: 'Sarpanch (Futuristic Angular)',
    category: 'Modern',
    cssFamily: 'Sarpanch, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Sarpanch:wght@400;700'
  },
  {
    enumName: 'SpecialElite',
    displayName: 'Special Elite (Typewriter)',
    category: 'Display',
    cssFamily: '"Special Elite", cursive',
    weight: 'normal',
    googleFontFamily: 'Special+Elite'
  },
  {
    enumName: 'TitilliumWeb',
    displayName: 'Titillium Web',
    category: 'Modern',
    cssFamily: '"Titillium Web", sans-serif',
    weight: 'normal',
    googleFontFamily: 'Titillium+Web:wght@400;600;700'
  },
  {
    enumName: 'Ubuntu',
    displayName: 'Ubuntu',
    category: 'Sans',
    cssFamily: 'Ubuntu, sans-serif',
    weight: 'normal',
    googleFontFamily: 'Ubuntu:wght@400;700'
  },

  // Classic Book & Serif Fonts
  {
    enumName: 'Bodoni',
    displayName: 'Bodoni (Bodoni Moda)',
    category: 'Serif',
    cssFamily: '"Bodoni Moda", serif',
    weight: 'normal',
    googleFontFamily: 'Bodoni+Moda:ital,wght@0,400;0,700;1,400'
  },
  {
    enumName: 'Garamond',
    displayName: 'Garamond (EB Garamond)',
    category: 'Serif',
    cssFamily: '"EB Garamond", serif',
    weight: 'normal',
    googleFontFamily: 'EB+Garamond:wght@400;700'
  },
  {
    enumName: 'Legacy',
    displayName: 'Legacy (MS Sans Serif)',
    category: 'Sans',
    cssFamily: 'Arial, sans-serif',
    weight: 'normal'
  }
];

export function getFontDefinition(fontEnum?: string): RobloxFontDefinition {
  if (!fontEnum) return ROBLOX_FONTS[0];
  const found = ROBLOX_FONTS.find(f => f.enumName.toLowerCase() === fontEnum.toLowerCase());
  return found || ROBLOX_FONTS[0];
}
