import { StyleSheet } from 'react-native';
// import { getResponsiveFontSize, getResponsiveSpacing } from '../utils/responsive';

// Color constants
export const colors = {
  primary: '#EF3024',
  secondary: '#694664',
  bg_primary: '#F2F6FF',
  bg_secondary: '#7E6781',
  bg_home: '#0E1833',
  surface: '#ffffff',
  text: '#333333',
  textSecondary: '#959292',
  textLight: '#999999',
  tabsText: '#ED67B8',
  border: '#dddddd',
  divider: '#eeeeee',
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
  black: '#000000',
  white: '#ffffff',
  blue: '#0065FF',
  statusbar_black: '#1c1c1e83',
};

// Typography constants
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-Bold',
    color: '#333333',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  body: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  bodySmall: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
  },
};

// Spacing constants
// export const spacing = {
//   xs: getResponsiveSpacing(4),
//   sm: getResponsiveSpacing(8),
//   md: getResponsiveSpacing(16),
//   lg: getResponsiveSpacing(20),
//   xl: getResponsiveSpacing(24),
//   xxl: getResponsiveSpacing(32),
// };

const commonStyles = StyleSheet.create({
  // Buttons
  button: {
    borderRadius: 23,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#C35E9C',
    borderWidth: 0,
    borderRadius: 23,
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#C15E9C',
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#C15E9C',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    color: '#694664',
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  cardNoBorder: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },

  // Layout
  container: {
    flex: 1,
    backgroundColor: '#694664',
  },
  container_layout: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 20,
    paddingTop: 20,
    // minHeight: hp(100) - getResponsiveSpacing(20),
  },
  container_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default commonStyles;
