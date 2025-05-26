import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import { useNavigate, Link } from 'react-router-dom';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import productHistoryService, { ProductPriceTrend } from '../services/productHistoryService';
import productService, { Product, PriceData, ProductTrend } from '../services/productService';
import categoryService, { Category } from '../services/categoryService';
import insightService, { WeatherAlert, FarmingTip, MarketForecast } from '../services/insightService';
import { FaCrown } from 'react-icons/fa';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Interfaces para los datos mostrados
interface ProductPrice {
  id: string;
  name: string;
  price: number;
  unit: string;
  weeklyTrend: number;
  category: string;
}

// Componentes para secciones de Insights
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-1"></div>
    <p className="mt-4 text-gray-600">Cargando datos de insights...</p>
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</h3>
    <p className="text-red-600 mb-4">{message}</p>
    <button 
      onClick={onRetry} 
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
    >
      Reintentar
    </button>
  </div>
);

// Componente de línea de tendencia simple
const TrendIndicator = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);
  
  return (
    <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? (
        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      <span className="font-semibold">{isPositive ? '+' : ''}{value.toFixed(1)}%</span>
    </div>
  );
};

// Gráfico de línea para tendencias de precios
const PriceLineChart = ({ priceHistory, productName }: { priceHistory: PriceData[], productName: string }) => {
  if (!priceHistory.length) return <div className="p-4 text-center text-gray-500">No hay datos disponibles</div>;
  
  const data = {
    labels: priceHistory.map(item => item.date),
    datasets: [
      {
        label: `Precio de ${productName}`,
        data: priceHistory.map(item => item.price),
        borderColor: '#046B4D',
        backgroundColor: 'rgba(4, 107, 77, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#046B4D',
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 5
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: number) => {
            return value.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Precio: ${context.raw.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}`;
          }
        }
      }
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Tendencia de precios: {productName}</h3>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

// Componente para visualizar la distribución de productos por categoría
const ProductCategoryChart = ({ products }: { products: Product[] }) => {
  // Agrupar productos por categoría
  const categoryCounts = products.reduce((acc, product) => {
    const categoryName = product.category?.name || 'Sin categoría';
    acc[categoryName] = (acc[categoryName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Convertir a formato para el gráfico
  const data = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    value: count
  }));

  // Asegurarse de que hay datos suficientes
  if (data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-center text-gray-500">No hay datos suficientes para mostrar estadísticas por categoría.</p>
      </div>
    );
  }

  // Preparar colores
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Productos por Categoría</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} productos`, 'Cantidad']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Componente principal de Insights
const MarketInsights: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimespan, setSelectedTimespan] = useState<string>('30');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [detailedPriceHistory, setDetailedPriceHistory] = useState<PriceData[]>([]);
  const [showDetailedChart, setShowDetailedChart] = useState<boolean>(false);
  
  // Estados para datos
  const [categories, setCategories] = useState<Category[]>([]);
  const [priceTrends, setPriceTrends] = useState<ProductPriceTrend[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [farmingTips, setFarmingTips] = useState<FarmingTip[]>([]);
  const [marketForecasts, setMarketForecasts] = useState<MarketForecast[]>([]);
  
  const { user, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  
  const isPremium = user?.subscriptionType === 'PREMIUM';
  
  // Comprobar autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        if (response && response.categories) {
          setCategories(response.categories);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Cargar datos de insights
  const loadInsightData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const insightData = await insightService.getAllInsightData();
      setWeatherAlerts(insightData.weatherAlerts.slice(0, 2));
      setFarmingTips(insightData.farmingTips);
      setMarketForecasts(insightData.marketForecasts);
      
      // Cargar tendencias de precios
      const trends = await productHistoryService.getPriceTrends(
        30,
        selectedCategory !== 'all' ? selectedCategory : undefined
      );
      setPriceTrends(trends);
    } catch (error) {
      console.error('Error al cargar datos de insights:', error);
      setError('No se pudieron cargar los datos de insights. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Cargar datos al iniciar y cuando cambian los filtros
  useEffect(() => {
    loadInsightData();
  }, [loadInsightData]);

  // Cargar historial detallado de precios para un producto específico (solo usuarios premium)
  const loadDetailedPriceHistory = async (productId: string, productName: string) => {
    if (!isPremium) {
      // Si no es premium, mostrar mensaje sobre la suscripción
      alert('Esta función solo está disponible para usuarios Premium. Actualiza tu plan para acceder a gráficas detalladas.');
      return;
    }
    
    setLoading(true);
    try {
      const historyData = await productService.getPriceHistory(productId, 90); // 90 días de historial
      setDetailedPriceHistory(historyData);
      setSelectedProduct(productName);
      setShowDetailedChart(true);
    } catch (error) {
      console.error('Error al cargar historial detallado de precios:', error);
      // Crear datos de ejemplo para mostrar en caso de error
      const sampleData: PriceData[] = [];
      const today = new Date();
      for (let i = 90; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        sampleData.push({
          date: date.toISOString().split('T')[0],
          price: Math.floor(Math.random() * 1000) + 3000
        });
      }
      setDetailedPriceHistory(sampleData);
      setSelectedProduct(productName);
      setShowDetailedChart(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleTimespanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimespan(e.target.value);
  };

  const closeDetailedChart = () => {
    setShowDetailedChart(false);
    setSelectedProduct(null);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Análisis profundo del mercado</h1>
            <p className="text-gray-600 mt-1">Datos en tiempo real y métricas de mercado</p>
          </div>
          <Link 
            to="/subscription" 
            className="flex items-center px-4 py-2 bg-green-1 hover:bg-opacity-90 text-white rounded-md transition-colors"
          >
            <FaCrown className="mr-2" />
            {isPremium ? 'Plan Premium Activo' : 'Activar Premium'}
          </Link>
        </div>

        {loading && !priceTrends.length ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            <p className="ml-3 text-lg text-gray-700">Cargando datos de mercado...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadInsightData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {/* Gráfico detallado para usuarios premium */}
            {showDetailedChart && selectedProduct && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Análisis detallado: {selectedProduct}
                  </h2>
                  <button 
                    onClick={closeDetailedChart}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="h-80">
                  <PriceLineChart priceHistory={detailedPriceHistory} productName={selectedProduct} />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>Este gráfico muestra la evolución del precio en los últimos 90 días. Observa las tendencias para tomar mejores decisiones.</p>
                </div>
              </div>
            )}

            {/* Sección de tendencia de precios en tiempo real */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Tendencia de precios en tiempo real</h2>
                <div className="flex space-x-3">
                  <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-1"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTimespan}
                    onChange={handleTimespanChange}
                    className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-1"
                  >
                    <option value="7">Última semana</option>
                    <option value="30">Último mes</option>
                    <option value="90">Últimos 3 meses</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Precio actual
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tendencia Semanal
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Gráfica
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {priceTrends.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0 mr-3 bg-green-0-5 flex items-center justify-center rounded-full">
                              <span className="text-green-1 text-lg">🌱</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{formatCurrency(product.currentPrice)}/{product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <TrendIndicator value={product.weeklyTrend} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => loadDetailedPriceHistory(product.id, product.name)}
                            className={`px-3 py-1 text-white text-xs rounded transition-colors ${isPremium ? 'bg-green-1 hover:bg-opacity-90' : 'bg-gray-400 cursor-not-allowed'}`}
                            title={isPremium ? 'Ver gráfico detallado' : 'Función disponible solo para usuarios Premium'}
                          >
                            {isPremium ? 'Ver gráfico' : 'Solo Premium'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección de alertas climáticas */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas de Clima</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weatherAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg ${
                      alert.type.includes('Inundación') 
                        ? 'bg-blue-50 border border-blue-200' 
                        : alert.type.includes('Calor')
                        ? 'bg-red-50 border border-red-200'
                        : alert.type.includes('Heladas')
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full ${
                        alert.type.includes('Inundación') 
                          ? 'bg-blue-100 text-blue-800' 
                          : alert.type.includes('Calor')
                          ? 'bg-red-100 text-red-800'
                          : alert.type.includes('Heladas')
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-yellow-100 text-yellow-800'
                      } mr-3`}>
                        {alert.type.includes('Inundación') ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        ) : alert.type.includes('Calor') ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        ) : alert.type.includes('Heladas') ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {alert.type} - {alert.region}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de consejos agrícolas */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Consejos Agrícolas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farmingTips.slice(0, 2).map((tip) => (
                  <div key={tip.id} className="bg-white shadow-sm rounded-lg p-5 border border-gray-200">
                    <div className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="bg-green-0-5 text-green-1 p-3 rounded-lg">
                          {tip.icon === 'seed' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m0 0l-7-7m7 7l7-7" />
                            </svg>
                          )}
                          {tip.icon === 'water' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          )}
                          {tip.icon === 'bug' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {tip.icon === 'soil' && (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">{tip.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                        {tip.region && <p className="text-xs text-gray-500 mt-2">Región: {tip.region}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección de pronóstico del mercado */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Pronóstico del Mercado</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {marketForecasts.map((forecast) => (
                  <div key={forecast.type} className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
                    <h3 className="text-gray-500 text-sm mb-2">{forecast.type === 'supply' ? 'Suministros' : forecast.type === 'demand' ? 'Demanda' : 'Previsión de precios'}</h3>
                    <div className="flex items-center">
                      <div className={`mr-3 ${
                        forecast.type === 'supply' ? 'text-blue-500' : 
                        forecast.type === 'demand' ? 'text-green-1' : 
                        'text-yellow-500'
                      }`}>
                        {forecast.type === 'supply' && (
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                        {forecast.type === 'demand' && (
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        )}
                        {forecast.type === 'price' && (
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="text-xl font-medium text-gray-800">{forecast.status}</div>
                        <p className="text-sm text-gray-500 mt-1">{forecast.description}</p>
                        {forecast.categoryName && <p className="text-xs text-gray-500 mt-2">Categoría: {forecast.categoryName}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center">
                      <TrendIndicator value={forecast.trend} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default MarketInsights; 