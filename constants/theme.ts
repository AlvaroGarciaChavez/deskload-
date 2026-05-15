// Design tokens for DeskLoad app
export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42CC',
  primaryGlow: 'rgba(108, 99, 255, 0.3)',

  // Accent
  accent: '#00D4AA',
  accentLight: '#33DDBB',
  accentGlow: 'rgba(0, 212, 170, 0.25)',

  // Premium gold
  premium: '#FFB800',
  premiumLight: '#FFCC44',
  premiumGlow: 'rgba(255, 184, 0, 0.25)',

  // Backgrounds
  bg: '#0A0A14',
  bgCard: '#13131F',
  bgCardAlt: '#1A1A2E',
  bgSurface: '#1E1E30',
  bgOverlay: 'rgba(10, 10, 20, 0.85)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#606080',
  textInverse: '#0A0A14',

  // Status
  success: '#00E676',
  successGlow: 'rgba(0, 230, 118, 0.2)',
  warning: '#FFB800',
  error: '#FF4444',
  errorGlow: 'rgba(255, 68, 68, 0.2)',
  info: '#00B4D8',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(108, 99, 255, 0.5)',

  // Gradients (used as arrays)
  gradientPrimary: ['#6C63FF', '#4A42CC'] as const,
  gradientAccent: ['#00D4AA', '#008866'] as const,
  gradientPremium: ['#FFB800', '#FF6B00'] as const,
  gradientDark: ['#13131F', '#0A0A14'] as const,
  gradientCard: ['#1E1E30', '#13131F'] as const,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
