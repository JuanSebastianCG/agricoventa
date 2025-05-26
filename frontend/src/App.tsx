import React, { useEffect, Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { useAppContext, AppProvider } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/user/Login';
import Register from './pages/user/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/user/Perfil';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Marketplace from './pages/Marketplace';
import ProductCreate from './pages/products/ProductCreate';
import ProductEdit from './pages/products/ProductEdit';
import MyProducts from './pages/products/MyProducts';
import MyOrders from './pages/orders/MyOrders';
import OrderDetails from './pages/orders/OrderDetails';
import CertificationApproval from './pages/admin/CertificationApproval';
import ManageCategories from './pages/admin/ManageCategories';
import ProductDetail from './pages/products/ProductDetail';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/cart/CheckoutPage';
import OrderConfirmation from './pages/orders/OrderConfirmation';
import NotFound from './pages/NotFound';
import './index.css';
import { CartProvider } from './context/CartContext';
import EditProfile from './pages/user/EditProfile';
import SellerCertifications from './pages/user/SellerCertifications';
import ManageProducts from './pages/admin/ManageProducts';
import SubscriptionManagement from './pages/user/SubscriptionManagement';
import TermsAndConditions from './pages/user/TermsAndConditions';

// Lazy loaded pages
const ManageOrders = lazy(() => import('./pages/admin/ManageOrders'));
const Insights = lazy(() => import('./pages/Insights'));

// Componente para rutas protegidas
interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAppContext();
  
  if (!isAuthenticated) {
    // Redirigir a login si no está autenticado
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user?.userType && !allowedRoles.includes(user.userType)) {
    // Don't redirect to the certificates page, just show unauthorized
    return <Navigate to="/no-autorizado" replace />; 
  }
  
  return children ? <>{children}</> : <Outlet />;
};

