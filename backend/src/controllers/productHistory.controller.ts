import { Request, Response } from 'express';
import { ApiError } from '../middleware/error.middleware';
import { isValidObjectId } from 'mongoose';
import { logger } from '../config/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Tipos de cambio para el historial de productos
 */
export enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * Interfaz para los datos requeridos al registrar un cambio
 */
interface ProductChangeData {
  productId: string;
  userId: string;
  changeType: ChangeType;
  changeField?: string;
  oldValue?: string;
  newValue?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Controlador para gestionar el historial de cambios de productos
 */
export class ProductHistoryController {
  /**
   * Registra un nuevo cambio en el historial de productos
   * @param changeData Datos del cambio a registrar
   * @returns El registro de historial creado
   */
  static async recordChange(changeData: ProductChangeData) {
    try {
      const { productId, userId, changeType, changeField, oldValue, newValue, additionalInfo } = changeData;
      
      const historyRecord = await prisma.productHistory.create({
        data: {
          productId,
          userId,
          changeType,
          changeField,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: newValue ? String(newValue) : null,
          additionalInfo: additionalInfo || {},
          timestamp: new Date()
        }
      });
      
      logger.info(`Producto ${productId} - ${changeType} registrado en historial por usuario ${userId}`);
      return historyRecord;
    } catch (error) {
      logger.error('Error al registrar cambio en historial de producto:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial completo de un producto
   */
  private static async fetchProductHistory(productId: string, limit: number = 20, offset: number = 0) {
    try {
      const history = await prisma.productHistory.findMany({
        where: { productId },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              userType: true
            }
          }
        }
      });
      
      const total = await prisma.productHistory.count({ where: { productId } });
      
      return {
        history,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      };
    } catch (error) {
      logger.error(`Error al obtener historial del producto ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene métricas de cambios para análisis
   */
  private static async fetchChangeMetrics(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    
    if (startDate) {
      dateFilter.gte = startDate;
    }
    
    if (endDate) {
      dateFilter.lte = endDate;
    }
    
    const whereClause = Object.keys(dateFilter).length > 0 ? { timestamp: dateFilter } : {};
    
    try {
      // Contar cambios por tipo
      const changesByType = await prisma.productHistory.groupBy({
        by: ['changeType'],
        _count: { changeType: true },
        where: whereClause
      });
      
      // Contar cambios por campo
      const changesByField = await prisma.productHistory.groupBy({
        by: ['changeField'],
        _count: { changeField: true },
        where: {
          ...whereClause,
          changeField: { not: null }
        }
      });
      
      // Obtener productos más modificados
      const productChanges = await prisma.productHistory.groupBy({
        by: ['productId'],
        _count: { productId: true },
        where: whereClause,
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: 10
      });
      
      // Obtener IDs de los productos más modificados
      const productIds = productChanges.map(p => p.productId);
      
      // Obtener detalles de estos productos
      const productsDetails = productIds.length > 0 ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true }
      }) : [];
      
      // Mapear IDs a nombres
      const productNamesMap = Object.fromEntries(
        productsDetails.map(p => [p.id, p.name])
      );
      
      // Formatear resultados para productos más modificados
      const topModifiedProducts = productChanges.map(p => ({
        productId: p.productId,
        productName: productNamesMap[p.productId] || 'Producto desconocido',
        changeCount: p._count.productId
      }));
      
      return {
        changesByType: changesByType.map(c => ({
          type: c.changeType,
          count: c._count.changeType
        })),
        changesByField: changesByField.map(c => ({
          field: c.changeField || 'Desconocido',
          count: c._count.changeField
        })),
        topModifiedProducts
      };
    } catch (error) {
      logger.error('Error al obtener métricas de cambios:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cambios de un producto específico
   * @param req Request - productId en params, limit y offset en query
   * @param res Response
   */
  static async getProductHistory(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { limit = '20', offset = '0' } = req.query;
      
      if (!productId || !isValidObjectId(productId)) {
        throw new ApiError(400, 'ID de producto inválido');
      }
      
      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);
      
      if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 0 || offsetNum < 0) {
        throw new ApiError(400, 'Parámetros de paginación inválidos');
      }
      
      const history = await ProductHistoryController.fetchProductHistory(
        productId,
        limitNum,
        offsetNum
      );
      
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.statusCode,
            message: error.message
          }
        });
      } else {
        logger.error('Error al obtener historial de producto:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 500,
            message: 'Error interno del servidor al obtener historial'
          }
        });
      }
    }
  }

  /**
   * Obtiene métricas de cambios para análisis de insights
   * @param req Request - startDate y endDate en query
   * @param res Response
   */
  static async getProductChangeMetrics(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;
      
      if (startDate) {
        startDateObj = new Date(startDate as string);
        if (isNaN(startDateObj.getTime())) {
          throw new ApiError(400, 'Fecha de inicio inválida');
        }
      }
      
      if (endDate) {
        endDateObj = new Date(endDate as string);
        if (isNaN(endDateObj.getTime())) {
          throw new ApiError(400, 'Fecha de fin inválida');
        }
      }
      
      const metrics = await ProductHistoryController.fetchChangeMetrics(startDateObj, endDateObj);
      
      res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.statusCode,
            message: error.message
          }
        });
      } else {
        logger.error('Error al obtener métricas de cambios:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 500,
            message: 'Error interno del servidor al obtener métricas'
          }
        });
      }
    }
  }

  /**
   * Obtiene tendencias de precios de productos para la página de insights
   * @param req Request - timespan (días), categoryId opcional
   * @param res Response
   */
  static async getProductPriceTrends(req: Request, res: Response) {
    try {
      const timespan = parseInt(req.query.timespan as string) || 30;
      const categoryId = req.query.categoryId as string;
      
      // Fecha límite para la consulta
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - timespan);
      
      // Construir la consulta
      const query: any = {
        changeType: ChangeType.UPDATE,
        changeField: 'basePrice',
        timestamp: { gte: limitDate }
      };
      
      // Obtener productos con historial de cambios de precio
      const productsWithPriceChanges = await prisma.productHistory.findMany({
        where: query,
        select: {
          productId: true,
          oldValue: true,
          newValue: true,
          timestamp: true,
          product: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              unitMeasure: true,
              categoryId: true,
              category: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });
      
      // Filtrar por categoría si se especifica
      let filteredProducts = productsWithPriceChanges;
      if (categoryId) {
        filteredProducts = productsWithPriceChanges.filter(p => p.product.categoryId === categoryId);
      }
      
      // Agrupar por producto para calcular tendencias
      const productTrends: Record<string, {
        id: string;
        name: string;
        currentPrice: number;
        oldPrice: number;
        unit: string;
        weeklyTrend: number;
        category: string;
        categoryId: string;
      }> = {};
      
      // Primero agrupar por producto
      filteredProducts.forEach(record => {
        if (!record.product) return;
        
        const productId = record.productId;
        if (!productTrends[productId]) {
          productTrends[productId] = {
            id: productId,
            name: record.product.name,
            currentPrice: record.product.basePrice,
            oldPrice: parseFloat(record.oldValue || '0'),
            unit: record.product.unitMeasure,
            weeklyTrend: 0,
            category: record.product.category?.name || 'Sin categoría',
            categoryId: record.product.categoryId || ''
          };
        }
      });
      
      // Calcular tendencias
      Object.values(productTrends).forEach(product => {
        // Encontrar el registro más antiguo dentro del período para comparar
        const oldestRecord = filteredProducts
          .filter(r => r.productId === product.id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];
        
        if (oldestRecord && oldestRecord.oldValue) {
          const oldPrice = parseFloat(oldestRecord.oldValue);
          product.oldPrice = oldPrice;
          
          // Calcular tendencia porcentual
          const priceDiff = product.currentPrice - oldPrice;
          product.weeklyTrend = oldPrice > 0 ? (priceDiff / oldPrice) * 100 : 0;
        }
      });
      
      // Convertir a array para respuesta
      const trendsList = Object.values(productTrends);
      
      // Ordenar por mayor cambio de precio (absoluto)
      trendsList.sort((a, b) => Math.abs(b.weeklyTrend) - Math.abs(a.weeklyTrend));
      
      // Limitar a 10 productos con mayores cambios
      const limitedTrends = trendsList.slice(0, 10);
      
      res.status(200).json({
        success: true,
        data: limitedTrends
      });
    } catch (error) {
      console.error('Error fetching product price trends:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to fetch product price trends'
        }
      });
    }
  }
}

export default ProductHistoryController; 