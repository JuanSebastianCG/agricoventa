import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agricoventas API',
      version,
      description: 'API para la gestión de Agricoventas',
      contact: {
        name: 'Agricoventas',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.agricoventas.com',
        description: 'Servidor de producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Los esquemas se definen en types/swagger.types.ts
      },
      responses: {
        UnauthorizedError: {
          description: 'No autenticado. El token no es válido o ha expirado.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'No autorizado. No tienes permisos para acceder a este recurso.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación. Los datos proporcionados no son válidos.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Auth', description: 'Operaciones de autenticación y gestión de usuarios' },
      { name: 'Users', description: 'Operaciones de gestión de usuarios' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/types/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
