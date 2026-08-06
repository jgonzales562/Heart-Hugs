export const colors = {
  navy: '#102F46',
  navySoft: '#1C4B63',
  teal: '#75C7C1',
  tealDeep: '#267A7B',
  tealMist: '#9DD8D1',
  lavender: '#BFCBDD',
  lavenderMuted: '#AABDD1',
  lavenderSoft: '#BBC8E0',
  offWhite: '#F7FAF8',
  offWhiteTransparent: 'rgba(201, 231, 227, 0.84)',
  warmWhite: '#D7EAE6',
  rose: '#E58A78',
  roseSoft: '#F7E2E2',
  sage: '#7EA79A',
  slate: '#6F7F88',
  inkMuted: '#536A75',
  shadow: 'rgba(16, 47, 70, 0.16)',
  transparentNavy: 'rgba(10, 38, 58, 0.64)',
  deepOcean: '#092A40',
  ocean: '#16536B',
  sky: '#8BC9D1',
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
  accent: [colors.teal, colors.sky] as const,
  card: ['#9FD9D1', '#AFC3DF'] as const,
  quietNight: [colors.deepOcean, colors.navy, colors.ocean] as const,
  player: [colors.ocean, colors.deepOcean] as const,
  screen: [colors.deepOcean, '#0E5E67', '#594B7D'] as const,
  welcome: [colors.deepOcean, colors.ocean, '#4D929C'] as const,
};

export const theme = {
  colors,
  gradients,
  radius,
  spacing,
  typography,
};
