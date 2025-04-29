import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Connectivity state key
const CONNECTIVITY_KEY = 'isConnected';

/**
 * Network Manager Utility
 * Handles connectivity checks and state management
 */
class NetworkManager {
  /**
   * Initialize network monitoring
   * @returns {function} Unsubscribe function
   */
  static initNetworkMonitoring() {
    // Subscribe to network changes and update AsyncStorage
    return NetInfo.addEventListener(state => {
      AsyncStorage.setItem(CONNECTIVITY_KEY, JSON.stringify(!!state.isConnected));
    });
  }

  /**
   * Check current network connectivity
   * @returns {Promise<boolean>} Is connected
   */
  static async checkConnectivity() {
    try {
      const netInfoState = await NetInfo.fetch();
      const isConnected = !!netInfoState.isConnected;
      
      // Update AsyncStorage with current state
      await AsyncStorage.setItem(CONNECTIVITY_KEY, JSON.stringify(isConnected));
      
      return isConnected;
    } catch (error) {
      console.error('Network check failed:', error);
      return false;
    }
  }

  /**
   * Get connectivity status from AsyncStorage
   * @returns {Promise<boolean>} Is connected
   */
  static async getConnectivityStatus() {
    try {
      const status = await AsyncStorage.getItem(CONNECTIVITY_KEY);
      return status === null ? true : JSON.parse(status); // Default to true if not set
    } catch (error) {
      console.error('Failed to get connectivity status:', error);
      return false;
    }
  }
}

export default NetworkManager; 