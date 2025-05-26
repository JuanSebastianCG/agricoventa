import api from './api';
import { IUserCertification, CertificationType } from '../interfaces/user';

/**
 * Service for managing user certifications
 */
export const certificationService = {
  /**
   * Upload a certification
   * @param userId - User ID
   * @param certName - Certification name
   * @param certType - Certification type
   * @param certNumber - Certificate number/code
   * @param issuedDate - Date when certificate was issued
   * @param expiryDate - Date when certificate expires
   * @param imageFile - Image file
   */
  async uploadCertification(
    userId: string,
    certName: string,
    certType: CertificationType,
    certNumber: string,
    issuedDate: Date,
    expiryDate: Date,
    imageFile: File
  ): Promise<IUserCertification> {
    console.log('=========== INICIO DIAGNÓSTICO CERTIFICACIÓN ===========');
    console.log('certificationService.uploadCertification: Iniciando proceso de carga');
    console.log('Token de autenticación presente:', !!localStorage.getItem('auth_token'));
    
    // Crear FormData para enviar todos los datos en una sola petición
    const formData = new FormData();
    // Añadir la imagen
    formData.append('certificationDocument', imageFile);
    
    // Añadir todos los datos de certificación
    formData.append('userId', userId);
    formData.append('certificationName', certName);
    formData.append('certificationType', certType);
    formData.append('certificateNumber', certNumber);
    formData.append('issuedDate', issuedDate.toISOString());
    formData.append('expiryDate', expiryDate.toISOString());
    
    // Verificar que todos los campos se hayan añadido correctamente
    const formDataEntries = Array.from(formData.entries());
    console.log('certificationService.uploadCertification: FormData contiene estos campos:', 
      formDataEntries.map(([key]) => key));
    
    console.log('certificationService.uploadCertification: Datos a enviar:', {
      userId: userId ? userId.substring(0, 4) + '...' : 'no presente',
      certificationName: certName || 'no presente',
      certificationType: certType || 'no presente',
      certificateNumber: certNumber || 'no presente',
      issuedDate: issuedDate ? issuedDate.toISOString() : 'no presente',
      expiryDate: expiryDate ? expiryDate.toISOString() : 'no presente',
      certificationDocument: imageFile.name
    });
    
    try {
      // Enviar todos los datos y la imagen en una sola petición
      console.log('Enviando petición POST a /certifications/upload...');
      const response = await api.post('/certifications/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('certificationService.uploadCertification: Respuesta del servidor:', response.data);
      console.log('=========== FIN DIAGNÓSTICO CERTIFICACIÓN ===========');
      
      if (!response.data.success && response.data.error) {
        throw new Error(response.data.error?.message || 'Error al subir la certificación');
      }
      
      // Obtener los datos de la certificación de la respuesta
      const certification = response.data.data?.certification || response.data.certification || response.data.data || response.data;
      
      console.log('certificationService.uploadCertification: Certificación creada/actualizada exitosamente:', certification);
      
      return certification;
    } catch (error: any) {
      console.error('Error en uploadCertification:', error);
      console.log('=========== FIN DIAGNÓSTICO CERTIFICACIÓN CON ERROR ===========');
      
      // Mejorar el mensaje de error para proporcionar más detalles
      if (error.response) {
        console.error('Respuesta de error del servidor:', error.response.data);
        throw new Error(`Error del servidor: ${error.response.data.error?.message || error.response.statusText}`);
      }
      
      throw error;
    }
  },
  
  /**
   * Get all certifications for a user
   * @param userId - User ID
   */
  async getUserCertifications(userId: string): Promise<IUserCertification[]> {
    try {
      const response = await api.get(`/certifications/user/${userId}`);
      // Check if the data is nested and return the array, otherwise return the direct data (or an empty array)
      const responseData = response.data;
      return Array.isArray(responseData?.data) ? responseData.data : Array.isArray(responseData) ? responseData : [];
    } catch (error) {
      console.error('Error fetching user certifications in service:', error);
      return []; // Return empty array on error
    }
  },
  
  /**
   * Verify if a user has all required certifications
   * @param userId - User ID
   */
  async verifyUserCertifications(userId: string): Promise<{
    hasAllCertifications: boolean;
    certificationsCount: {
      verified: number;
      total: number;
    };
  }> {
    // Agregar parámetro de timestamp para evitar caché
    const timestamp = new Date().getTime();
    console.log(`[certificationService] Solicitando verificación para el usuario ${userId} con timestamp ${timestamp}`);
    
    try {
      const response = await api.get(`/certifications/verify/${userId}`, {
        params: { _t: timestamp }
      });
      
      console.log('[certificationService] Respuesta de verificación:', JSON.stringify(response.data));
      
      // Verificar si la respuesta tiene el formato esperado
      if (response.data && typeof response.data.hasAllCertifications === 'boolean') {
        console.log(`[certificationService] hasAllCertifications=${response.data.hasAllCertifications}`);
        
        // Verificar si además tenemos el contador de certificaciones
        if (response.data.certificationsCount && 
            typeof response.data.certificationsCount.verified === 'number' && 
            typeof response.data.certificationsCount.total === 'number') {
          console.log(`[certificationService] verified=${response.data.certificationsCount.verified}, total=${response.data.certificationsCount.total}`);
        } else {
          console.warn('[certificationService] La respuesta no contiene el contador de certificaciones en el formato esperado');
        }
        
        return response.data;
      } else if (response.data && response.data.success === true && response.data.data) {
        // Intentar manejar el formato anidado de respuesta del backend
        console.log('[certificationService] Intentando extraer datos de formato anidado:', JSON.stringify(response.data.data));
        
        if (typeof response.data.data.hasAllCertifications === 'boolean') {
          const result = {
            hasAllCertifications: response.data.data.hasAllCertifications,
            certificationsCount: {
              verified: 0,
              total: 4
            }
          };
          
          if (response.data.data.certificationsCount && 
              typeof response.data.data.certificationsCount.verified === 'number' && 
              typeof response.data.data.certificationsCount.total === 'number') {
            result.certificationsCount = response.data.data.certificationsCount;
          }
          
          console.log('[certificationService] Formato normalizado:', JSON.stringify(result));
          return result;
        }
      }
      
      // Si no podemos extraer los datos necesarios, devolvemos un valor por defecto
      console.error('[certificationService] No se pudo extraer la información de certificaciones de la respuesta');
      return {
        hasAllCertifications: false,
        certificationsCount: {
          verified: 0,
          total: 4
        }
      };
    } catch (error) {
      console.error('[certificationService] Error al verificar certificaciones:', error);
      throw error;
    }
  },
  
  /**
   * Get all certifications for admin view
   */
  async getAllCertificationsAdmin(params?: Record<string, any>): Promise<{
    data: IUserCertification[];
    pagination: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; };
  }> {
    try {
      // Convertir los parámetros numéricos de string a number
      const processedParams: Record<string, any> = {};
      
      if (params) {
        // Copiamos todos los parámetros
        Object.keys(params).forEach(key => {
          let value = params[key];
          
          // Convertir page y limit a números
          if (key === 'page' || key === 'limit') {
            value = parseInt(value, 10);
            if (isNaN(value)) {
              // Si no se puede convertir, usar valores por defecto
              value = key === 'page' ? 1 : 10;
            }
          }
          
          processedParams[key] = value;
        });
      }
      
      console.log('Fetching admin certifications with processed params:', processedParams);
      const response = await api.get('/certifications/admin', { params: processedParams });
      console.log('Admin certifications response:', response);

      // Ensure we handle different response formats correctly
      if (response && response.data) {
        if (response.data.success === true) {
          // Standard API response format: { success: true, data: {...} }
          let certifications: IUserCertification[] = [];
          let pagination = {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10
          };

          if (response.data.data) {
            // Direct data property containing items and pagination
            if (Array.isArray(response.data.data.certifications)) {
              certifications = response.data.data.certifications;
              
              if (response.data.data.pagination) {
                pagination = {
                  currentPage: response.data.data.pagination.page || 1,
                  totalPages: response.data.data.pagination.pages || 1,
                  totalItems: response.data.data.pagination.total || 0,
                  itemsPerPage: response.data.data.pagination.limit || 10
                };
              }
            } 
            // Alternative: data directly contains certifications array
            else if (Array.isArray(response.data.data)) {
              certifications = response.data.data;
            }
            // Alternative: data contains different named fields
            else if (typeof response.data.data === 'object') {
              if (Array.isArray(response.data.data.items)) {
                certifications = response.data.data.items;
              }
              
              if (response.data.data.meta || response.data.data.paging) {
                const paginationData = response.data.data.meta || response.data.data.paging;
                pagination = {
                  currentPage: paginationData.page || paginationData.currentPage || 1,
                  totalPages: paginationData.totalPages || paginationData.pages || 1,
                  totalItems: paginationData.total || paginationData.totalItems || 0,
                  itemsPerPage: paginationData.limit || paginationData.pageSize || 10
                };
              }
            }
          }

          console.log('Processed certifications:', certifications.length);
          console.log('Processed pagination:', pagination);

          return {
            data: certifications,
            pagination
          };
        } else {
          // Non-success response
          console.error('API returned success:false:', response.data.error);
          throw new Error(response.data.error?.message || 'Error fetching certifications');
        }
      }

      // Fallback for unexpected response format
      console.error('Unexpected response format:', response);
      throw new Error('Respuesta inesperada del servidor');
    } catch (error: any) {
      console.error('Error in getAllCertificationsAdmin:', error);
      
      if (error.response?.data?.error) {
        throw new Error(`Error: ${error.response.data.error.message || 'Estructura de respuesta errónea'}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al obtener certificaciones');
      }
    }
  },
  
  /**
   * Get all pending certifications (admin only)
   */
  async getPendingCertifications(): Promise<IUserCertification[]> {
    const response = await api.get('/certifications/pending');
    return response.data;
  },
  
  /**
   * Approve a certification (admin only)
   * @param certificationId - Certification ID
   * @param adminId - Admin user ID
   */
  async approveCertification(certificationId: string, adminId: string): Promise<IUserCertification> {
    const response = await api.put(`/certifications/approve/${certificationId}`, { adminId });
    return response.data;
  },
  
  /**
   * Reject a certification (admin only)
   * @param certificationId - Certification ID
   * @param adminId - Admin user ID
   * @param rejectionReason - Reason for rejection
   */
  async rejectCertification(
    certificationId: string,
    adminId: string,
    rejectionReason: string
  ): Promise<IUserCertification> {
    const response = await api.put(`/certifications/reject/${certificationId}`, {
      adminId,
      rejectionReason,
    });
    return response.data;
  },
  
  /**
   * Get a single certification by ID
   */
  async getCertificationById(certificationId: string): Promise<IUserCertification> {
    try {
      // Validate MongoDB ObjectID format to prevent unnecessary API calls
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(certificationId)) {
        throw new Error('Invalid certification ID format');
      }
      
      console.log(`Fetching certification with ID: ${certificationId}`);
      const response = await api.get(`/certifications/${certificationId}`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data?.error?.message || 'Error fetching certification');
    } catch (error: any) {
      console.error('Error in getCertificationById:', error);
      
      if (error.response?.data?.error) {
        throw new Error(`Error: ${error.response.data.error.message || 'No se pudo obtener el certificado'}`);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error desconocido al obtener el certificado');
      }
    }
  },
}; 