import api from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  unitMeasure: string;
  sellerId: string;
  categoryId?: string;
  originLocationId?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  images?: ProductImage[];
  seller?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
  };
  originLocation?: any;
  region?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface PriceData {
  date: string;
  price: number;
}

export interface ProductTrend {
  productId: string;
  productName: string;
  currentPrice: number;
  previousPrice: number;
  percentChange: number;
  unit: string;
  categoryId: string;
  categoryName: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

class ProductService {
  /**
   * Obtiene todos los productos con opciones de filtrado
   * @param params Parámetros de filtrado y paginación
   * @returns Lista de productos
   */
  async getProducts(params?: any): Promise<Product[]> {
    try {
      const response = await api.get('/products', { params });
      
      if (response.data.success) {
        return response.data.data.products || [];
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener productos');
      }
    } catch (error: any) {
      console.error('Error en getProducts:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener productos');
    }
  }

  /**
   * Obtiene un producto específico por su ID
   * @param productId ID del producto
   * @returns Detalles del producto
   */
  async getProductById(productId: string): Promise<Product> {
    try {
      const response = await api.get(`/products/${productId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener el producto');
      }
    } catch (error: any) {
      console.error('Error en getProductById:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener el producto');
    }
  }

  /**
   * Obtiene los productos por categoría
   * @param categoryId ID de la categoría
   * @param params Parámetros adicionales de filtrado
   * @returns Lista de productos en la categoría
   */
  async getProductsByCategory(categoryId: string, params?: any): Promise<Product[]> {
    try {
      const response = await api.get(`/products/category/${categoryId}`, { params });
      
      if (response.data.success) {
        return response.data.data.products || [];
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener productos por categoría');
      }
    } catch (error: any) {
      console.error('Error en getProductsByCategory:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener productos por categoría');
    }
  }

  /**
   * Calcula las tendencias de precios para productos
   * @param products Lista de productos
   * @param days Número de días para el cálculo de tendencia
   * @returns Tendencias de precios de productos
   */
  async calculatePriceTrends(products: Product[], days: number = 30): Promise<ProductTrend[]> {
    // Simulación de tendencias de precios
    // En un sistema real, esto obtendría datos del historial de precios desde el backend
    
    // Generar datos de tendencia simulados basados en productos reales
    return products.map(product => {
      // Simulación de cambio de precio (entre -5% y +10%)
      const randomChange = (Math.random() * 15) - 5;
      const previousPrice = product.price / (1 + (randomChange / 100));
      
      return {
        productId: product.id,
        productName: product.name,
        currentPrice: product.price,
        previousPrice,
        percentChange: randomChange,
        unit: product.unitMeasure,
        categoryId: product.categoryId || '',
        categoryName: product.category?.name || 'Sin categoría'
      };
    });
  }

  /**
   * Obtiene datos históricos de precios para un producto
   * @param productId ID del producto
   * @param days Número de días de historial
   * @returns Datos de precios históricos
   */
  async getPriceHistory(productId: string, days: number = 30): Promise<PriceData[]> {
    // Simulación de historial de precios
    // En un sistema real, esto obtendría datos del historial de precios desde el backend
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const priceData: PriceData[] = [];
    
    try {
      // Primero intentamos obtener el producto actual para tener un precio base
      const product = await this.getProductById(productId);
      const basePrice = product.price;
      
      // Generar datos históricos simulados
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Fluctuación aleatoria del precio (-10% a +15%)
        const fluctuation = ((Math.random() * 25) - 10) / 100;
        
        // Para los días más recientes, acercarse al precio actual
        const weight = i / days; // 0 a 1
        const weightedFluctuation = fluctuation * (1 - weight);
        
        // Para el último día, usar el precio actual exacto
        let price;
        if (i === days) {
          price = basePrice;
        } else {
          price = basePrice * (1 - weightedFluctuation);
        }
        
        priceData.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(price * 100) / 100
        });
      }
      
      return priceData;
    } catch (error) {
      console.error('Error obteniendo historial de precios:', error);
      return [];
    }
  }
}

export default new ProductService(); 