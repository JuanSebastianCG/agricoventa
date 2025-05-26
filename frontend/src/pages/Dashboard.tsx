import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Card from '../components/ui/Card';
import MainLayout from '../components/layout/MainLayout';
import { navigateToProducts } from '../App';
import api from '../services/api';
import { FaCrown } from 'react-icons/fa';

interface DashboardStats {
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  pendingOrders: number;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    productCount: 0,
    orderCount: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  const [productsError, setProductsError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
    };
    
    checkAccess();
    fetchProductData();
    fetchOrderData();
  }, [isAuthenticated, navigate]);

  // Check if user is a seller or admin
  const isSeller = user?.userType === 'SELLER';
  const isAdmin = user?.userType === 'ADMIN';
  const canManageProducts = isSeller || isAdmin;

  const fetchProductData = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      let productCount = 0;
      if (canManageProducts) {
        const productsResponse = await api.get('/products', {
          params: { sellerId: user?.id }
        });
        if (productsResponse.data.success) {
          if (productsResponse.data.data.pagination) {
            productCount = productsResponse.data.data.pagination.total;
          } else if (Array.isArray(productsResponse.data.data.products)) {
            productCount = productsResponse.data.data.products.length;
          } else if (Array.isArray(productsResponse.data.data)) {
            productCount = productsResponse.data.data.length;
          }
          setDashboardStats(prev => ({ ...prev, productCount }));
        } else {
          throw new Error(productsResponse.data.error?.message || 'Error al cargar productos');
        }
      }
    } catch (err) {
      console.error("Error fetching product data:", err);
      setProductsError("No se pudieron cargar los datos de productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrderData = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      let orderCount = 0;
      let totalRevenue = 0;
      let pendingOrders = 0;
      let orderEndpoint = '/orders';
      const params: any = {};

      if (user?.userType === 'SELLER') {
        orderEndpoint = '/orders/seller'; 
      } else {
        // Para cualquier otro tipo de usuario (BUYER, etc.), usar el endpoint normal
        // y filtrar por buyerUserId
        params.buyerUserId = user?.id;
      }
      
      const ordersResponse = await api.get(orderEndpoint, { params });
      
      if (ordersResponse.data.success) {
        const ordersData = ordersResponse.data.data;
        const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);
        
        orderCount = ordersData.pagination?.total || orders.length;
        
        orders.forEach((order: any) => {
          totalRevenue += parseFloat(order.totalAmount || 0);
          if ([ 'PENDING', 'PROCESSING' ].includes(order.status?.toUpperCase())) {
            pendingOrders++;
          }
        });
        setDashboardStats(prev => ({ ...prev, orderCount, totalRevenue, pendingOrders }));
      } else {
        throw new Error(ordersResponse.data.error?.message || 'Error al cargar pedidos');
      }
    } catch (err: any) {
      console.error("Error fetching order data:", err);
      const errorMessage = err.response?.status === 500 
        ? "Error del servidor al cargar pedidos. El endpoint puede no estar implementado o tener problemas." 
        : "No se pudieron cargar los datos de pedidos";
      setOrdersError(errorMessage);
    } finally {
      setOrdersLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-CO', {
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const goToProducts = () => {
    navigateToProducts();
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <Link 
            to="/subscription" 
            className="flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
          >
            <FaCrown className="mr-2" />
            {user?.subscriptionType === 'PREMIUM' ? 'Gestionar Suscripción' : 'Actualizar a Premium'}
          </Link>
        </div>
        
        {productsError && (
          <div className="mb-6 bg-red-100 border-l-4 border-red-1 text-red-1 p-4 rounded-md">
            <p>{productsError}</p>
            <button onClick={fetchProductData} className="mt-2 text-sm underline">Reintentar</button>
          </div>
        )}
        
        {ordersError && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-1 text-yellow-1 p-4 rounded-md">
            <p>{ordersError}</p>
            <button onClick={fetchOrderData} className="mt-2 text-sm underline">Reintentar</button>
          </div>
        )}
        
        {canManageProducts && (
          <div className="mb-6 bg-green-0-5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-green-1">Gestión de Productos</h2>
                <p className="text-gray-700">Administra, añade y actualiza tus productos agrícolas</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link 
                  to="/mis-productos"
                  className="bg-green-1 hover:bg-green-0-9 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors shadow-md flex items-center"
                >
                  Ver Mis Productos
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
                <Link 
                  to="/insights"
                  className="bg-yellow-1 hover:bg-yellow-1-5 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors shadow-md flex items-center"
                >
                  Ver Insights
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="col-span-full bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenido, {user?.firstName || user?.username}</h2>
              <p className="text-gray-600">Este es tu panel de control donde puedes gestionar tus actividades en Agricoventas.</p>
            </div>
          </Card>
          
          {canManageProducts && (
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-0-7 rounded-md text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg></div>
                  <h3 className="text-lg font-medium ml-4 text-gray-800">Mis Productos</h3>
                </div>
                {productsLoading ? <div className="h-12 bg-gray-200 animate-pulse rounded-md mb-3"></div> : <p className="text-3xl font-bold text-gray-900 mb-3">{dashboardStats.productCount}</p>}
                <p className="text-sm text-gray-500 mb-4">Productos activos y listados para la venta.</p>
                <div className="flex items-center justify-between">
                  <Link to="/mis-productos" className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center">Ver mis productos <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></Link>
                  <Link to="/crear-producto" className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md text-sm transition-colors">Añadir Nuevo</Link>
                </div>
              </div>
            </Card>
          )}
           
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-green-1 rounded-md text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg></div>
                <h3 className="text-lg font-medium ml-4 text-gray-800">Mis Pedidos</h3>
              </div>
              {ordersLoading ? <div className="h-12 bg-gray-200 animate-pulse rounded-md mb-3"></div> 
                : ordersError ? <div className="flex items-center text-yellow-1"><svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span className="text-sm">Datos no disponibles</span></div> 
                : <p className="text-3xl font-bold text-gray-900 mb-3">{dashboardStats.orderCount}{dashboardStats.pendingOrders > 0 && <span className="text-sm font-normal text-yellow-1 ml-2">({dashboardStats.pendingOrders} pendientes)</span>}</p>}
              <p className="text-sm text-gray-500 mb-4">{canManageProducts ? 'Pedidos de tus productos.' : 'Pedidos que has realizado.'}</p>
              <Link to="/mis-pedidos" className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center">Ver mis pedidos <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></Link>
            </div>
          </Card>
          
          {(canManageProducts || isAdmin) && (
            <Card className="bg-white shadow-sm">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-0-6 rounded-md text-white"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                  <h3 className="text-lg font-medium ml-4 text-gray-800">Ingresos</h3>
                </div>
                {ordersLoading ? <div className="h-12 bg-gray-200 animate-pulse rounded-md mb-3"></div> 
                  : ordersError ? <div className="flex items-center text-yellow-1"><svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span className="text-sm">Datos no disponibles</span></div> 
                  : <p className="text-3xl font-bold text-gray-900 mb-3">{formatCurrency(dashboardStats.totalRevenue)}</p>}
                <p className="text-sm text-gray-500 mb-4">Ingresos totales generados.</p>
                <Link to={isAdmin ? "/admin/reports" : "/estadisticas"} className="text-green-1 hover:text-green-0-9 font-medium text-sm flex items-center">Ver reportes <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></Link>
              </div>
            </Card>
          )}
          
          <Card className="col-span-full bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {canManageProducts && (
                  <>
                    <Link to="/crear-producto" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                      <svg className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      <span className="text-sm font-medium text-gray-700 text-center">Añadir producto</span>
                    </Link>
                    <Link to="/mis-productos" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                      <svg className="h-6 w-6 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                      <span className="text-sm font-medium text-gray-700 text-center">Mis productos</span>
                    </Link>
                  </>
                )}
                <Link to="/mis-pedidos" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  <span className="text-sm font-medium text-gray-700 text-center">Mis Pedidos</span>
                </Link>
                <Link to="/perfil" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                  <svg className="h-6 w-6 text-yellow-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  <span className="text-sm font-medium text-gray-700 text-center">Editar perfil</span>
                </Link>
                <Link to="/marketplace" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                   <svg className="h-6 w-6 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  <span className="text-sm font-medium text-gray-700 text-center">Ir al Marketplace</span>
                </Link>
                {canManageProducts && (
                  <Link to="/certificados" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                    <svg className="h-6 w-6 text-teal-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    <span className="text-sm font-medium text-gray-700 text-center">Mis Certificaciones</span>
                  </Link>
                )}
                {(user?.userType === 'SELLER' || user?.userType === 'ADMIN') && (
                  <Link to="/insights" className="p-4 border border-gray-200 rounded-lg flex flex-col items-center hover:bg-gray-50 transition-colors">
                    <svg className="h-6 w-6 text-yellow-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 text-center">Insights de Productos</span>
                  </Link>
                )}
              </div>
            </div>
          </Card>

          {isAdmin && (
            <div className="mb-8 bg-green-0-5 rounded-lg p-6 shadow-md col-span-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-semibold text-green-1">Panel de Administración</h2>
                  <p className="text-gray-700 mt-1">Accede a las herramientas de administración para gestionar la plataforma.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link 
                    to="/admin/users" 
                    className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center"
                  >
                    Gestionar Usuarios
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                  </Link>
                  <Link 
                    to="/admin/orders" 
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center"
                  >
                    Gestionar Pedidos
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                  </Link>
                  <Link 
                    to="/admin/categories" 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center"
                  >
                    Gestionar Categorías
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </Link>
                  <Link 
                    to="/admin/certifications" 
                    className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors shadow-sm flex items-center"
                  >
                    Aprobar Certificaciones
                    <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard; 