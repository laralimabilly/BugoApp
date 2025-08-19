export const ITEM_ICONS = [
    { id: 'key', name: 'key-outline' },
    { id: 'wallet', name: 'wallet-outline' },
    { id: 'sunglasses', name: 'glasses-outline' },
    { id: 'smartphone', name: 'phone-portrait-outline' },
    { id: 'headphones', name: 'headset-outline' },
    { id: 'briefcase', name: 'briefcase-outline' },
    { id: 'car', name: 'car-outline' },
    { id: 'home', name: 'home-outline' },
    { id: 'package', name: 'cube-outline' },
    { id: 'watch', name: 'watch-outline' },
  ];
  
  export const getIconName = (iconId) => {
    const icon = ITEM_ICONS.find(item => item.id === iconId);
    return icon ? icon.name : 'ellipse-outline';
  };