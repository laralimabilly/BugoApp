import React from 'react';
import { Text as RNText } from 'react-native';
import { FONTS } from '../constants/typography';

const CustomText = ({ style, weight = 'regular', ...props }) => {
  const getFontFamily = () => {
    switch (weight) {
      case 'medium':
        return FONTS.medium;
      case 'semiBold':
        return FONTS.semiBold;
      case 'bold':
        return FONTS.bold;
      default:
        return FONTS.regular;
    }
  };

  const defaultStyle = {
    fontFamily: getFontFamily(),
    color: '#ffffff', // Your default text color
  };

  return (
    <RNText 
      style={[defaultStyle, style]} 
      {...props}
    />
  );
};

export default CustomText;