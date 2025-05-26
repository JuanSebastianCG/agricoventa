import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Configuración del seeder
const PRODUCTS_PER_CATEGORY = 5; // Cuántos productos generar por categoría
const TOTAL_USERS = 10; // Cuántos usuarios vendedores crear o usar

// Datos de ejemplo para productos
const fruitNames = [
  'Manzana Orgánica', 'Banano Premium', 'Naranja Valencia', 'Limón Tahití', 'Piña Golden', 
  'Mango Tommy', 'Fresas Frescas', 'Aguacate Hass', 'Papaya Hawaiana', 'Uvas Rojas',
  'Mandarina Clementina', 'Pera Anjou', 'Sandía Sin Semilla', 'Melón Cantaloupe', 'Durazno Amarillo'
];

const vegetableNames = [
  'Tomate Chonto', 'Cebolla Blanca', 'Zanahoria Premium', 'Lechuga Verde', 'Papa Sabanera',
  'Brócoli Orgánico', 'Pepino Cohombro', 'Ajo Fresco', 'Espinaca Baby', 'Pimentón Rojo',
  'Apio Verde', 'Calabacín', 'Coliflor Blanca', 'Remolacha', 'Habichuela Fina'
];

const grainNames = [
  'Arroz Integral', 'Frijol Bola Roja', 'Lenteja Premium', 'Garbanzo Extra Grande', 'Maíz Tierno',
  'Trigo Orgánico', 'Quinoa Blanca', 'Avena en Hojuelas', 'Arvejas Verdes', 'Cebada Perlada',
  'Amaranto Orgánico', 'Frijol Negro', 'Arroz Basmati', 'Chía Orgánica', 'Mijo Dorado'
];

const coffeeNames = [
  'Café Colombiano Premium', 'Café Arábigo', 'Cacao Fino de Aroma', 'Café Bourbon Rojo', 'Chocolate Negro 70%',
  'Café Orgánico', 'Café Descafeinado', 'Nibs de Cacao', 'Café Verde', 'Cacao en Polvo',
  'Café Especial de Altura', 'Chocolate para Mesa', 'Café Molido Suave', 'Café Honey Process', 'Granos de Café Tostado'
];

const dairyNames = [
  'Queso Campesino', 'Leche Fresca de Vaca', 'Yogurt Natural', 'Queso Doble Crema', 'Cuajada Fresca',
  'Mantequilla Artesanal', 'Queso Costeño', 'Arequipe Tradicional', 'Kumis Casero', 'Suero Costeño',
  'Queso Mozzarella Fresco', 'Yogurt de Frutas', 'Crema de Leche', 'Leche de Cabra', 'Queso Paipa'
];

const herbNames = [
  'Cilantro Fresco', 'Albahaca Orgánica', 'Menta Fresca', 'Romero de Campo', 'Orégano Seco',
  'Tomillo Fresco', 'Perejil Crespo', 'Cebollín Verde', 'Laurel Seco', 'Hierbabuena',
  'Estragón Fresco', 'Eneldo Verde', 'Ruda Aromática', 'Mejorana Seca', 'Salvia Fresca'
];

const honeyNames = [
  'Miel Pura de Abejas', 'Propóleo Natural', 'Polen de Abejas', 'Miel de Flores Silvestres', 'Jalea Real',
  'Miel Cremada', 'Miel Orgánica', 'Cera de Abejas', 'Miel Monofloral', 'Apitoxina Pura',
  'Miel con Panal', 'Miel de Azahar', 'Miel de Bosque', 'Miel de Eucalipto', 'Miel de Lavanda'
];

// Regiones de Colombia
const regions = [
  'Antioquia', 'Valle del Cauca', 'Cundinamarca', 'Santander', 'Boyacá', 
  'Nariño', 'Caldas', 'Risaralda', 'Quindío', 'Huila',
  'Tolima', 'Cauca', 'Meta', 'Bolívar', 'Atlántico'
];

