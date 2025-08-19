import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ItemCard from './ItemCard';
import { COLORS } from '../constants/colors';

const ItemList = ({ items, onItemPress, currentLocation }) => {
  const renderItem = ({ item }) => (
    <ItemCard
      item={item}
      onPress={() => onItemPress(item)}
      currentLocation={currentLocation}
    />
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>No items added yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to add your first item</Text>
    </View>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyComponent}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Extra space for floating button
    paddingTop: 24
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    opacity: 0.7,
  },
});

export default ItemList;