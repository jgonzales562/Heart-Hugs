export const colors = {
  navy: '#172A44',
  navySoft: '#243D5D',
  teal: '#70C8C0',
  tealDeep: '#267C79',
  tealMist: '#D8F1EE',
  lavender: '#C8B8EA',
  lavenderMuted: '#DDD4F0',
  lavenderSoft: '#F1ECFA',
  offWhite: '#FFF9F0',
  offWhiteTransparent: 'rgba(255, 249, 240, 0.78)',
  warmWhite: '#FFFDF9',
  rose: '#C7798A',
  roseSoft: '#F5D8DE',
  sage: '#8EA690',
  slate: '#657083',
  inkMuted: '#4E5B6D',
  shadow: 'rgba(23, 42, 68, 0.12)',
  transparentNavy: 'rgba(23, 42, 68, 0.58)',
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
    lg: 26,
    xl: 32,
    xxl: 40,
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 24,
    xxl: 32,
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
  sm: 4,
  md: 6,
  lg: 8,
  full: 999,
};

export const gradients = {
  accent: [colors.teal, colors.lavender] as const,
  card: [colors.warmWhite, colors.lavenderSoft] as const,
  quietNight: [colors.navy, colors.navySoft, colors.tealDeep] as const,
  screen: [colors.offWhite, colors.lavenderSoft, colors.tealMist] as const,
};

export const theme = {
  colors,
  gradients,
  radius,
  spacing,
  typography,
};
