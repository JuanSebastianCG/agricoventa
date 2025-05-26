import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categorías y subcategorías de productos agrícolas
const categories = [
  {
    name: 'Frutas',
    description: 'Frutas frescas de todas las variedades',
    children: [
      {
        name: 'Frutas Tropicales',
        description: 'Frutas cultivadas en climas tropicales como banano, piña, mango, etc.'
      },
      {
        name: 'Cítricos',
        description: 'Frutas ácidas como naranja, limón, mandarina y pomelo'
      },
      {
        name: 'Frutos Rojos',
        description: 'Fresas, frambuesas, moras y otras frutas pequeñas'
      },
      {
        name: 'Frutas de Hueso',
        description: 'Melocotón, ciruela, cereza y otras frutas con hueso grande'
      }
    ]
  },
  {
    name: 'Verduras',
    description: 'Verduras y hortalizas frescas',
    children: [
      {
        name: 'Verduras de Hoja',
        description: 'Lechuga, espinaca, acelga y otras verduras de hoja verde'
      },
      {
        name: 'Crucíferas',
        description: 'Brócoli, coliflor, col y otras verduras de la familia de las crucíferas'
      },
      {
        name: 'Tubérculos',
        description: 'Papa, yuca, batata y otros tubérculos'
      },
      {
        name: 'Vegetales de Fruto',
        description: 'Tomate, pimiento, berenjena y otros vegetales que son frutos botánicamente'
      }
    ]
  },
  {
    name: 'Granos',
    description: 'Cereales, legumbres y semillas',
    children: [
      {
        name: 'Cereales',
        description: 'Maíz, trigo, arroz, cebada, avena y otros cereales'
      },
      {
        name: 'Legumbres',
        description: 'Frijoles, lentejas, garbanzos y otras legumbres'
      },
      {
        name: 'Semillas',
        description: 'Semillas de chía, quinoa, amaranto y otras semillas comestibles'
      }
    ]
  },
  {
    name: 'Café y Cacao',
    description: 'Granos de café y cacao en diferentes presentaciones',
    children: [
      {
        name: 'Café',
        description: 'Granos de café verde, tostado, molido y en diferentes variedades'
      },
      {
        name: 'Cacao',
        description: 'Granos de cacao, chocolate y productos derivados'
      }
    ]
  },
  {
    name: 'Lácteos',
    description: 'Leche y productos lácteos de origen agrícola',
    children: [
      {
        name: 'Leche',
        description: 'Leche fresca de vaca, cabra y otros animales'
      },
      {
        name: 'Quesos',
        description: 'Quesos frescos y madurados de producción agrícola'
      },
      {
        name: 'Yogurt',
        description: 'Yogurt natural y de frutas de producción artesanal'
      }
    ]
  },
  {
    name: 'Hierbas y Especias',
    description: 'Hierbas aromáticas y especias',
    children: [
      {
        name: 'Hierbas Aromáticas',
        description: 'Albahaca, cilantro, menta, romero y otras hierbas frescas'
      },
      {
        name: 'Especias',
        description: 'Pimienta, canela, comino, cúrcuma y otras especias'
      }
    ]
  },
  {
    name: 'Miel y Derivados',
    description: 'Miel y productos apícolas',
    children: [
      {
        name: 'Miel',
        description: 'Miel pura de diferentes floraciones'
      },
      {
        name: 'Propóleo',
        description: 'Propóleo y productos derivados'
      },
      {
        name: 'Polen',
        description: 'Polen de abeja y derivados'
      }
    ]
  }
];

async function main() {
  try {
    console.log('🌱 Iniciando seeder de categorías...');
    
    // Eliminar categorías existentes de manera segura
    console.log('🗑️ Eliminando categorías existentes...');
    
    try {
      // Método simple: intentar primero actualizar parentId a null
      console.log('Actualizando referencias de parentId a null...');
      await prisma.category.updateMany({
        data: {
          parentId: null
        }
      });
      
      // Luego eliminar todas las categorías
      console.log('Eliminando todas las categorías...');
      await prisma.category.deleteMany({});
      console.log('Categorías eliminadas correctamente.');
    } catch (error) {
      console.log('No se pudieron eliminar categorías existentes. Continuando con la creación...');
      console.error('Error detallado:', error);
    }
    
    console.log('📝 Creando nuevas categorías...');
    
    // Crear categorías principales
    for (const category of categories) {
      const parentCategory = await prisma.category.create({
        data: {
          name: category.name,
          description: category.description
        }
      });
      
      console.log(`✅ Categoría principal creada: ${parentCategory.name}`);
      
      // Crear subcategorías
      if (category.children && category.children.length > 0) {
        for (const child of category.children) {
          const subCategory = await prisma.category.create({
            data: {
              name: child.name,
              description: child.description,
              parentId: parentCategory.id
            }
          });
          
          console.log(`  ↪ Subcategoría creada: ${subCategory.name}`);
        }
      }
    }
    
    console.log('✨ Todas las categorías han sido creadas');
  } catch (error) {
    console.error('❌ Error creando categorías:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('✅ Seeder de categorías completado'))
  .catch(e => console.error('💥 Error en seeder de categorías:', e)); 