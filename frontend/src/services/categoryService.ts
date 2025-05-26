import api from './api';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto, CategoryQueryDto } from '../interfaces/category';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  children?: Category[];
}

export interface CategoryResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

class CategoryService {
  /**
   * Obtiene todas las categorías
   * @returns Lista de categorías
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      console.log('[CategoryService] Calling getAllCategories without filters');
      const response = await api.get('/categories', {
        params: {
          includeChildren: true,
          includeParent: true
        }
      });
      
      if (response.data.success) {
        console.log('[CategoryService] getAllCategories success, found:', 
          response.data.data.categories ? response.data.data.categories.length : 'no categories array');
        
        // Si la respuesta tiene un formato esperado con data.categories
        if (response.data.data.categories) {
          return response.data.data.categories || [];
        }
        
        // Si data es directamente un array
        if (Array.isArray(response.data.data)) {
          console.log('[CategoryService] Found categories array directly in data');
          return response.data.data;
        }
        
        // Si data es un objeto que podría contener un array de categorías
        if (response.data.data && typeof response.data.data === 'object') {
          console.log('[CategoryService] Searching for categories array within data object');
          for (const key in response.data.data) {
            if (Array.isArray(response.data.data[key])) {
              console.log(`[CategoryService] Found categories array in field ${key}`);
              return response.data.data[key];
            }
          }
        }
        
        // Si no encontramos categorías, intentamos con una búsqueda en toda la respuesta
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`[CategoryService] Found categories array at top level in field ${key}`);
            return response.data[key];
          }
          
          if (response.data[key] && typeof response.data[key] === 'object') {
            for (const subKey in response.data[key]) {
              if (Array.isArray(response.data[key][subKey])) {
                console.log(`[CategoryService] Found categories array in nested field ${key}.${subKey}`);
                return response.data[key][subKey];
              }
            }
          }
        }
        
        return [];
      } else {
        // If the first attempt fails, try a simpler request
        console.log('[CategoryService] First attempt failed, trying simple request');
        const simpleResponse = await api.get('/categories');
        
        if (simpleResponse.data.success) {
          console.log('[CategoryService] Simple request success, found:', 
            simpleResponse.data.data.categories ? simpleResponse.data.data.categories.length : 'no categories array');
          
          // Aplicamos la misma lógica de búsqueda de arreglos
          if (simpleResponse.data.data.categories) {
            return simpleResponse.data.data.categories || [];
          }
          
          if (Array.isArray(simpleResponse.data.data)) {
            return simpleResponse.data.data;
          }
          
          if (simpleResponse.data.data && typeof simpleResponse.data.data === 'object') {
            for (const key in simpleResponse.data.data) {
              if (Array.isArray(simpleResponse.data.data[key])) {
                return simpleResponse.data.data[key];
              }
            }
          }
          
          for (const key in simpleResponse.data) {
            if (Array.isArray(simpleResponse.data[key])) {
              return simpleResponse.data[key];
            }
          }
          
          return [];
        }
        
        throw new Error(response.data.error?.message || 'Error al obtener categorías');
      }
    } catch (error: any) {
      console.error('[CategoryService] Error in getAllCategories:', error);
      // Last fallback attempt with no parameters at all
      try {
        console.log('[CategoryService] Trying last fallback with raw GET request');
        const rawResponse = await api.get('/categories');
        if (rawResponse.data && rawResponse.data.success) {
          // Aplicamos la misma lógica de búsqueda que arriba
          if (rawResponse.data.data && rawResponse.data.data.categories) {
            return rawResponse.data.data.categories || [];
          }
          
          if (Array.isArray(rawResponse.data.data)) {
            return rawResponse.data.data;
          }
          
          if (rawResponse.data.data && typeof rawResponse.data.data === 'object') {
            for (const key in rawResponse.data.data) {
              if (Array.isArray(rawResponse.data.data[key])) {
                return rawResponse.data.data[key];
              }
            }
          }
          
          for (const key in rawResponse.data) {
            if (Array.isArray(rawResponse.data[key])) {
              return rawResponse.data[key];
            }
          }
        }
      } catch (fallbackError) {
        console.error('[CategoryService] Fallback also failed:', fallbackError);
      }
      
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener categorías');
    }
    return []; // Retornar un arreglo vacío si no se encontraron categorías
  }

  /**
   * Obtiene una categoría específica por su ID
   * @param categoryId ID de la categoría
   * @returns Detalles de la categoría
   */
  async getCategoryById(categoryId: string): Promise<Category> {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error?.message || 'Error al obtener la categoría');
      }
    } catch (error: any) {
      console.error('Error en getCategoryById:', error);
      throw new Error(error.response?.data?.error?.message || error.message || 'Error al obtener la categoría');
    }
  }

  /**
   * Construye una estructura jerárquica de categorías
   * @param categories Lista plana de categorías
   * @returns Categorías organizadas jerárquicamente
   */
  buildCategoryHierarchy(categories: Category[]): Category[] {
    // Crear una copia para no modificar el original
    const categoriesCopy = JSON.parse(JSON.stringify(categories)) as Category[];
    
    // Mapa de categorías por ID para acceso rápido
    const categoryMap = new Map<string, Category>();
    
    // Añadir todas las categorías al mapa
    categoriesCopy.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
    });
    
    // Categorías raíz (sin padre)
    const rootCategories: Category[] = [];
    
    // Construir la jerarquía
    categoriesCopy.forEach(category => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        } else {
          // Si el padre no existe, tratarlo como raíz
          rootCategories.push(category);
        }
      } else {
        // Categoría raíz (sin padre)
        rootCategories.push(category);
      }
    });
    
    return rootCategories;
  }

  /**
   * Obtiene categorías con opciones de filtrado
   * @param params Parámetros de filtrado
   * @returns Lista de categorías y total
   */
  async getCategories(params?: any): Promise<{ categories: Category[], total: number }> {
    try {
      console.log('[CategoryService] Requesting categories with params:', params);
      
      // Add a retry mechanism
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        try {
          const response = await api.get('/categories', { params });
          console.log(`[CategoryService] API Response attempt ${attempts}:`, response.data);
          
          // If the response has the expected structure
          if (response.data && response.data.success && response.data.data) {
            // If data contains categories and total
            if (response.data.data.categories) {
              console.log('[CategoryService] Found categories in response:', response.data.data.categories.length);
              const total = typeof response.data.data.total === 'number' 
                ? response.data.data.total 
                : response.data.data.categories.length;
              
              return { 
                categories: response.data.data.categories, 
                total 
              };
            }
            
            // If data is directly an array
            if (Array.isArray(response.data.data)) {
              console.log('[CategoryService] Found categories array in response:', response.data.data.length);
              return { 
                categories: response.data.data,
                total: response.data.data.length 
              };
            }
            
            // If data is an object that has the categories
            if (response.data.data && typeof response.data.data === 'object') {
              console.log('[CategoryService] Response data is an object, searching for categories');
              // Buscar el campo que podría contener las categorías
              for (const key in response.data.data) {
                if (Array.isArray(response.data.data[key])) {
                  console.log(`[CategoryService] Found array in field ${key}, assuming these are categories`);
                  return {
                    categories: response.data.data[key],
                    total: response.data.data[key].length
                  };
                }
              }
            }
          }
          
          // If we got to this point, either the response doesn't have the expected structure or categories array is empty
          console.warn('[CategoryService] Unexpected API response structure or empty categories array:', response.data);
          
          // Try to fall back to calling getAllCategories if this is the last attempt
          if (attempts === maxAttempts) {
            console.log('[CategoryService] Trying fallback to getAllCategories...');
            const allCategories = await this.getAllCategories();
            return { categories: allCategories, total: allCategories.length };
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[CategoryService] Error in attempt ${attempts}:`, error);
          if (attempts === maxAttempts) {
            throw error;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // If all attempts fail, return empty result
      console.error('[CategoryService] All attempts to fetch categories failed');
      return { categories: [], total: 0 };
    } catch (error) {
      console.error('[CategoryService] Error fetching categories:', error);
      return { categories: [], total: 0 };
    }
  }

  /**
   * Crea una nueva categoría
   * @param data Datos de la categoría
   * @returns La categoría creada
   */
  async createCategory(data: any): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data.data;
  }

  /**
   * Actualiza una categoría existente
   * @param id ID de la categoría
   * @param data Datos actualizados
   * @returns La categoría actualizada
   */
  async updateCategory(id: string, data: any): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  }

  /**
   * Elimina una categoría
   * @param id ID de la categoría
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoryService(); 