import React, { useState } from 'react';
import { useFonts } from '@expo-google-fonts/fredoka/useFonts';
import { Fredoka_400Regular } from '@expo-google-fonts/fredoka/400Regular';
import { Fredoka_500Medium } from '@expo-google-fonts/fredoka/500Medium';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useNotifications } from './hooks/useNotifications';

const SCREENS = {
  home: HomeScreen,
  settings: SettingsScreen,
};

const App = () => {
  const [activeScreen, setActiveScreen] = useState('home');

  // App-wide notifications: enabled flag is shared with screens, and tapping a
  // notification returns the user to the home screen.
  const { notificationsEnabled } = useNotifications({
    onResponse: () => setActiveScreen('home'),
  });

  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });

  if (!fontsLoaded) return null;

  const ActiveScreen = SCREENS[activeScreen] ?? HomeScreen;

  return (
    <ActiveScreen
      activeScreen={activeScreen}
      onScreenChange={setActiveScreen}
      notificationsEnabled={notificationsEnabled}
    />
  );
};

export default App;
