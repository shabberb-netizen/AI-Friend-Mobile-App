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
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#17152C',
    tint: '#FF765D',
    background: '#F6F3FF',
    foreground: '#17152C',
    card: '#FFFFFF',
    cardForeground: '#17152C',
    primary: '#FF765D',
    primaryForeground: '#FFFFFF',
    secondary: '#ECE8FB',
    secondaryForeground: '#4F4873',
    muted: '#E9E5F7',
    mutedForeground: '#787190',
    accent: '#D8CEFF',
    accentForeground: '#31295B',
    destructive: '#D85467',
    destructiveForeground: '#FFFFFF',
    border: '#DED8F0',
    input: '#DED8F0',
    indigo: '#29224D',
    indigoSoft: '#514A78',
    violet: '#9A7CFF',
    coralSoft: '#FFE4DE',
    mint: '#CDEBDF',
    mintText: '#28604C',
  },
  radius: 24,
};

export default colors;
