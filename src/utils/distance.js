/**
 * Distance calculation utilities
 * Centralized functions for calculating and formatting distances
 */

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
  
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
    return R * c; // Distance in meters
  };
  
  /**
   * Format distance for display (meters or kilometers)
   * @param {number} distance - Distance in meters
   * @returns {string} Formatted distance string
   */
  export const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };
  
  /**
   * Format distance with "away" text for UI display
   * @param {number} distance - Distance in meters
   * @returns {string} Formatted distance string with "away"
   */
  export const formatDistanceWithAway = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)} meters away`;
    } else {
      return `${(distance / 1000).toFixed(1)} kilometers away`;
    }
  };
  
  /**
   * Get distance text between current location and item location
   * @param {Object} currentLocation - Current location {latitude, longitude}
   * @param {Object} itemLocation - Item location {latitude, longitude}
   * @param {boolean} includeAway - Whether to include "away" in the text
   * @returns {string} Distance text or error message
   */
  export const getDistanceText = (currentLocation, itemLocation, includeAway = false) => {
    if (!currentLocation || !itemLocation) {
      return 'Location unavailable';
    }
    
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      itemLocation.latitude,
      itemLocation.longitude
    );
  
    return includeAway ? formatDistanceWithAway(distance) : formatDistance(distance);
  };