import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONTS } from '../constants/typography';

// Map either a `weight` prop keyword or a style `fontWeight` value to a Fredoka
// variant. This is required because React Native ignores `fontWeight` when a
// custom `fontFamily` is set, so weight must be expressed by choosing the font.
const getFontFamily = (weight) => {
  switch (String(weight)) {
    case 'bold':
    case '700':
    case '800':
    case '900':
      return FONTS.bold;
    case 'semiBold':
    case 'semibold':
    case '600':
      return FONTS.semiBold;
    case 'medium':
    case '500':
      return FONTS.medium;
    default:
      return FONTS.regular;
  }
};

const CustomText = ({ style, weight, color = '#ffffff', ...props }) => {
  const flattened = StyleSheet.flatten(style) || {};
  // Explicit `weight` prop wins; otherwise derive from the style's fontWeight.
  const resolvedWeight = weight ?? flattened.fontWeight;

  const defaultStyle = {
    fontFamily: getFontFamily(resolvedWeight),
    color, // Default text color, overridable via style.
  };

  return (
    <RNText
      style={[defaultStyle, style]}
      {...props}
    />
  );
};

export default CustomText;
