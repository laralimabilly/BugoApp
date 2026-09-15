import React, { useState } from 'react';
import { Alert } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import Header from './components/Header';
import ItemList from './components/ItemList';
import FloatingAddButton from './components/FloatingAddButton';
import ItemModal from './components/ItemModal';
import ItemDetails from './components/ItemDetails';
import { useItems } from '../../hooks/useItems';
import { useProximityAlerts } from '../../hooks/useProximityAlerts';
import { useUserPreferences } from '../../hooks/useUserPreferences';

const HomeScreen = ({ activeScreen, onScreenChange, notificationsEnabled }) => {
  const {
    items,
    notifiedItemsRef,
    saveItem,
    deleteItem,
    setItemsAway,
    setItemsReturned,
  } = useItems();

  const { preferences } = useUserPreferences();

  const { currentLocation, isLocationEnabled } = useProximityAlerts({
    items,
    notifiedItemsRef,
    notificationsEnabled,
    returnNotificationsEnabled: preferences.returnNotificationsEnabled,
    onItemsAway: setItemsAway,
    onItemsReturned: setItemsReturned,
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const handleSave = (itemData) => {
    if (!currentLocation) {
      Alert.alert('Error', 'Location not available. Please wait or check permissions.');
      return;
    }
    saveItem(itemData, { editingItem, location: currentLocation });
    setShowItemModal(false);
    setEditingItem(null);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
  };

  const startEditing = (item) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  return (
    <ScreenLayout
      activeScreen={activeScreen}
      onScreenChange={onScreenChange}
      overlay={
        <FloatingAddButton onPress={openAddModal} disabled={!currentLocation} />
      }
    >
      <Header
        isLocationEnabled={isLocationEnabled}
        itemCount={items.length}
        items={items}
        notificationsEnabled={notificationsEnabled}
      />

      <ItemList
        items={items}
        onItemPress={openDetails}
        currentLocation={currentLocation}
      />

      {/* Modals (React Native Modals portal above the layout) */}
      <ItemModal
        visible={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
      />

      <ItemDetails
        visible={showItemDetails}
        onClose={() => {
          setShowItemDetails(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        currentLocation={currentLocation}
        onEdit={startEditing}
        onDelete={deleteItem}
      />
    </ScreenLayout>
  );
};

export default HomeScreen;
