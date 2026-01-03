import { Dimensions, PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get initial dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Export screen dimensions as named exports
export { SCREEN_HEIGHT, SCREEN_WIDTH };

// Base dimensions (iPhone 12/13/14 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Device type detection
export const getDeviceType = () => {
  const width = SCREEN_WIDTH;
  
  if (width >= 768) {
    return 'tablet';
  } else if (width >= 414) {
    return 'large-phone';
  } else if (width >= 375) {
    return 'medium-phone';
  } else {
    return 'small-phone';
  }
};

// Responsive width calculation
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height calculation
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

// Scale font size based on screen width
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.max(PixelRatio.roundToNearestPixel(newSize), 12); // Minimum 12px
};

// Scale dimensions based on screen width
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return PixelRatio.roundToNearestPixel(size * scale);
};

// Scale dimensions based on screen height
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return PixelRatio.roundToNearestPixel(size * scale);
};

// Get responsive padding/margin
export const getResponsivePadding = (basePadding: number) => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'tablet':
      return basePadding * 1.5;
    case 'large-phone':
      return basePadding * 1.2;
    case 'medium-phone':
      return basePadding;
    case 'small-phone':
      return basePadding * 0.8;
    default:
      return basePadding;
  }
};

// Get responsive font size
export const getResponsiveFontSize = (baseSize: number) => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'tablet':
      return baseSize * 1.3;
    case 'large-phone':
      return baseSize * 1.1;
    case 'medium-phone':
      return baseSize;
    case 'small-phone':
      return baseSize * 0.9;
    default:
      return baseSize;
  }
};

// Get responsive image dimensions
export const getResponsiveImageSize = (baseWidth: number, baseHeight: number) => {
  return {
    width: scaleWidth(baseWidth),
    height: scaleHeight(baseHeight),
  };
};

// Get responsive spacing
export const getResponsiveSpacing = (baseSpacing: number) => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'tablet':
      return baseSpacing * 1.5;
    case 'large-phone':
      return baseSpacing * 1.2;
    case 'medium-phone':
      return baseSpacing;
    case 'small-phone':
      return baseSpacing * 0.8;
    default:
      return baseSpacing;
  }
};

// Check if device is tablet
export const isTablet = (): boolean => {
  return getDeviceType() === 'tablet';
};

// Check if device is small phone
export const isSmallPhone = (): boolean => {
  return getDeviceType() === 'small-phone';
};

// Get number of columns for grid layouts
export const getGridColumns = (): number => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'tablet':
      return 3;
    case 'large-phone':
      return 2;
    default:
      return 2;
  }
};

// Responsive breakpoints
export const breakpoints = {
  small: 320,
  medium: 375,
  large: 414,
  tablet: 768,
};

// Check if current screen matches breakpoint
export const isBreakpoint = (breakpoint: keyof typeof breakpoints): boolean => {
  return SCREEN_WIDTH >= breakpoints[breakpoint];
};

// Hook for safe area aware dimensions
export const useResponsiveDimensions = () => {
  const insets = useSafeAreaInsets();
  
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    safeWidth: SCREEN_WIDTH - insets.left - insets.right,
    safeHeight: SCREEN_HEIGHT - insets.top - insets.bottom,
    insets,
  };
};

// Enhanced responsive functions with safe areas
export const wpSafe = (percentage: number, insets?: { left: number; right: number }): number => {
  const safeWidth = SCREEN_WIDTH - (insets?.left || 0) - (insets?.right || 0);
  return (safeWidth * percentage) / 100;
};

export const hpSafe = (percentage: number, insets?: { top: number; bottom: number }): number => {
  const safeHeight = SCREEN_HEIGHT - (insets?.top || 0) - (insets?.bottom || 0);
  return (safeHeight * percentage) / 100;
};

export default {
  wp,
  hp,
  wpSafe,
  hpSafe,
  scaleFontSize,
  scaleWidth,
  scaleHeight,
  getResponsivePadding,
  getResponsiveFontSize,
  getResponsiveImageSize,
  getResponsiveSpacing,
  getDeviceType,
  isTablet,
  isSmallPhone,
  getGridColumns,
  isBreakpoint,
  useResponsiveDimensions,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