// Componente para rutas protegidas de vendedores
const SellerRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppContext();
  
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Solo permitir vendedores o administradores
  if (user?.userType !== 'SELLER' && user?.userType !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Add a utility function for navigation that can be imported by other components
export const navigateToProducts = () => {
  // Force hard navigation by setting window.location
  window.location.href = '/productos';
};

// Suspense Loader Component
const SuspenseLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
    <p className="ml-4 text-lg text-gray-700">Cargando...</p>
  </div>
);

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/marketplace" element={<Marketplace />} />
    <Route path="/mercado-general" element={<Navigate to="/marketplace" replace />} />
    <Route path="/product/:productId" element={<ProductDetail />} />
    <Route path="/productos/:productId" element={<ProductDetail />} />
    <Route path="/carrito" element={<CartPage />} />
    <Route path="/terminos-y-condiciones" element={<TermsAndConditions />} />

    {/* Authenticated Routes (all roles) */}
    <Route element={<ProtectedRoute />}>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/pedido-confirmado/:orderId" element={<OrderConfirmation />} />
      <Route path="/mis-pedidos" element={<MyOrders />} />
      <Route path="/pedido/:orderId" element={<OrderDetails />} />
      <Route path="/pedidos/:orderId" element={<OrderDetails />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/perfil/:userId" element={<Perfil />} />
      <Route path="/perfil/editar" element={<EditProfile />} />
      <Route path="/subscription" element={<SubscriptionManagement />} />
    </Route>

    {/* Product Creation Routes - Only for Sellers and Admins */}
    <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
      <Route path="/crear-producto" element={<ProductCreate />} />
      <Route path="/crear-producto/:productId" element={<ProductCreate />} />
      <Route path="/editar-producto/:productId" element={<ProductEdit />} />
    </Route>

    {/* Authenticated Routes for all users - including Mis Productos */}
    <Route element={<ProtectedRoute />}>
      <Route path="/mis-productos" element={<MyProducts />} />
      <Route path="/certificados" element={<SellerCertifications />} />
      <Route path="/insights" element={
        <Suspense fallback={<SuspenseLoader />}>
          <Insights />
        </Suspense>
      } />
    </Route>

    {/* Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    }>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={
        <Suspense fallback={<SuspenseLoader />}>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen Administrativo</h2>
            <p className="text-gray-600 mb-8">Bienvenido al panel de administración de Agricoventas.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dashboard Summary Cards */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-1">
                <h3 className="text-lg font-semibold mb-2">Productos</h3>
                <p className="text-3xl font-bold text-green-1">Gestionar</p>
                <button 
                  onClick={() => window.location.href = '/admin/products'} 
                  className="mt-4 text-sm text-green-1 hover:underline flex items-center"
                >
                  Ver Productos
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold mb-2">Usuarios</h3>
                <p className="text-3xl font-bold text-blue-500">Gestionar</p>
                <button 
                  onClick={() => window.location.href = '/admin/users'} 
                  className="mt-4 text-sm text-blue-500 hover:underline flex items-center"
                >
                  Ver Usuarios
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                <h3 className="text-lg font-semibold mb-2">Certificaciones</h3>
                <p className="text-3xl font-bold text-yellow-500">Aprobar</p>
                <button 
                  onClick={() => window.location.href = '/admin/certifications'} 
                  className="mt-4 text-sm text-yellow-500 hover:underline flex items-center"
                >
                  Ver Certificaciones
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Suspense>
      } />
      <Route path="users" element={<Suspense fallback={<SuspenseLoader />}><UserManagement /></Suspense>} />
      <Route path="certifications" element={<Suspense fallback={<SuspenseLoader />}><CertificationApproval /></Suspense>} />
      <Route path="products" element={<Suspense fallback={<SuspenseLoader />}><ManageProducts /></Suspense>} />
      <Route path="orders" element={<Suspense fallback={<SuspenseLoader />}><ManageOrders /></Suspense>} />
      <Route path="categories" element={<Suspense fallback={<SuspenseLoader />}><ManageCategories /></Suspense>} />
    </Route>

    {/* Not Found */}
    <Route path="*" element={<NotFound />} />
    <Route path="/no-autorizado" element={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-700 text-lg mb-6">No tienes permiso para ver esta página.</p>
            <p className="text-gray-500 mb-8">Si consideras que deberías tener acceso, comunícate con el administrador del sistema.</p>
            <Link to="/" className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-6 rounded-md font-medium transition-colors inline-block">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    } />
  </Routes>
);

// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
            <p className="text-gray-700 mb-4">
              Ha ocurrido un error al cargar la aplicación. Por favor, intenta alguna de estas soluciones:
            </p>
            <ul className="list-disc pl-5 mb-6 text-gray-600">
              <li className="mb-2">Desactiva las extensiones del navegador</li>
              <li className="mb-2">Abre la aplicación en una ventana de incógnito</li>
              <li className="mb-2">Limpia el caché del navegador</li>
              <li>Recarga la página</li>
            </ul>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-green-1 text-white py-2 px-4 rounded-md hover:bg-green-0-9 transition-colors w-full"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const { isAuthenticated } = useAppContext();

  useEffect(() => {
    // Add a global click handler for mis-productos links
    const handleProductsNavigation = (e: any) => {
      const target = e.target as HTMLElement;
      
      // Check if the click target is a products link or inside one
      const isProductLink = (el: HTMLElement): boolean => {
        if (!el) return false;
        if (el.tagName === 'A' && el.getAttribute('href') === '/productos') return true;
        if (el.tagName === 'BUTTON' && el.dataset.nav === 'products') return true;
        
        // Skip links to mis-productos - these should use the React Router navigation
        if (el.tagName === 'A' && (
          el.getAttribute('href') === '/mis-productos' || 
          el.getAttribute('to') === '/mis-productos'
        )) {
          return false;
        }
        return false;
      };
      
      // Check if target or parents is a products link
      let currentEl: HTMLElement | null = target;
      let isProdsLink = false;
      
      while (currentEl && !isProdsLink) {
        isProdsLink = isProductLink(currentEl);
        currentEl = currentEl.parentElement;
      }
      
      if (isProdsLink) {
        e.preventDefault();
        navigateToProducts();
      }
    };
    
    document.addEventListener('click', handleProductsNavigation);
    return () => document.removeEventListener('click', handleProductsNavigation);
  }, [isAuthenticated]);

  return (
    <ErrorBoundary>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={
              <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-1"></div>
                <p className="ml-4 text-xl text-gray-700">Agricoventas Cargando...</p>
              </div>
            }>
              <AppRoutes />
            </Suspense>
          </Router>
        </NotificationProvider>
      </CartProvider>
    </ErrorBoundary>
  );
};

export default App;
