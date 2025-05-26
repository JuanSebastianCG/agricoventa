import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAppContext();
  
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const sidebarClasses = `
    min-h-screen bg-black text-white transition-all duration-300 ease-in-out shadow-xl
    ${collapsed ? 'w-16' : 'w-64'}
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;
  
  // Filter nav items based on user role
  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: '📊', href: '/dashboard' },
      { name: 'Mercado', icon: '🏪', href: '/mercado-general' },
    ];
    
    // Only add Mis Productos for SELLER and ADMIN
    if (user?.userType === 'SELLER' || user?.userType === 'ADMIN') {
      baseItems.push({ name: 'Mis Productos', icon: '📦', href: '/mis-productos' });
    }
    
    // Add remaining items
    return [
      ...baseItems,
      { name: 'Mis Pedidos', icon: '🚚', href: '/mis-pedidos' },
      { name: 'Insights', icon: '📈', href: '/insights' },
      { name: 'Configuración', icon: '⚙️', href: '/configuracion' },
    ];
  };
  
  const navItems = getNavItems();
  
  return (
    <aside className={sidebarClasses}>
      <div className="p-4 flex items-center justify-between border-b border-gray-0-5">
        {!collapsed && <h2 className="text-xl font-bold text-green-1">Menu</h2>}
        <button 
          onClick={toggleCollapse} 
          className="text-white bg-green-1 hover:bg-green-0-9 p-2 rounded transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
        
        {!collapsed && onClose && (
          <button 
            onClick={onClose}
            className="text-white hover:text-red-1 transition-colors"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      <nav className="py-4">
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <a 
                href={item.href}
                className="flex items-center py-3 px-4 hover:bg-green-1 hover:text-white transition-colors"
              >
                <span className="text-xl w-8">{item.icon}</span>
                {!collapsed && <span className="ml-3 font-medium">{item.name}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-0-5">
        {!collapsed && (
          <div className="text-sm text-gray-0-5 mb-2">
            ¿Necesitas ayuda?
          </div>
        )}
        <a 
          href="/soporte" 
          className="flex items-center text-white hover:text-green-1 transition-colors"
        >
          <span className="text-xl">❓</span>
          {!collapsed && <span className="ml-3">Soporte</span>}
        </a>
      </div>
    </aside>
  );
};

export default Sidebar; 