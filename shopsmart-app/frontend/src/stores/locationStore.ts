import { create } from 'zustand';
import { Location, Store } from '@/shared/types';
import { storesApi } from '../services/api';
import toast from 'react-hot-toast';

interface LocationState {
  // Current location
  currentLocation: Location | null;
  locationError: string | null;
  isLocationLoading: boolean;
  locationPermissionGranted: boolean;

  // Nearby stores
  nearbyStores: Store[];
  selectedStore: Store | null;
  storesLoading: boolean;
  storesError: string | null;
  lastSearchRadius: number;

  // Actions
  requestLocation: () => Promise<void>;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
  findNearbyStores: (radius?: number, chains?: string[]) => Promise<void>;
  selectStore: (store: Store | null) => void;
  refreshStores: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  // Initial state
  currentLocation: null,
  locationError: null,
  isLocationLoading: false,
  locationPermissionGranted: false,

  nearbyStores: [],
  selectedStore: null,
  storesLoading: false,
  storesError: null,
  lastSearchRadius: 25, // Default 25 miles

  // Request user's current location
  requestLocation: async () => {
    if (!navigator.geolocation) {
      set({
        locationError: 'Geolocation is not supported by this browser',
        isLocationLoading: false
      });
      return;
    }

    set({ isLocationLoading: true, locationError: null });

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const location: Location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      set({
        currentLocation: location,
        locationPermissionGranted: true,
        isLocationLoading: false,
        locationError: null
      });

      // Automatically find nearby stores
      get().findNearbyStores();

    } catch (error: any) {
      let errorMessage = 'Failed to get location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
        default:
          errorMessage = error.message || 'Failed to get location';
      }

      set({
        locationError: errorMessage,
        isLocationLoading: false,
        locationPermissionGranted: false
      });

      console.error('Location error:', error);
    }
  },

  // Set location manually (e.g., from address search)
  setLocation: (location: Location) => {
    set({
      currentLocation: location,
      locationError: null,
      locationPermissionGranted: true
    });

    // Find nearby stores for the new location
    get().findNearbyStores();
  },

  // Clear location data
  clearLocation: () => {
    set({
      currentLocation: null,
      locationError: null,
      locationPermissionGranted: false,
      nearbyStores: [],
      selectedStore: null
    });
  },

  // Find nearby stores
  findNearbyStores: async (radius = 25, chains?: string[]) => {
    const currentLocation = get().currentLocation;
    
    if (!currentLocation) {
      set({ storesError: 'Location is required to find nearby stores' });
      return;
    }

    set({ 
      storesLoading: true, 
      storesError: null,
      lastSearchRadius: radius 
    });

    try {
      const response = await storesApi.findNearby({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius,
        chains
      });

      if (response.success && response.data) {
        set({
          nearbyStores: response.data.stores,
          storesLoading: false,
          storesError: null
        });

        // Auto-select the closest store if none is selected
        if (response.data.stores.length > 0 && !get().selectedStore) {
          set({ selectedStore: response.data.stores[0] });
        }
      } else {
        throw new Error(response.error || 'Failed to find nearby stores');
      }
    } catch (error: any) {
      console.error('Error finding nearby stores:', error);
      const errorMessage = error.message || 'Failed to find nearby stores';
      
      set({
        storesError: errorMessage,
        storesLoading: false
      });

      toast.error(errorMessage);
    }
  },

  // Select a store
  selectStore: (store: Store | null) => {
    set({ selectedStore: store });
    
    if (store) {
      toast.success(`Selected ${store.name}`);
    }
  },

  // Refresh nearby stores
  refreshStores: async () => {
    const { lastSearchRadius } = get();
    await get().findNearbyStores(lastSearchRadius);
  }
}));