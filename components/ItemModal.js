import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';
import { ITEM_ICONS, getIconName } from '../constants/icons';

const { width, height } = Dimensions.get('window');

const ItemModal = ({ visible, onClose, onSave, editingItem }) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('key');
  const [alertDistance, setAlertDistance] = useState('50');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSelectedIcon(editingItem.icon || 'key');
      setAlertDistance(editingItem.alertDistance?.toString() || '50');
    } else {
      setName('');
      setSelectedIcon('key');
      setAlertDistance('50');
    }
  }, [editingItem, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an item name.');
      return;
    }

    const itemData = {
      name: name.trim(),
      icon: selectedIcon,
      alertDistance: parseInt(alertDistance) || 50,
    };

    onSave(itemData);
    setName('');
    setSelectedIcon('key');
    setAlertDistance('50');
  };

  const handleClose = () => {
    onClose();
    setName('');
    setSelectedIcon('key');
    setAlertDistance('50');
  };

  const renderIcon = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.iconButton,
        selectedIcon === item.id && styles.iconButtonActive
      ]}
      onPress={() => setSelectedIcon(item.id)}
    >
      <Ionicons
        name={item.name}
        size={24}
        color={selectedIcon === item.id ? COLORS.primary : COLORS.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Item Name</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="What don't you want to forget?"
                    placeholderTextColor={COLORS.textSecondary}
                    value={name}
                    onChangeText={setName}
                    autoFocus={!editingItem}
                  />
                </View>
              </View>

              {/* Icon Selection - Horizontal Carousel */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Choose an Icon</Text>
                <FlatList
                  data={ITEM_ICONS}
                  renderItem={renderIcon}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconCarousel}
                  ItemSeparatorComponent={() => <View style={styles.iconSeparator} />}
                />
              </View>

              {/* Alert Distance */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alert Distance (meters)</Text>
                <View style={styles.distanceButtons}>
                  {[25, 50, 100, 200].map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceButton,
                        parseInt(alertDistance) === distance && styles.distanceButtonActive
                      ]}
                      onPress={() => setAlertDistance(distance.toString())}
                    >
                      <Text style={[
                        styles.distanceButtonText,
                        parseInt(alertDistance) === distance && styles.distanceButtonTextActive
                      ]}>
                        {distance}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Custom distance"
                    placeholderTextColor={COLORS.textSecondary}
                    value={alertDistance}
                    onChangeText={setAlertDistance}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Preview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewIcon}>
                    <Ionicons 
                      name={getIconName(selectedIcon)} 
                      size={24} 
                      color={COLORS.accent} 
                    />
                  </View>
                  <View style={styles.previewText}>
                    <Text style={styles.previewName}>
                      {name || 'Item name'}
                    </Text>
                    <Text style={styles.previewDetails}>
                      Alert at {alertDistance || 50}m
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <LinearGradient
                  colors={[COLORS.accent, '#4dd100']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>
                    {editingItem ? 'Update' : 'Save'}
                  </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  inputContainer: {
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  iconCarousel: {
    paddingHorizontal: 4,
  },
  iconButton: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  iconSeparator: {
    width: 12,
  },
  distanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  distanceButton: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
  },
  distanceButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  distanceButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  distanceButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 16,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(104, 247, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ItemModal;