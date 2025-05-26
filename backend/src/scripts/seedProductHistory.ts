import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enumeración para los tipos de cambios
enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

// Configuración
const HISTORY_DAYS_BACK = 90; // Generar historia para los últimos 90 días
const PRICE_CHANGE_FREQUENCY = 0.6; // Probabilidad de cambio de precio (60%)
const STOCK_CHANGE_FREQUENCY = 0.4; // Probabilidad de cambio de stock (40%)
const DESCRIPTION_CHANGE_FREQUENCY = 0.1; // Probabilidad de cambio de descripción (10%)

// Función para generar un ID de MongoDB (para casos donde se necesite)
function generateMongoId(): string {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  
  return timestamp + machineId + processId + counter;
}

// Función principal
async function main() {
  try {
    console.log('🌱 Iniciando seeder de historial de productos...');
    
    // 1. Obtener todos los productos
    const products = await prisma.product.findMany({
      include: {
        seller: true,
        category: true
      }
    });
    
    if (products.length === 0) {
      console.log('❌ No hay productos en la base de datos. Ejecute primero el seeder de productos.');
      return;
    }
    
    console.log(`📊 Se encontraron ${products.length} productos para generar historial`);
    
    // 2. Obtener algunos usuarios administradores para registrar cambios
    const admins = await prisma.user.findMany({
      where: { userType: 'ADMIN' },
      take: 3
    });
    
    // Si no hay administradores, crear uno
    if (admins.length === 0) {
      const admin = await prisma.user.create({
        data: {
          username: 'admin1',
          email: 'admin1@example.com',
          passwordHash: '$2a$10$dPzR0sOJw.nMzMj3xQYLteJrEAFCQVnlhFgKGPrUf2VJTI28YkH9q', // 'password123'
          firstName: 'Admin',
          lastName: 'Sistema',
          userType: 'ADMIN',
          isActive: true
        }
      });
      
      admins.push(admin);
      console.log('✅ Usuario administrador creado para registrar cambios');
    }
    
    // 3. Para cada producto, generar historial de cambios
    let totalHistoryRecords = 0;
    
    console.log('📝 Generando registros de historial...');
    
    for (const product of products) {
      // Determinar el precio actual del producto
      let productPrice = 5000; // Valor predeterminado
      if (typeof product === 'object' && product !== null) {
        if ('basePrice' in product && typeof product.basePrice === 'number') {
          productPrice = product.basePrice;
        }
      }
      
      // Crear registro inicial (CREATE)
      await prisma.productHistory.create({
        data: {
          product: {
            connect: { id: product.id }
          },
          user: {
            connect: { id: product.sellerId }
          },
          changeType: ChangeType.CREATE,
          timestamp: new Date(Date.now() - HISTORY_DAYS_BACK * 24 * 60 * 60 * 1000), // Hace HISTORY_DAYS_BACK días
          additionalInfo: {
            initialPrice: productPrice,
            initialStock: product.stockQuantity,
            category: product.category?.name || 'Sin categoría'
          }
        }
      });
      
      totalHistoryRecords++;
      
      // Generar cambios de precio a lo largo del tiempo
      await generatePriceChanges(product, productPrice);
      
      // Generar cambios de stock
      await generateStockChanges(product);
      
      // Ocasionalmente generar cambios de descripción
      if (Math.random() < DESCRIPTION_CHANGE_FREQUENCY) {
        await generateDescriptionChange(product, admins);
        totalHistoryRecords++;
      }
      
      console.log(`✅ Historial generado para: ${product.name}`);
    }
    
    console.log(`🎉 Seeder finalizado. Se crearon ${totalHistoryRecords} registros de historial.`);
  } catch (error) {
    console.error('❌ Error en el seeder de historial:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para generar cambios de precio para un producto
async function generatePriceChanges(product: any, initialPrice: number) {
  // Número de cambios de precio a generar (entre 3 y 8)
  const numChanges = Math.floor(Math.random() * 6) + 3;
  
  // Determinar qué campo de precio usar
  const priceField = 'basePrice';
  
  // Precio inicial y actual
  let currentPrice = initialPrice;
  
  // Distribuir los cambios a lo largo del período
  for (let i = 0; i < numChanges; i++) {
    // Solo si cumple con la frecuencia configurada
    if (Math.random() > PRICE_CHANGE_FREQUENCY) continue;
    
    // Calcular días aleatorios en el pasado (evitando que sean exactamente los mismos)
    const daysAgo = Math.floor(Math.random() * (HISTORY_DAYS_BACK - 1)) + 1;
    const changeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Generar nuevo precio (variación entre -15% y +20%)
    const priceVariation = (Math.random() * 0.35) - 0.15;
    const oldPrice = currentPrice;
    const newPrice = Math.max(oldPrice * (1 + priceVariation), oldPrice * 0.5); // Evitar que baje más del 50%
    currentPrice = parseFloat(newPrice.toFixed(2));
    
    // Crear registro de cambio de precio
    await prisma.productHistory.create({
      data: {
        product: {
          connect: { id: product.id }
        },
        user: {
          connect: { id: product.sellerId }
        },
        changeType: ChangeType.UPDATE,
        changeField: priceField,
        oldValue: oldPrice.toString(),
        newValue: currentPrice.toString(),
        timestamp: changeDate,
        additionalInfo: {
          reason: getPriceChangeReason(oldPrice, currentPrice),
          percentChange: ((currentPrice - oldPrice) / oldPrice * 100).toFixed(2)
        }
      }
    });
  }
  
  // Actualizar el precio final del producto en la base de datos
  await prisma.product.update({
    where: { id: product.id },
    data: { basePrice: currentPrice }
  });
}

// Función para generar cambios de stock para un producto
async function generateStockChanges(product: any) {
  // Número de cambios de stock a generar (entre 5 y 12)
  const numChanges = Math.floor(Math.random() * 8) + 5;
  
  // Stock actual
  let currentStock = product.stockQuantity;
  
  // Distribuir los cambios a lo largo del período
  for (let i = 0; i < numChanges; i++) {
    // Solo si cumple con la frecuencia configurada
    if (Math.random() > STOCK_CHANGE_FREQUENCY) continue;
    
    // Calcular días aleatorios en el pasado
    const daysAgo = Math.floor(Math.random() * (HISTORY_DAYS_BACK - 1)) + 1;
    const changeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    // Generar cambio de stock (ventas o reposición)
    const isDecrease = Math.random() < 0.7; // 70% probabilidad de que sea una venta
    const oldStock = currentStock;
    
    if (isDecrease) {
      // Venta: disminuye entre 1 y 30% del stock
      const decrease = Math.max(1, Math.floor(currentStock * (Math.random() * 0.3)));
      currentStock = Math.max(0, currentStock - decrease);
    } else {
      // Reposición: aumenta entre 10 y 100 unidades
      const increase = Math.floor(Math.random() * 91) + 10;
      currentStock += increase;
    }
    
    // Crear registro de cambio de stock
    await prisma.productHistory.create({
      data: {
        product: {
          connect: { id: product.id }
        },
        user: {
          connect: { id: product.sellerId }
        },
        changeType: ChangeType.UPDATE,
        changeField: 'stockQuantity',
        oldValue: oldStock.toString(),
        newValue: currentStock.toString(),
        timestamp: changeDate,
        additionalInfo: {
          reason: isDecrease ? 'Venta de producto' : 'Reposición de inventario',
          change: isDecrease ? -(oldStock - currentStock) : (currentStock - oldStock)
        }
      }
    });
  }
  
  // Actualizar el stock final del producto en la base de datos
  await prisma.product.update({
    where: { id: product.id },
    data: { stockQuantity: currentStock }
  });
}

// Función para generar un cambio de descripción
async function generateDescriptionChange(product: any, admins: any[]) {
  // Calcular una fecha aleatoria en el pasado
  const daysAgo = Math.floor(Math.random() * (HISTORY_DAYS_BACK / 2));
  const changeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Seleccionar un administrador aleatorio o el vendedor
  const changeUser = Math.random() < 0.5 && admins.length > 0 
    ? admins[Math.floor(Math.random() * admins.length)] 
    : { id: product.sellerId };
  
  // Generar nueva descripción añadiendo texto adicional
  const oldDescription = product.description;
  const additions = [
    ' Producto de alta calidad.',
    ' Cultivado usando técnicas sostenibles.',
    ' Cosecha seleccionada.',
    ' Ideal para consumo directo o recetas gourmet.',
    ' Entrega rápida garantizada.'
  ];
  
  const newDescription = oldDescription + additions[Math.floor(Math.random() * additions.length)];
  
  // Crear registro de cambio
  await prisma.productHistory.create({
    data: {
      product: {
        connect: { id: product.id }
      },
      user: {
        connect: { id: changeUser.id }
      },
      changeType: ChangeType.UPDATE,
      changeField: 'description',
      oldValue: oldDescription,
      newValue: newDescription,
      timestamp: changeDate,
      additionalInfo: {
        reason: 'Mejora de descripción',
        updatedBy: changeUser.id === product.sellerId ? 'seller' : 'admin'
      }
    }
  });
  
  // Actualizar la descripción en la base de datos
  await prisma.product.update({
    where: { id: product.id },
    data: { description: newDescription }
  });
}

// Función para determinar la razón del cambio de precio
function getPriceChangeReason(oldPrice: number, newPrice: number): string {
  const percentChange = ((newPrice - oldPrice) / oldPrice) * 100;
  
  if (percentChange > 15) {
    return 'Aumento significativo debido a escasez estacional';
  } else if (percentChange > 5) {
    return 'Ajuste por aumento en costos de producción';
  } else if (percentChange > 0) {
    return 'Actualización regular de precio';
  } else if (percentChange > -10) {
    return 'Ajuste por mayor oferta en el mercado';
  } else {
    return 'Reducción temporal para impulsar ventas';
  }
}

// Ejecutar la función principal
main()
  .then(() => console.log('✅ Seeder de historial de productos completado'))
  .catch(e => console.error('💥 Error en seeder de historial de productos:', e)); 