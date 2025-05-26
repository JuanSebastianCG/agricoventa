import api from './api';

export interface WeatherAlert {
  id: string;
  type: string;
  region: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  icon: string;
  startDate: string;
  endDate: string;
}

export interface FarmingTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  categoryId?: string;
  categoryName?: string;
  region?: string;
}

export interface MarketForecast {
  type: 'supply' | 'demand' | 'price';
  status: string;
  description: string;
  value: string;
  trend: number;
  icon: string;
  categoryId?: string;
  categoryName?: string;
}

export interface InsightData {
  weatherAlerts: WeatherAlert[];
  farmingTips: FarmingTip[];
  marketForecasts: MarketForecast[];
}

class InsightService {
  /**
   * Obtiene todas las alertas de clima disponibles
   * @param region Filtrar por región
   * @returns Lista de alertas climáticas
   */
  async getWeatherAlerts(region?: string): Promise<WeatherAlert[]> {
    try {
      // Simulación de datos de alerta climática
      // En un sistema real, esto haría una petición a la API
      
      return [
        { 
          id: '1',
          type: 'Alerta de Inundación', 
          region: 'Casanare', 
          message: 'Se esperan fuertes lluvias en las próximas 60 horas. Asegure sus cultivos y prepare sistemas de drenaje adecuados para evitar pérdidas.',
          severity: 'medium',
          icon: 'rain',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        { 
          id: '2',
          type: 'Ola de Calor', 
          region: 'Antioquia', 
          message: 'Se pronostican temperaturas extremas de hasta 38°C. Aumente la frecuencia de riego y proporcione sombra a los cultivos sensibles, especialmente en horas pico.',
          severity: 'high',
          icon: 'sun',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          type: 'Alerta de Heladas',
          region: 'Boyacá',
          message: 'Se esperan temperaturas nocturnas por debajo de 0°C en zonas altas. Proteja cultivos sensibles con coberturas y evite el riego en horas de la tarde para prevenir daños.',
          severity: 'medium',
          icon: 'snow',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          type: 'Alerta de Sequía',
          region: 'La Guajira',
          message: 'Se pronostica período prolongado de sequía. Implemente estrategias de conservación de agua como riego por goteo y mulching. Priorice cultivos resistentes a la sequía.',
          severity: 'high',
          icon: 'drought',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }
      ].filter(alert => !region || alert.region === region);
    } catch (error) {
      console.error('Error obteniendo alertas climáticas:', error);
      return [];
    }
  }
  
  /**
   * Obtiene consejos agrícolas
   * @param categoryId Filtrar por categoría
   * @returns Lista de consejos agrícolas
   */
  async getFarmingTips(categoryId?: string): Promise<FarmingTip[]> {
    try {
      // Simulación de datos de consejos agrícolas
      
      return [
        {
          id: '1',
          title: 'Tiempo ideal de siembra',
          description: 'Condiciones perfectas para la siembra de aguacate Hass en la región de Antioquia esta semana. Aproveche la humedad del suelo y temperaturas moderadas.',
          icon: 'seed',
          categoryId: 'avocado-category',
          categoryName: 'Aguacates',
          region: 'Antioquia'
        },
        {
          id: '2',
          title: 'Optimización de riego',
          description: 'Reduzca la frecuencia de riego para plantas de café debido a las lluvias esperadas en Huila. Ajuste sistemas de drenaje para evitar encharcamiento en la zona radicular.',
          icon: 'water',
          categoryId: 'coffee-category',
          categoryName: 'Café',
          region: 'Huila'
        },
        {
          id: '3',
          title: 'Control biológico de plagas',
          description: 'Mayor riesgo de infestación de áfidos en cultivos de tomate. Aplique extracto de ajo y chile como repelente natural o libere mariquitas como control biológico.',
          icon: 'bug',
          categoryId: 'tomato-category',
          categoryName: 'Tomates',
          region: 'Valle del Cauca'
        },
        {
          id: '4',
          title: 'Corrección de acidez del suelo',
          description: 'Momento ideal para aplicar cal agrícola a suelos ácidos antes del inicio de la temporada de lluvias. Use 2-3 toneladas/hectárea según análisis de suelo.',
          icon: 'soil',
          categoryId: 'general',
          categoryName: 'General',
          region: 'Nacional'
        }
      ].filter(tip => !categoryId || tip.categoryId === categoryId);
    } catch (error) {
      console.error('Error obteniendo consejos agrícolas:', error);
      return [];
    }
  }
  
  /**
   * Obtiene pronósticos del mercado
   * @param categoryId Filtrar por categoría
   * @returns Lista de pronósticos de mercado
   */
  async getMarketForecasts(categoryId?: string): Promise<MarketForecast[]> {
    try {
      // Simulación de datos de pronóstico de mercado
      
      return [
        {
          type: 'supply',
          status: 'Excedente',
          description: 'Sobreproducción de café prevista para Q2 2025 debido a condiciones climáticas favorables en zonas cafeteras',
          value: '+15%',
          trend: 15,
          icon: 'chart-up',
          categoryId: 'coffee-category',
          categoryName: 'Café'
        },
        {
          type: 'demand',
          status: 'Crecimiento',
          description: 'Aumento en demanda de verduras orgánicas en mercados urbanos, +15% vs mes anterior',
          value: '+15%',
          trend: 15,
          icon: 'users',
          categoryId: 'vegetables-category',
          categoryName: 'Verduras'
        },
        {
          type: 'price',
          status: 'Estable',
          description: 'Precios de frutas mantendrán estabilidad en próximos 30 días según tendencias históricas',
          value: '0%',
          trend: 0,
          icon: 'tag',
          categoryId: 'fruit-category',
          categoryName: 'Frutas'
        },
        {
          type: 'price',
          status: 'Descenso',
          description: 'Se espera reducción en precios de granos por importaciones y buena cosecha local',
          value: '-5%',
          trend: -5,
          icon: 'chart-down',
          categoryId: 'grain-category',
          categoryName: 'Granos'
        }
      ].filter(forecast => !categoryId || forecast.categoryId === categoryId);
    } catch (error) {
      console.error('Error obteniendo pronósticos de mercado:', error);
      return [];
    }
  }
  
  /**
   * Obtiene todos los datos de insights
   * @returns Todos los datos de insights
   */
  async getAllInsightData(): Promise<InsightData> {
    try {
      // Obtenemos todos los datos de insights en paralelo
      const [weatherAlerts, farmingTips, marketForecasts] = await Promise.all([
        this.getWeatherAlerts(),
        this.getFarmingTips(),
        this.getMarketForecasts()
      ]);
      
      return {
        weatherAlerts,
        farmingTips,
        marketForecasts
      };
    } catch (error) {
      console.error('Error obteniendo datos de insights:', error);
      return {
        weatherAlerts: [],
        farmingTips: [],
        marketForecasts: []
      };
    }
  }
}

export default new InsightService(); 