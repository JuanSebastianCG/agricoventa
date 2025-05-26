import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import IconNoBackground from '../../assets/IconNoBackground.png';
import { navigateToProducts } from '../../App';
import NotificationBell from '../common/NotificationBell';
import { FaSearch } from 'react-icons/fa';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Agricoventas' }) => {
  const { isAuthenticated, user, logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {

  }, [isAuthenticated, user]);

  // Agregar event listener para cerrar menu al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extraer iniciales del nombre del usuario
  const getUserInitials = () => {
    if (!user) return '?';
    
    // Use firstName and lastName if available
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    
    // Fallback to username
    return user.username ? user.username[0].toUpperCase() : '?';
  };

  // Function to navigate between pages
  const handleNavigation = (path: string) => {
    navigate(path === 'home' ? '/' : `/${path}`);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    } else {
      navigate('/marketplace');
    }
  };

  // Función para obtener la URL completa de la imagen de perfil
  const getProfileImageUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath) {
      return undefined;
    }
    // Si la URL ya es completa (comienza con http), la devolvemos tal cual
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Si no, construimos la URL completa
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    // Asegurarse de que no haya doble slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullUrl = `${apiUrl}/${cleanPath}`;
    return fullUrl;
  };

  return (
    <header className="bg-white shadow-sm py-3 relative">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => handleNavigation('home')}>
          <img 
            src={IconNoBackground} 
            alt="Agricoventas Logo" 
            className="h-12"
          />
        </div>

        {/* Search bar - Desktop */}
        <div className="hidden md:block flex-grow max-w-md mx-4">
          <form onSubmit={handleSearch} className="relative flex">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-green-1 bg-gray-50"
            />
            <button 
              type="submit"
              className="bg-green-1 hover:bg-green-700 text-white py-2 px-4 rounded-r-md transition-colors"
            >
              <FaSearch />
            </button>
          </form>
        </div>

        {isAuthenticated ? (
          <>
            {/* Navigation for logged-in users - Desktop */}
            <nav className="hidden md:flex items-center">
              <Link to="/mercado-general" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mercado General
              </Link>
              <Link 
                to="/mis-productos"
                className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors"
              >
                Mis Productos
              </Link>
              <Link to="/mis-pedidos" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Mis Pedidos
              </Link>
              <Link to="/insights" className="text-gray-1 font-medium mx-4 hover:text-green-1 transition-colors">
                Insights
              </Link>
            </nav>

            {/* User profile dropdown - Desktop */}
            <div className="hidden md:flex items-center space-x-4" ref={userMenuRef}>
              {/* Notification Bell */}
              <NotificationBell className="mr-2" />
              
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={getProfileImageUrl(user.profileImage)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                                ${getUserInitials()}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-700">{user?.firstName}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      userMenuOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link 
                      to="/perfil" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                    >
                      Mi Perfil
                    </Link>
                      <>
                        <Link 
                          to="/dashboard" 
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                        >
                          Panel de Control
                        </Link>
                      </>
                    {user?.userType === 'SELLER' && (
                      <Link 
                        to="/certificados" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-green-600"
                      >
                        Mis Certificados
                      </Link>
                    )}
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 hover:text-red-700"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Navigation for non-logged-in users - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/mercado-general" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Mercado General
              </Link>
            </div>

            {/* Right side navigation - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/insights" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Insights
              </Link>
              <Link to="/register" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Regístrate
              </Link>
              <Link to="/login" className="text-gray-1 font-medium hover:text-green-1 transition-colors">
                Iniciar Sesión
              </Link>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar Producto"
                  className="py-2 px-4 pr-10 bg-white border border-gray-0-5 rounded-md focus:outline-none focus:border-green-1"
                />
                <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-3">
          {/* Mobile Notification Bell */}
          {isAuthenticated && <NotificationBell />}
          
          <button
            onClick={toggleMobileMenu}
            className="text-gray-1 hover:text-green-1 focus:outline-none"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-md z-20 md:hidden">
          <div className="px-4 py-3">
            {isAuthenticated ? (
              <>
                <Link to="/mercado-general" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Mercado General
                </Link>
                <Link to="/mis-productos" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Mis Productos
                </Link>
                <Link to="/mis-pedidos" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Mis Pedidos
                </Link>
                <Link to="/dashboard" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Dashboard
                </Link>
                <Link to="/perfil" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Mi Perfil
                </Link>
                {user?.userType === 'SELLER' && (
                  <Link to="/certificados" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                    Mis Certificados
                  </Link>
                )}
                {user?.userType === 'ADMIN' && (
                  <Link to="/admin" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                    Administración
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left py-2 mt-2 border-t border-gray-100 text-red-600 font-medium hover:text-red-700 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/mercado-general" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Mercado General
                </Link>
                <Link to="/insights" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Insights
                </Link>
                <Link to="/register" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Regístrate
                </Link>
                <Link to="/login" className="block py-2 text-gray-1 font-medium hover:text-green-1 transition-colors">
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header; 