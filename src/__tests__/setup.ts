/**
 * Test setup file
 * Configures mocks for Expo modules and React Native used in tests
 */

import React from 'react';
import '@testing-library/jest-dom';

// Mock React Native components with proper React components
jest.mock('react-native', () => {
  const React = require('react');
  
  return {
    Modal: ({ visible, children, testID }: any) =>
      visible ? React.createElement('div', { 'data-testid': testID }, children) : null,
    View: ({ children, style, testID }: any) =>
      React.createElement('div', { style, 'data-testid': testID }, children),
    Text: ({ children, style }: any) =>
      React.createElement('span', { style }, children),
    TouchableOpacity: ({ children, onPress, disabled, style, testID }: any) =>
      React.createElement(
        'button',
        {
          onClick: onPress,
          disabled,
          style,
          'data-testid': testID,
        },
        children
      ),
    ActivityIndicator: ({ size, color }: any) =>
      React.createElement('div', {
        'data-testid': 'activity-indicator',
        'aria-label': 'Loading',
      }),
    StyleSheet: {
      create: (styles: any) => styles,
    },
    Platform: {
      OS: 'android',
      select: (obj: any) => obj.android || obj.default,
    },
  };
});

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  File: jest.fn(),
  Paths: {
    cache: "mock://cache",
  },
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
  getContentUriAsync: jest.fn(),
}));

// Mock expo-intent-launcher
jest.mock("expo-intent-launcher", () => ({
  startActivityAsync: jest.fn(),
}));

// Mock expo-linking
jest.mock("expo-linking", () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
