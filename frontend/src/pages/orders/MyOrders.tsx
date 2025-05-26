import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import UserProfile from '../../components/common/UserProfile';
import { IOrder, OrderStatus, IOrderItem } from '../../interfaces/order';
import Modal from '../../components/ui/Modal';
import StyledButton from '../../components/ui/StyledButton';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Mock data for testing when API doesn't return data
const MOCK_ORDERS: IOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    buyerUserId: 'user1',
    status: 'PENDING',
    totalAmount: 75000,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: 'item1',
        productId: 'prod1',
        productName: 'Café Orgánico',
        quantity: 3,
        unitPrice: 25000,
        subtotal: 75000
      }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    buyerUserId: 'user1',
    status: 'DELIVERED',
    totalAmount: 120000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    items: [
      {
        id: 'item2',
        productId: 'prod2',
        productName: 'Aguacate Hass',
        quantity: 10,
        unitPrice: 8000,
        subtotal: 80000
      },
      {
        id: 'item3',
        productId: 'prod3',
        productName: 'Naranja Valencia',
        quantity: 20,
        unitPrice: 2000,
        subtotal: 40000
      }
    ]
  }
];

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  
  // Orders state
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/orders', {
        params: { 
          buyerUserId: user?.id,
          page: currentPage,
          limit: ordersPerPage
        }
      });
      
      if (response.data.success) {
        // Check if data is structured with pagination
        if (response.data.data && response.data.data.orders) {
          setOrders(response.data.data.orders);
          setTotalPages(response.data.data.pagination?.pages || 1);
        } 
        // Check if data is just an array of orders
        else if (Array.isArray(response.data.data)) {
          setOrders(response.data.data);
        }
        // If no orders, use mock data for development
        else if (response.data.data && Array.isArray(response.data.data.orders) && response.data.data.orders.length === 0) {
          console.log('No orders returned from API, using mock data for testing');
          setOrders(MOCK_ORDERS);
        } else {
          setOrders([]);
        }
      } else {
        // If API call fails, use mock data for development
        console.log('API call failed, using mock data for testing');
        setOrders(MOCK_ORDERS);
        throw new Error(response.data.error?.message || 'Error al cargar pedidos');
      }
    } catch (err) {
      // For development/testing, still show mock data even if there's an error
      setOrders(MOCK_ORDERS);
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, ordersPerPage, user?.id]);

  // Load orders on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchOrders();
    }
  }, [isAuthenticated, user, fetchOrders]);

  // Get status badge class
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status translation
  const getStatusTranslation = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'PROCESSING':
        return 'En Proceso';
      case 'SHIPPED':
        return 'Enviado';
      case 'DELIVERED':
        return 'Entregado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Add a retryFetch function
  const retryFetch = () => {
    setError(null);
    fetchOrders();
  };

  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<IOrder | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  const openCancelModal = (order: IOrder) => {
    setSelectedOrderToCancel(order);
    setCancelReason("");
    setCancelReasonError(null);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    if (!isCancelling) {
      setSelectedOrderToCancel(null);
      setCancelReason("");
      setCancelReasonError(null);
      setIsCancelModalOpen(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderToCancel) return;

    // Validate the cancel reason
    if (!cancelReason.trim()) {
      setCancelReasonError("Por favor, ingresa un motivo para la cancelación");
      return;
    }

    setIsCancelling(true);
    try {
      const response = await api.post(`/orders/${selectedOrderToCancel.id}/cancel`, {
        cancelReason: cancelReason.trim()
      });

      if (response.data.success) {
        toast.success('Pedido cancelado exitosamente.');
        // Update the order status locally or refetch orders
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === selectedOrderToCancel.id 
              ? { ...order, status: 'CANCELLED' } 
              : order
          )
        );
        closeCancelModal();
      } else {
        throw new Error(response.data.error?.message || 'Error al cancelar el pedido.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error desconocido al cancelar.');
      console.error("Error cancelling order:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelOrder = (status: string) => {
    const cancellableStatuses = ['PENDING', 'PROCESSING'];
    return cancellableStatuses.includes(status?.toUpperCase());
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="text-gray-1">Gestiona y realiza seguimiento a tus pedidos</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main content */}
          <div className="md:w-3/4">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm leading-5 font-medium">
                      {error === 'Network Error' 
                        ? 'No se pudo conectar al servidor. Por favor, verifica tu conexión a internet.'
                        : `Error al cargar los pedidos: ${error}`
                      }
                    </p>
                    <p className="text-xs mt-1 mb-2">
                      No te preocupes, puedes intentar de nuevo o contactar a soporte si el problema persiste.
                    </p>
                    <button 
                      onClick={retryFetch}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded"
                    >
                      Reintentar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
              </div>
            ) : !Array.isArray(orders) || orders.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-1 text-lg mb-4">No tienes pedidos registrados.</p>
                <button
                  onClick={() => navigate('/mercado-general')}
                  className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
                >
                  Explorar productos
                </button>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Pedido #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Realizado el {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {getStatusTranslation(order.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-semibold">Total:</span> ${order.totalAmount.toLocaleString('es-CO')} COP
                      </p>
                      
                      <p className="text-sm text-gray-700 mb-4">
                        <span className="font-semibold">Productos:</span> {order.items.length}
                      </p>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/pedidos/${order.id}`)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-4 text-sm rounded transition-colors"
                        >
                          Ver detalles
                        </button>
                        
                        {canCancelOrder(order.status) && (
                          <button
                            onClick={() => openCancelModal(order)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 py-2 px-4 text-sm rounded transition-colors"
                          >
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:w-1/4">
            {/* User Profile & Stats */}
            <Card className="mb-6 p-4">
              <UserProfile user={user} variant="basic" showActions={false} />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-1">Total de pedidos</p>
                <p className="text-2xl font-bold text-green-1">{orders.length}</p>
              </div>
            </Card>

            {/* Order Status */}
            <Card className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Estadísticas</h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-1">Pedidos Entregados</p>
                  <p className="text-xl font-bold text-green-1">
                    {orders.filter(order => order.status === 'DELIVERED').length}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-1">Pedidos en Proceso</p>
                  <p className="text-xl font-bold text-blue-600">
                    {orders.filter(order => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(order.status)).length}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-1">Pedidos Cancelados</p>
                  <p className="text-xl font-bold text-red-600">
                    {orders.filter(order => order.status === 'CANCELLED').length}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <a href="/mercado-general" className="text-green-1 hover:text-green-0-9 flex items-center text-sm font-medium">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Realizar nuevo pedido
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Modal de Confirmación de Cancelación */}
      {selectedOrderToCancel && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={closeCancelModal}
          title="Confirmar Cancelación de Pedido"
          footer={ (
            <>
              <StyledButton variant="outline" onClick={closeCancelModal} disabled={isCancelling} className="mr-2">
                Volver
              </StyledButton>
              <StyledButton variant="danger" onClick={handleCancelOrder} isLoading={isCancelling} disabled={isCancelling}>
                {isCancelling ? 'Cancelando...' : 'Sí, Cancelar Pedido'}
              </StyledButton>
            </>
          )}
        >
          <p className="text-gray-700 mb-4">
            ¿Estás seguro de que deseas cancelar el pedido #{selectedOrderToCancel.orderNumber}?
            Esta acción no se puede deshacer.
          </p>
          
          <div className="mt-4">
            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de la cancelación <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancelReason"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md ${cancelReasonError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-1 focus:ring-green-1`}
              placeholder="Por favor, explica por qué deseas cancelar este pedido"
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (e.target.value.trim()) setCancelReasonError(null);
              }}
              disabled={isCancelling}
            />
            {cancelReasonError && (
              <p className="mt-1 text-sm text-red-600">{cancelReasonError}</p>
            )}
          </div>
        </Modal>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
};

export default MyOrders; 