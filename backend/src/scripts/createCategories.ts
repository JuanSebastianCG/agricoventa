import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// Estructura de categorías agrícolas
const categories = [
  // Categorías principales
  {
    name: 'Frutas',
    description: 'Todo tipo de frutas frescas',
    children: [
      {
        name: 'Cítricos',
        description: 'Frutas cítricas como limón, naranja, mandarina',
        children: [
          { name: 'Naranja', description: 'Naranjas frescas' },
          { name: 'Limón', description: 'Limones frescos' },
          { name: 'Mandarina', description: 'Mandarinas frescas' }
        ]
      },
      {
        name: 'Tropicales',
        description: 'Frutas tropicales como piña, mango, papaya',
        children: [
          { name: 'Piña', description: 'Piñas frescas' },
          { name: 'Mango', description: 'Mangos frescos' },
          { name: 'Papaya', description: 'Papayas frescas' }
        ]
      },
      {
        name: 'Frutos Rojos',
        description: 'Fresas, moras, frambuesas',
        children: [
          { name: 'Fresa', description: 'Fresas frescas' },
          { name: 'Mora', description: 'Moras frescas' },
          { name: 'Frambuesa', description: 'Frambuesas frescas' }
        ]
      }
    ]
  },
  {
    name: 'Verduras',
    description: 'Todo tipo de verduras frescas',
    children: [
      {
        name: 'Hortalizas',
        description: 'Verduras como lechuga, espinaca, acelga',
        children: [
          { name: 'Lechuga', description: 'Lechugas frescas' },
          { name: 'Espinaca', description: 'Espinacas frescas' },
          { name: 'Acelga', description: 'Acelgas frescas' }
        ]
      },
      {
        name: 'Tubérculos',
        description: 'Tubérculos como papa, yuca, batata',
        children: [
          { name: 'Papa', description: 'Papas frescas' },
          { name: 'Yuca', description: 'Yucas frescas' },
          { name: 'Batata', description: 'Batatas frescas' }
        ]
      },
      {
        name: 'Raíces',
        description: 'Zanahorias, rábanos, remolacha',
        children: [
          { name: 'Zanahoria', description: 'Zanahorias frescas' },
          { name: 'Rábano', description: 'Rábanos frescos' },
          { name: 'Remolacha', description: 'Remolachas frescas' }
        ]
      }
    ]
  },
  {
    name: 'Granos',
    description: 'Todo tipo de granos',
    children: [
      {
        name: 'Cereales',
        description: 'Cereales como arroz, trigo, maíz',
        children: [
          { name: 'Arroz', description: 'Arroz de diferentes variedades' },
          { name: 'Trigo', description: 'Trigo en diferentes presentaciones' },
          { name: 'Maíz', description: 'Maíz fresco y seco' }
        ]
      },
      {
        name: 'Legumbres',
        description: 'Legumbres como frijol, lenteja, garbanzo',
        children: [
          { name: 'Frijol', description: 'Frijoles de diferentes variedades' },
          { name: 'Lenteja', description: 'Lentejas secas' },
          { name: 'Garbanzo', description: 'Garbanzos secos' }
        ]
      }
    ]
  },
  {
    name: 'Productos Especiales',
    description: 'Productos agrícolas especiales',
    children: [
      {
        name: 'Café',
        description: 'Variedades de café colombiano',
        children: [
          { name: 'Café Arábica', description: 'Café Arábica de alta calidad' },
          { name: 'Café Robusta', description: 'Café Robusta resistente' }
        ]
      },
      {
        name: 'Cacao',
        description: 'Variedades de cacao colombiano',
        children: [
          { name: 'Cacao Fino', description: 'Cacao fino de aroma' },
          { name: 'Cacao Criollo', description: 'Cacao Criollo de alta calidad' }
        ]
      }
    ]
  }
];

// Función para crear categorías de forma recursiva
async function createCategories(categoryList: any[], parentId: string | null = null) {
  for (const category of categoryList) {
    const { children, ...categoryData } = category;
    
    // Crear la categoría
    const createdCategory = await prisma.category.create({
      data: {
        ...categoryData,
        parentId
      }
    });
    
    logger.info(`Categoría creada: ${createdCategory.name} (ID: ${createdCategory.id})`);
    
    // Crear categorías hijas si existen
    if (children && children.length > 0) {
      await createCategories(children, createdCategory.id);
    }
  }
}

// Función principal
async function main() {
  try {
    logger.info('Iniciando creación de categorías...');
    
    // Verificar si ya existen categorías
    const existingCategories = await prisma.category.findMany();
    if (existingCategories.length > 0) {
      logger.info(`Ya existen ${existingCategories.length} categorías en la base de datos.`);
      
      // Preguntar si desea eliminar y recrear
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('¿Desea eliminar todas las categorías existentes y recrearlas? (s/n): ', async (answer: string) => {
        if (answer.toLowerCase() === 's') {
          // Eliminar todas las categorías existentes
          await prisma.category.deleteMany();
          logger.info('Categorías existentes eliminadas.');
          
          // Crear nuevas categorías
          await createCategories(categories);
          logger.info('Creación de categorías completada.');
        } else {
          logger.info('Operación cancelada.');
        }
        
        readline.close();
        await prisma.$disconnect();
      });
    } else {
      // No hay categorías existentes, crear nuevas
      await createCategories(categories);
      logger.info('Creación de categorías completada.');
      await prisma.$disconnect();
    }
  } catch (error) {
    logger.error('Error al crear categorías:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Ejecutar el script
main(); 