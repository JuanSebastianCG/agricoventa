import api from './api';

export interface ProductHistoryRecord {
  id: string;
  productId: string;
  userId: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  changeField?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  additionalInfo?: any;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    userType: string;
  };
}

export interface ProductHistoryResponse {
  history: ProductHistoryRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ChangeMetric {
  type: string;
  count: number;
}

export interface FieldChangeMetric {
  field: string;
  count: number;
}

export interface TopModifiedProduct {
  productId: string;
  productName: string;
  changeCount: number;
}

export interface ProductChangeMetrics {
  changesByType: ChangeMetric[];
  changesByField: FieldChangeMetric[];
  topModifiedProducts: TopModifiedProduct[];
}

export interface ProductPriceTrend {
  id: string;
  name: string;
  currentPrice: number;
  weeklyTrend: number;
  unit: string;
  category: string;
  categoryId: string;
  priceHistory?: { date: string; price: number }[];
}

/**
 * Servicio para gestionar el historial de cambios de productos
 */
class ProductHistoryService {
  /**
   * Obtiene el historial de cambios de un producto específico
   * @param productId ID del producto
   * @param limit Límite de registros (por defecto 20)
   * @param offset Offset para paginación (por defecto 0)
   * @returns Historial de cambios del producto
   */
  async getProductHistory(productId: string, limit: number = 20, offset: number = 0): Promise<ProductHistoryResponse> {
    try {
      const response = await api.get(`/products/${productId}/history`, {
        params: { limit, offset }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener el historial del producto');
      }
    } catch (error: any) {
      console.error('Error en getProductHistory:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener el historial');
    }
  }

  /**
   * Obtiene métricas agregadas de cambios para la vista de Insights
   * @param startDate Fecha de inicio opcional para filtrar
   * @param endDate Fecha de fin opcional para filtrar
   * @returns Métricas de cambios para análisis
   */
  async getChangeMetrics(startDate?: Date, endDate?: Date): Promise<ProductChangeMetrics> {
    try {
      const params: any = {};
      
      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }
      
      if (endDate) {
        params.endDate = endDate.toISOString().split('T')[0];
      }
      
      const response = await api.get('/products/insights/changes', { params });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener métricas de cambios');
      }
    } catch (error: any) {
      console.error('Error en getChangeMetrics:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener métricas');
    }
  }

  /**
   * Obtiene las tendencias de precios para la vista de Insights de mercado
   * @param timespan Número de días para analizar (por defecto 30)
   * @param categoryId ID de categoría opcional para filtrar
   * @returns Tendencias de precios de productos
   */
  async getPriceTrends(timespan: number = 30, categoryId?: string): Promise<ProductPriceTrend[]> {
    try {
      const params: any = { timespan };
      
      if (categoryId) {
        params.categoryId = categoryId;
      }
      
      const response = await api.get('/products/insights/price-trends', { params });
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener tendencias de precios');
      }
    } catch (error: any) {
      console.error('Error en getPriceTrends:', error);
      
      // En caso de error o si el endpoint no está implementado, retornamos datos de ejemplo
      return this.getFallbackPriceTrends();
    }
  }

  /**
   * Proporciona datos de ejemplo de tendencias de precios en caso de error
   * @returns Datos de ejemplo de tendencias de precios
   */
  getFallbackPriceTrends(): ProductPriceTrend[] {
    return [
      {
        id: '1',
        name: 'Café',
        currentPrice: 12500,
        weeklyTrend: 2.8,
        unit: 'kg',
        category: 'Granos',
        categoryId: 'grains-category'
      },
      {
        id: '2',
        name: 'Banana',
        currentPrice: 2300,
        weeklyTrend: -1.5,
        unit: 'kg',
        category: 'Frutas',
        categoryId: 'fruits-category'
      },
      {
        id: '3',
        name: 'Papa',
        currentPrice: 3800,
        weeklyTrend: 1.2,
        unit: 'kg',
        category: 'Tubérculos',
        categoryId: 'tubers-category'
      },
      {
        id: '4',
        name: 'Arroz',
        currentPrice: 4200,
        weeklyTrend: 0.5,
        unit: 'kg',
        category: 'Granos',
        categoryId: 'grains-category'
      },
      {
        id: '5',
        name: 'Tomate',
        currentPrice: 5600,
        weeklyTrend: -0.8,
        unit: 'kg',
        category: 'Verduras',
        categoryId: 'vegetables-category'
      }
    ];
  }
}

export default new ProductHistoryService(); 