// Unidades de medida según categoría
const unitMeasures = {
  Frutas: ['kg', 'lb', 'unidad', 'canasta'],
  Verduras: ['kg', 'lb', 'atado', 'bulto'],
  Granos: ['kg', 'lb', 'arroba', 'bulto'],
  'Café y Cacao': ['kg', 'lb', 'arroba', 'saco'],
  Lácteos: ['litro', 'kg', 'unidad', 'botella'],
  'Hierbas y Especias': ['atado', 'gr', 'kg', 'manojo'],
  'Miel y Derivados': ['litro', 'ml', 'kg', 'frasco']
};

// Descripciones de productos según categoría
const descriptions = {
  Frutas: [
    'Fruta fresca cultivada sin químicos, ideal para consumo directo o jugos.',
    'Cosechada en su punto óptimo de maduración para garantizar el mejor sabor.',
    'Producto local de alta calidad, cultivado por pequeños agricultores.',
    'Variedad premium con excelente sabor y textura, perfecta para ensaladas.',
    'Fruta dulce y jugosa, rica en vitaminas y minerales esenciales.'
  ],
  Verduras: [
    'Verdura fresca recién cosechada, ideal para ensaladas y guisos.',
    'Cultivada con métodos sostenibles, sin pesticidas ni químicos dañinos.',
    'Producto de temporada con el mejor sabor y nutrientes intactos.',
    'Variedad premium seleccionada por su calidad y frescura excepcional.',
    'Verdura orgánica certificada, cultivada por agricultores familiares.'
  ],
  Granos: [
    'Granos seleccionados de la mejor calidad, limpios y listos para cocinar.',
    'Producto orgánico cultivado con métodos tradicionales y sostenibles.',
    'Cosecha reciente con excelente textura y sabor al cocinar.',
    'Granos premium con alto valor nutricional y proteico.',
    'Selección especial de granos enteros, sin procesar ni refinar.'
  ],
  'Café y Cacao': [
    'Café de altura cultivado bajo sombra, con notas frutales y acidez balanceada.',
    'Granos seleccionados manualmente para garantizar la mejor calidad.',
    'Producto de origen único con características organolépticas excepcionales.',
    'Cacao fino de aroma cultivado con métodos tradicionales.',
    'Tueste medio que resalta las mejores cualidades aromáticas del grano.'
  ],
  Lácteos: [
    'Producto lácteo artesanal elaborado con leche de vacas alimentadas con pasto.',
    'Elaborado siguiendo recetas tradicionales transmitidas por generaciones.',
    'Lácteo fresco sin conservantes ni aditivos artificiales.',
    'Producido en pequeña escala por familias dedicadas a la ganadería sostenible.',
    'Sabor auténtico y textura inigualable gracias a métodos artesanales de elaboración.'
  ],
  'Hierbas y Especias': [
    'Hierbas aromáticas frescas cultivadas sin pesticidas ni químicos.',
    'Cosechadas en su punto óptimo para preservar aceites esenciales y aroma.',
    'Especias secadas naturalmente que conservan todo su sabor y propiedades.',
    'Producto artesanal de pequeños agricultores especializados en aromáticas.',
    'Hierbas frescas con intenso aroma y sabor para realzar cualquier platillo.'
  ],
  'Miel y Derivados': [
    'Miel pura sin pasteurizar, conservando todas sus propiedades naturales.',
    'Producto apícola de colmenas ubicadas en zonas libres de contaminación.',
    'Miel cruda extraída en frío para preservar enzimas y nutrientes.',
    'Derivado apícola 100% natural, sin aditivos ni conservantes.',
    'Miel monofloral con características únicas de sabor y aroma.'
  ]
};

// Función para generar un precio aleatorio en un rango
const randomPrice = (min: number, max: number): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

