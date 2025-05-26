import pino from 'pino';

// Configuración del logger para entorno de desarrollo
const devConfig = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
  level: 'debug',
};

// Configuración del logger para entorno de producción
const prodConfig = {
  level: 'info',
};

// Seleccionar configuración según el entorno
const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;

// Crear y exportar la instancia del logger
export const logger = pino(config);
