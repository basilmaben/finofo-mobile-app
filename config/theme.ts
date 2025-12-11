import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// TODO: Add theme colours if necessary

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // primary: '#6750A4',
    // secondary: '#625B71',
    // tertiary: '#7D5260',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // primary: '#D0BCFF',
    // secondary: '#CCC2DC',
    // tertiary: '#EFB8C8',
  },
};