// Función para obtener nombres de productos según la categoría
const getProductNames = (categoryName: string): string[] => {
  if (categoryName.includes('Fruta')) return fruitNames;
  if (categoryName.includes('Verdura')) return vegetableNames;
  if (categoryName.includes('Grano')) return grainNames;
  if (categoryName.includes('Café') || categoryName.includes('Cacao')) return coffeeNames;
  if (categoryName.includes('Lácteo')) return dairyNames;
  if (categoryName.includes('Hierba') || categoryName.includes('Especia')) return herbNames;
  if (categoryName.includes('Miel')) return honeyNames;
  
  // Valor por defecto
  return [
    ...fruitNames.slice(0, 3), 
    ...vegetableNames.slice(0, 3), 
    ...grainNames.slice(0, 3), 
    ...dairyNames.slice(0, 3)
  ];
};

// Función para obtener unidades de medida según la categoría
const getUnitMeasures = (categoryName: string): string[] => {
  for (const key in unitMeasures) {
    if (categoryName.includes(key)) {
      return unitMeasures[key as keyof typeof unitMeasures];
    }
  }
  return ['kg', 'unidad']; // Por defecto
};

// Función para obtener descripciones según la categoría
const getDescriptions = (categoryName: string): string[] => {
  for (const key in descriptions) {
    if (categoryName.includes(key)) {
      return descriptions[key as keyof typeof descriptions];
    }
  }
  return descriptions.Frutas; // Por defecto
};

