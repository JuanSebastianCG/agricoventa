import api from './api';

export interface ILocation {
  id: string;
  addressLine1: string; 
  addressLine2?: string;
  city: string;
  department: string;
  postalCode?: string;
  country?: string;
}

// Colombian departments list for standardization
export const COLOMBIAN_DEPARTMENTS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada'
];

class LocationService {
  async getUserLocations(userId: string): Promise<ILocation[]> {
    try {
      console.log("[LocationService] Fetching locations for user via API:", userId);
      const response = await api.get(`/locations/user/${userId}`);
      if (response.data && response.data.success) {
        return response.data.data || [];
      }
      console.error("[LocationService] Failed to fetch user locations or unexpected response structure:", response.data);
      return [];
    } catch (error) {
      console.error("[LocationService] Error calling getUserLocations API:", error);
      return [];
    }
  }

  async getCurrentUserPrimaryLocation(): Promise<ILocation | null> {
    try {
      console.log("[LocationService] Fetching current user's primary location via API");
      const response = await api.get(`/users/me/location`);
      if (response.data && response.data.success && response.data.data) {
        return response.data.data as ILocation;
      }
      if (response.data && response.data.success && !response.data.data) {
        console.log("[LocationService] Current user does not have a primary location set.");
        return null;
      }
      console.error("[LocationService] Failed to fetch user's primary location or unexpected response structure:", response.data);
      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log("[LocationService] No primary location found for the current user (404).");
        return null;
      }
      console.error("[LocationService] Error calling getCurrentUserPrimaryLocation API:", error);
      return null; 
    }
  }

  async createLocation(data: Partial<ILocation>): Promise<ILocation> {
    try {
      console.log("[LocationService] Creating new location via API:", data);
      const response = await api.post('/locations', data); 
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error?.message || 'Failed to create location or unexpected response structure');
    } catch (error: any) {
      console.error("[LocationService] Error calling createLocation API:", error);
      throw error; 
    }
  }

  async updateLocation(locationId: string, data: Partial<ILocation>): Promise<ILocation> {
    try {
      console.log("[LocationService] Updating location via API:", locationId, data);
      const response = await api.put(`/locations/${locationId}`, data);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.error?.message || 'Failed to update location');
    } catch (error: any) {
      console.error("[LocationService] Error calling updateLocation API:", error);
      throw error;
    }
  }

  async getLocationById(locationId: string): Promise<ILocation | null> {
    try {
      console.log("[LocationService] Fetching location by ID:", locationId);
      const response = await api.get(`/locations/${locationId}`);
      if (response.data && response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("[LocationService] Error fetching location by ID:", error);
      return null;
    }
  }
}

export const locationService = new LocationService();
export default locationService; 