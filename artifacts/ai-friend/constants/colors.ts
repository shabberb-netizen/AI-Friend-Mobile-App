/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * Morning and night share the same semantic names so the app can switch
 * display brightness without changing component code.
 */

const colors = {
  light: {
    text: '#241C36',
    tint: '#FF765D',
    background: '#FFF8F2',
    foreground: '#241C36',
    card: '#FFFFFF',
    cardForeground: '#241C36',
    primary: '#FF765D',
    primaryForeground: '#FFFFFF',
    secondary: '#F1EAF7',
    secondaryForeground: '#5A4C6D',
    muted: '#E9DFF0',
    mutedForeground: '#80738C',
    accent: '#F0E4FF',
    accentForeground: '#533A76',
    destructive: '#D85467',
    destructiveForeground: '#FFFFFF',
    border: '#E2D9EA',
    input: '#E2D9EA',
    indigo: '#F1E6FF',
    indigoSoft: '#D6C4FA',
    violet: '#8864E8',
    coralSoft: '#FFE6DF',
    mint: '#DDF3E8',
    mintText: '#2B6A4E',
  },
  dark: {
    text: '#F3F1FF',
    tint: '#FF765D',
    background: '#08091B',
    foreground: '#F3F1FF',
    card: '#11132D',
    cardForeground: '#F3F1FF',
    primary: '#FF765D',
    primaryForeground: '#180F2A',
    secondary: '#1D2042',
    secondaryForeground: '#D7D5F3',
    muted: '#27294A',
    mutedForeground: '#A7A5C1',
    accent: '#302A62',
    accentForeground: '#E5DFFF',
    destructive: '#D85467',
    destructiveForeground: '#FFFFFF',
    border: '#34335C',
    input: '#34335C',
    indigo: '#171632',
    indigoSoft: '#38345F',
    violet: '#9A7CFF',
    coralSoft: '#4A263D',
    mint: '#1D3B3B',
    mintText: '#A4E4C9',
  },
  radius: 24,
};

export default colors;