// Función principal
async function main() {
  try {
    console.log('🌱 Iniciando seeder de productos...');

    // 1. Obtener o crear usuarios vendedores
    console.log('👤 Verificando usuarios vendedores...');
    
    let sellers = await prisma.user.findMany({
      where: { userType: 'SELLER' },
      take: TOTAL_USERS
    });
    
    // Si no hay suficientes vendedores, crear nuevos
    if (sellers.length < TOTAL_USERS) {
      console.log(`Creando ${TOTAL_USERS - sellers.length} nuevos vendedores...`);
      
      for (let i = sellers.length; i < TOTAL_USERS; i++) {
        const newSeller = await prisma.user.create({
          data: {
            username: `seller${i + 1}`,
            email: `seller${i + 1}@example.com`,
            passwordHash: '$2a$10$dPzR0sOJw.nMzMj3xQYLteJrEAFCQVnlhFgKGPrUf2VJTI28YkH9q', // 'password123'
            firstName: `Vendedor${i + 1}`,
            lastName: `Apellido${i + 1}`,
            userType: 'SELLER',
            isActive: true,
            phoneNumber: `300${Math.floor(1000000 + Math.random() * 9000000)}` // Generate unique 10-digit phone number
          }
        });
        
        sellers.push(newSeller);
      }
      
      console.log('✅ Vendedores creados correctamente');
    }
    
    // 2. Obtener categorías
    console.log('📂 Obteniendo categorías...');
    const categories = await prisma.category.findMany();
    
    if (categories.length === 0) {
      console.log('❌ No hay categorías en la base de datos. Ejecute primero el seeder de categorías.');
      return;
    }
    
    console.log(`📊 Se encontraron ${categories.length} categorías`);
    
    // 3. Crear ubicaciones para los vendedores si no existen
    console.log('🗺️ Verificando ubicaciones de vendedores...');
    
    for (const seller of sellers) {
      const existingLocation = await prisma.location.findFirst({
        where: { 
          users: {
            some: {
              id: seller.id
            }
          }
        }
      });
      
      if (!existingLocation) {
        const region = regions[Math.floor(Math.random() * regions.length)];
        await prisma.location.create({
          data: {
            users: {
              connect: { id: seller.id }
            },
            addressLine1: `Finca El Paraíso`,
            city: region,
            department: region,
            country: 'Colombia',
            postalCode: '00000'
          }
        });
      }
    }
    
    console.log('✅ Ubicaciones de vendedores verificadas');
    
    // 4. Crear productos para cada categoría
    console.log('🥕 Creando productos...');
    
    let createdProducts = 0;
    
    for (const category of categories) {
      // Obtener la ubicación del vendedor para este producto
      const productNames = getProductNames(category.name);
      const unitMeasureOptions = getUnitMeasures(category.name);
      const descriptionOptions = getDescriptions(category.name);
      
      for (let i = 0; i < PRODUCTS_PER_CATEGORY; i++) {
        // Elegir un vendedor aleatorio
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        
        // Obtener una ubicación del vendedor
        const sellerLocation = await prisma.location.findFirst({
          where: { 
            users: {
              some: {
                id: seller.id
              }
            }
          }
        });
        
        if (!sellerLocation) {
          console.log(`⚠️ Vendedor ${seller.username} no tiene ubicación. Saltando...`);
          continue;
        }
        
        // Elegir nombre aleatorio del producto que no se haya usado antes
        const productName = productNames[Math.floor(Math.random() * productNames.length)];
        
        // Datos del producto
        const unitMeasure = unitMeasureOptions[Math.floor(Math.random() * unitMeasureOptions.length)];
        const description = descriptionOptions[Math.floor(Math.random() * descriptionOptions.length)];
        const price = randomPrice(1000, 50000); // Precios entre 1.000 y 50.000 COP
        const stockQuantity = Math.floor(Math.random() * 100) + 10; // Entre 10 y 110 unidades
        
        try {
          // Crear el producto
          const product = await prisma.product.create({
            data: {
              name: productName,
              description: description,
              basePrice: price,
              stockQuantity: stockQuantity,
              unitMeasure: unitMeasure,
              isActive: true,
              isFeatured: Math.random() > 0.7, // 30% de probabilidad de ser destacado
              seller: {
                connect: { id: seller.id }
              },
              category: {
                connect: { id: category.id }
              },
              originLocation: {
                connect: { id: sellerLocation.id }
              }
            }
          });
          
          createdProducts++;
          
          // Crear imágenes para el producto
          await createProductImage(product.id, category.name);
          
          console.log(`✅ Producto creado: ${product.name} ($${product.basePrice}) - Categoría: ${category.name}`);
        } catch (error) {
          console.error(`❌ Error al crear producto en categoría ${category.name}:`, error);
        }
      }
    }
    
    console.log(`🎉 Seeder finalizado. Se crearon ${createdProducts} productos.`);
  } catch (error) {
    console.error('❌ Error en el seeder de productos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para crear una imagen de producto
async function createProductImage(productId: string, categoryName: string) {
  try {
    // Determinar qué tipo de imagen usar según la categoría
    let imagePath = '';
    
    if (categoryName.includes('Fruta')) {
      imagePath = 'fruits.jpg';
    } else if (categoryName.includes('Verdura')) {
      imagePath = 'vegetables.jpg';
    } else if (categoryName.includes('Grano')) {
      imagePath = 'grains.jpg';
    } else if (categoryName.includes('Café') || categoryName.includes('Cacao')) {
      imagePath = 'coffee.jpg';
    } else if (categoryName.includes('Lácteo')) {
      imagePath = 'dairy.jpg';
    } else if (categoryName.includes('Hierba') || categoryName.includes('Especia')) {
      imagePath = 'herbs.jpg';
    } else if (categoryName.includes('Miel')) {
      imagePath = 'honey.jpg';
    } else {
      imagePath = 'default.jpg';
    }
    
    // Crear la imagen en la base de datos
    await prisma.productImage.create({
      data: {
        product: {
          connect: { id: productId }
        },
        imageUrl: `/uploads/products/${imagePath}`,
        altText: `Imagen de producto`,
        isPrimary: true,
        displayOrder: 1
      }
    });
    
    // También podemos agregar una imagen secundaria ocasionalmente
    if (Math.random() > 0.7) {
      await prisma.productImage.create({
        data: {
          product: {
            connect: { id: productId }
          },
          imageUrl: `/uploads/products/additional.jpg`,
          altText: `Imagen adicional`,
          isPrimary: false,
          displayOrder: 2
        }
      });
    }
  } catch (error) {
    console.error(`❌ Error al crear imagen para producto ${productId}:`, error);
  }
}

// Ejecutar la función principal
main()
  .then(() => console.log('✅ Seeder de productos completado'))
  .catch(e => console.error('💥 Error en seeder de productos:', e)); 