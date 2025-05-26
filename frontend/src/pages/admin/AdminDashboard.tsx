import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import StyledButton from '../../components/ui/StyledButton';
import PageContainer from '../../components/layout/PageContainer';
import Header from '../../components/layout/Header';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppContext();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, isAuthenticated, navigate]);

  // Set the active tab based on current path
  useEffect(() => {
    const path = location.pathname.split('/').pop() || '';
    if (['dashboard', 'users', 'certifications', 'products', 'orders', 'categories'].includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  // Manejar cambio de pestaña
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/admin/${tab}`);
  };

  return (
    <>
      <Header />
      <PageContainer maxWidth="full" bgColor="gray" padding="none">
        <div className="min-h-screen">
          <div className="bg-white shadow-sm border-b border-gray-0-5">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-green-1">Panel de Administración</h1>
                <div className="flex items-center">
                  <span className="mr-4 text-sm text-gray-600">
                    {user?.firstName} {user?.lastName} <span className="text-gray-0-5">(Administrador)</span>
                  </span>
                  <StyledButton
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                  >
                    Volver al Dashboard
                  </StyledButton>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-4">
            <div className="mb-6">
              <div className="flex overflow-x-auto border-b border-gray-0-5">
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'dashboard' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('dashboard')}
                >
                  Dashboard
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'users' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('users')}
                >
                  Usuarios
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'certifications' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('certifications')}
                >
                  Certificaciones
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'products' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('products')}
                >
                  Productos
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'orders' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('orders')}
                >
                  Pedidos
                </button>
                <button
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === 'categories' 
                      ? 'border-b-2 border-green-1 text-green-1'
                      : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`}
                  onClick={() => handleTabChange('categories')}
                >
                  Categorías
                </button>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-4">
              <Outlet />
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
};

export default AdminDashboard; 