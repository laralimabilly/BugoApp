import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Linking,
  SafeAreaView,
} from 'react-native';
import Text from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { getIconName } from '../constants/icons';
import { getDistanceText } from '../utils/distance';

const { width, height } = Dimensions.get('window');

const ItemDetails = ({ 
  visible, 
  onClose, 
  item, 
  currentLocation, 
  onEdit, 
  onDelete 
}) => {
  const [locationAddress, setLocationAddress] = useState('Loading address...');

  // Fetch address using reverse geocoding
  const fetchAddress = async () => {
    if (!item?.location) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.location.latitude}&lon=${item.location.longitude}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setLocationAddress(data.display_name);
      } else {
        setLocationAddress('Address not found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setLocationAddress('Unable to fetch address');
    }
  };

  useEffect(() => {
    if (visible && item) {
      fetchAddress();
    }
  }, [visible, item]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(item.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit(item);
    onClose();
  };

  const openInMaps = () => {
    if (!item?.location) return;
    
    const url = `https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}`;
    Linking.openURL(url);
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#2d2d2d', '#1a1a1a']}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Item Details
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Item Overview */}
              <View style={styles.overviewCard}>
                <View style={styles.itemIconLarge}>
                  <Ionicons 
                    name={getIconName(item.icon)} 
                    size={40} 
                    color={COLORS.accent} 
                  />
                </View>
                <View style={styles.overviewInfo}>
                  <Text style={styles.itemNameLarge}>{item.name}</Text>
                  <Text style={styles.distanceTextLarge}>
                    {getDistanceText(currentLocation, item.location, true)}
                  </Text>
                  {item.isAway && (
                    <View style={styles.awayBadge}>
                      <Ionicons name="warning" size={16} color={COLORS.warning} />
                      <Text style={styles.awayText}>You're away from this item</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Details Sections */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={20} color={COLORS.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Address</Text>
                      <Text style={styles.detailValue}>{locationAddress}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.mapButton} onPress={openInMaps}>
                    <Ionicons name="map-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.mapButtonText}>Open in Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="notifications-outline" size={20} color={COLORS.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Alert Distance</Text>
                      <Text style={styles.detailValue}>{item.alertDistance} meters</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Date Added</Text>
                      <Text style={styles.detailValue}>
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Coordinates</Text>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate-outline" size={20} color={COLORS.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Latitude</Text>
                      <Text style={styles.detailValue}>
                        {item.location?.latitude?.toFixed(6) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate-outline" size={20} color={COLORS.accent} />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Longitude</Text>
                      <Text style={styles.detailValue}>
                        {item.location?.longitude?.toFixed(6) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Fixed Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDelete}
              >
                <View style={styles.deleteButtonContent}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.warning} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEdit}
              >
                <LinearGradient
                  colors={[COLORS.accent, '#4dd100']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="pencil-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.buttonText}>Edit Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    padding: 16,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  itemIconLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  overviewInfo: {
    flex: 1,
  },
  itemNameLarge: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  distanceTextLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
  },
  awayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  awayText: {
    fontSize: 12,
    color: COLORS.warning,
    marginLeft: 4,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  mapButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  deleteButtonText: {
    color: COLORS.warning,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ItemDetails;