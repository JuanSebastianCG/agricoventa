import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Definición de interfaces (similar a MyOrders, pero podría necesitar más campos de admin)
interface OrderItemAdmin {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: {
    name: string;
    sellerId: string;
    images?: Array<{ id: string; imageUrl: string; isPrimary: boolean }>;
  };
}

interface OrderAdmin {
  id: string;
  buyerUserId: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemAdmin[];
  buyer?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const ManageOrders: React.FC = () => {
  const { user, isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(''); // For Order ID or Buyer Email

  // State for inline editing of status
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Stats summary
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  const fetchAdminOrders = useCallback(async () => {
    if (!isAuthenticated || user?.userType !== 'ADMIN') {
      toast.error("Acceso no autorizado.");
      navigate('/login');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;

      const response = await api.get('/orders', { params }); // Admins should get all orders

      if (response.data.success) {
        const fetchedOrders = response.data.data.orders || response.data.data || [];
        const ordersArray = Array.isArray(fetchedOrders) ? fetchedOrders : [];
        setOrders(ordersArray);
        
        // Calculate stats
        const newStats = {
          total: ordersArray.length,
          pending: ordersArray.filter(o => o.status === 'PENDING').length,
          processing: ordersArray.filter(o => o.status === 'PROCESSING').length,
          shipped: ordersArray.filter(o => o.status === 'SHIPPED').length,
          delivered: ordersArray.filter(o => o.status === 'DELIVERED').length,
          cancelled: ordersArray.filter(o => o.status === 'CANCELLED').length
        };
        setStats(newStats);
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch orders for admin');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while fetching orders');
      toast.error(err.message || 'Error al cargar pedidos');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, navigate, statusFilter]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const handleUpdateStatus = async (orderId: string, statusToUpdate: string) => {
    if (!orderId || !statusToUpdate) return;
    setIsUpdatingStatus(true);
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status: statusToUpdate });
      if (response.data.success) {
        toast.success(`Estado del pedido #${orderId.substring(0,8)} actualizado a ${statusToUpdate}`);
        
        // Update order in state and recalculate stats
        setOrders(prevOrders => {
          const updatedOrders = prevOrders.map(o => 
            o.id === orderId ? { ...o, status: statusToUpdate } : o
          );
          
          // Update stats after changing order status
          setStats({
            total: updatedOrders.length,
            pending: updatedOrders.filter(o => o.status === 'PENDING').length,
            processing: updatedOrders.filter(o => o.status === 'PROCESSING').length,
            shipped: updatedOrders.filter(o => o.status === 'SHIPPED').length,
            delivered: updatedOrders.filter(o => o.status === 'DELIVERED').length,
            cancelled: updatedOrders.filter(o => o.status === 'CANCELLED').length
          });
          
          return updatedOrders;
        });
        
        setEditingOrderId(null); // Close editing row
      } else {
        throw new Error(response.data.error?.message || 'Error al actualizar estado.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar estado del pedido.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const startEditingStatus = (order: OrderAdmin) => {
    setEditingOrderId(order.id);
    setNewStatus(order.status);
  };

  const cancelEditingStatus = () => {
    setEditingOrderId(null);
    setNewStatus('');
  };

  const getStatusClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const filteredOrders = orders.filter(order => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearchTerm = searchTerm ? 
        order.id.toLowerCase().includes(searchTermLower) || 
        order.buyer?.email?.toLowerCase().includes(searchTermLower) ||
        `${order.buyer?.firstName?.toLowerCase() || ''} ${order.buyer?.lastName?.toLowerCase() || ''}`.includes(searchTermLower) :
        true;
    return matchesSearchTerm;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-700 ml-3">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestionar Pedidos</h2>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="p-4 bg-gray-50 border-l-4 border-gray-500">
          <p className="text-sm font-medium text-gray-500">Total Pedidos</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-yellow-700">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </Card>
        <Card className="p-4 bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-700">En Proceso</p>
          <p className="text-2xl font-bold text-blue-800">{stats.processing}</p>
        </Card>
        <Card className="p-4 bg-indigo-50 border-l-4 border-indigo-500">
          <p className="text-sm font-medium text-indigo-700">Enviados</p>
          <p className="text-2xl font-bold text-indigo-800">{stats.shipped}</p>
        </Card>
        <Card className="p-4 bg-green-0-4 border-l-4 border-green-1">
          <p className="text-sm font-medium text-green-700">Entregados</p>
          <p className="text-2xl font-bold text-green-800">{stats.delivered}</p>
        </Card>
        <Card className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm font-medium text-red-700">Cancelados</p>
          <p className="text-2xl font-bold text-red-800">{stats.cancelled}</p>
        </Card>
      </div>

      {error && (
        <Card className="p-6 bg-red-50 text-center mb-6">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Error al Cargar Pedidos</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <StyledButton onClick={fetchAdminOrders} variant="primary" className="bg-red-500 hover:bg-red-600">
            Reintentar
          </StyledButton>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Estado:</label>
              <select 
                id="statusFilter" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-1 focus:border-green-1"
              >
                <option value="">Todos los Estados</option>
                {orderStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Buscar (ID Pedido, Email/Nombre Comprador):</label>
              <input 
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-1 focus:border-green-1"
                placeholder="Ej: abc123xyz o juan@example.com"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <StyledButton 
              onClick={fetchAdminOrders} 
              variant="primary"
              className="bg-green-1 hover:bg-green-0-9"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </StyledButton>
          </div>
        </div>
      </Card>

      {filteredOrders.length === 0 && !isLoading ? (
        <Card className="p-8 text-center">
          <p className="text-lg text-gray-700">No se encontraron pedidos con los filtros actuales.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprador</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Pago</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Pedido</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={order.id}>{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.buyer ? `${order.buyer.firstName || ''} ${order.buyer.lastName || ''} (${order.buyer.email})` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.totalAmount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.paymentStatus || 'N/A')}`}>
                            {order.paymentStatus || 'N/A'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOrderId === order.id ? (
                        <select 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className={`w-full p-1 border border-gray-300 rounded-md shadow-sm text-xs ${getStatusClass(newStatus)}`}
                        >
                          {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {editingOrderId === order.id ? (
                        <div className="flex space-x-1">
                          <StyledButton 
                            size="sm"
                            variant="success"
                            onClick={() => handleUpdateStatus(order.id, newStatus)}
                            isLoading={isUpdatingStatus}
                            disabled={isUpdatingStatus || newStatus === order.status}
                          >
                            Guardar
                          </StyledButton>
                          <StyledButton size="sm" variant="outline" onClick={cancelEditingStatus} disabled={isUpdatingStatus}>
                            Cancelar
                          </StyledButton>
                        </div>
                      ) : (
                        <div className="flex space-x-1">
                          <StyledButton 
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingStatus(order)}
                          >
                            Cambiar Estado
                          </StyledButton>
                           <StyledButton 
                            size="sm"
                            variant="info_outline"
                            onClick={() => navigate(`/pedido/${order.id}`)}
                          >
                            Detalles
                          </StyledButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default ManageOrders;