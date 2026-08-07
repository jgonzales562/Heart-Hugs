export const colors = {
  canvas: '#FFF9EC',
  surface: '#FFFFFF',
  surfaceMuted: '#FFF3E8',
  textPrimary: '#24434D',
  textSecondary: '#586F76',
  border: 'rgba(47, 91, 99, 0.14)',
  navy: '#24434D',
  navySoft: '#37616A',
  teal: '#67CDBD',
  tealDeep: '#16766F',
  tealMist: '#D8F3ED',
  lavender: '#DEDDF5',
  lavenderMuted: '#E8E6F5',
  lavenderSoft: '#F3F0FC',
  offWhite: '#FFFCF4',
  offWhiteTransparent: 'rgba(255, 252, 244, 0.84)',
  warmWhite: '#FFF4DD',
  rose: '#E9655A',
  roseSoft: '#FFE5DF',
  coral: '#F27C6D',
  coralDeep: '#B9473D',
  peach: '#FFB59A',
  peachSoft: '#FFE8DD',
  sunshine: '#F5C85D',
  sunshineSoft: '#FFF0B8',
  leaf: '#67B978',
  leafDeep: '#2F7450',
  leafBright: '#91D477',
  mint: '#BFE8C7',
  mintSoft: '#EAF8E9',
  vitality: '#E5F09A',
  vitalitySoft: '#F2F7C9',
  sage: '#82C99B',
  sageSoft: '#E2F5E6',
  slate: '#667B81',
  inkMuted: '#49636A',
  shadow: 'rgba(48, 86, 91, 0.14)',
  transparentNavy: 'rgba(30, 67, 76, 0.68)',
  deepOcean: '#245565',
  ocean: '#287D78',
  sky: '#9ADFD7',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255, 255, 255, 0.76)',
  whiteFaint: 'rgba(255, 255, 255, 0.16)',
  hairline: 'rgba(16, 47, 70, 0.09)',
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
  },
  lineHeight: {
    sm: 18,
    md: 22,
    lg: 27,
    xl: 33,
    xxl: 43,
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 25,
    xxl: 34,
  },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 28,
  full: 999,
};

export const gradients = {
  accent: [colors.leafBright, colors.sunshine] as const,
  card: [colors.mintSoft, colors.sunshineSoft] as const,
  quietNight: [colors.deepOcean, colors.navySoft, colors.ocean] as const,
  player: [colors.leafDeep, colors.deepOcean] as const,
  screen: [colors.canvas, colors.vitalitySoft, colors.mintSoft] as const,
  welcome: [colors.sunshineSoft, colors.peachSoft, colors.mintSoft] as const,
};

export const theme = {
  colors,
  gradients,
  radius,
  spacing,
  typography,
};
