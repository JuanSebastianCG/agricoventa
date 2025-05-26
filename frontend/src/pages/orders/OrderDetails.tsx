import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { IOrder, OrderStatus } from '../../interfaces/order';
import { useReactToPrint } from 'react-to-print';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppContext();
  
  const [order, setOrder] = useState<IOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for printing
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Function to handle printing
  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Factura_${order?.orderNumber || 'Pedido'}`,
    onAfterPrint: () => console.log('Impresión completada')
  });

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch order details
  useEffect(() => {
    if (isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/orders/${orderId}`);
      
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        throw new Error(response.data.error?.message || 'Error al cargar los detalles del pedido');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los detalles del pedido';
      setError(errorMessage);
      console.error('Error fetching order details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalles del Pedido</h1>
              {order && (
                <p className="text-gray-1">
                  Pedido #{order.orderNumber} • {formatDate(order.createdAt)}
                </p>
              )}
            </div>
            <button 
              onClick={() => navigate('/mis-pedidos')}
              className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
            >
              Ver todos mis pedidos
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <button 
              onClick={fetchOrderDetails}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : !order ? (
          <Card className="text-center py-12">
            <p className="text-gray-1 text-lg mb-4">No se encontró información del pedido.</p>
            <button
              onClick={() => navigate('/mis-pedidos')}
              className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded shadow-sm transition-colors"
            >
              Ver mis pedidos
            </button>
          </Card>
        ) : (
          <div className="flex flex-col space-y-6">
            {/* Order Status Card */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Estado del Pedido</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                  {getStatusTranslation(order.status)}
                </span>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Método de pago</p>
                    <p className="font-medium">{order.paymentMethod || 'Contra entrega'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado del pago</p>
                    <p className="font-medium">{order.paymentStatus || 'Pendiente'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método de envío</p>
                    <p className="font-medium">{order.shippingMethod || 'Estándar'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Invoice Card */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Factura</h2>
                <button
                  onClick={handlePrint}
                  className="flex items-center text-green-1 hover:text-green-0-9"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Factura
                </button>
              </div>

              {/* Printable invoice */}
              <div ref={invoiceRef} className="p-4">
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold">AGRICOVENTAS</h1>
                  <p>Conectando agricultores con compradores</p>
                  <p className="text-sm text-gray-600">NIT: 900.123.456-7</p>
                </div>
                
                <div className="mb-6 flex justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Factura de Venta</h2>
                    <p className="text-sm">Factura #: {order.orderNumber}</p>
                    <p className="text-sm">Fecha: {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">Cliente:</p>
                    <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <table className="min-w-full bg-white border border-gray-200 mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 border-b text-left">Producto</th>
                      <th className="py-2 px-4 border-b text-right">Precio unitario</th>
                      <th className="py-2 px-4 border-b text-right">Cantidad</th>
                      <th className="py-2 px-4 border-b text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-4">{item.productName}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-4 text-right">{item.quantity}</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-2 px-4 text-right font-semibold">Subtotal:</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-2 px-4 text-right font-semibold">IVA (19%):</td>
                      <td className="py-2 px-4 text-right">{formatCurrency(order.totalAmount * 0.19)}</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={3} className="py-2 px-4 text-right font-bold">Total:</td>
                      <td className="py-2 px-4 text-right font-bold">{formatCurrency(order.totalAmount * 1.19)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Información de Pago:</h3>
                  <p className="text-sm">Método de pago: {order.paymentMethod || 'Contra entrega'}</p>
                  <p className="text-sm">Estado del pago: {order.paymentStatus || 'Pendiente'}</p>
                </div>
                
                <div className="text-center text-sm text-gray-600 mt-10">
                  <p>¡Gracias por tu compra!</p>
                  <p>Este documento sirve como comprobante de compra.</p>
                  <p>www.agricoventas.co • soporte@agricoventas.co • +57 300 123 4567</p>
                </div>
              </div>
            </Card>

            {/* Order Items Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Productos en este pedido</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-2 px-4 text-left">Producto</th>
                      <th className="py-2 px-4 text-right">Precio unitario</th>
                      <th className="py-2 px-4 text-right">Cantidad</th>
                      <th className="py-2 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {item.productImage && (
                              <img 
                                src={item.productImage} 
                                alt={item.productName} 
                                className="w-12 h-12 object-cover rounded mr-3"
                              />
                            )}
                            <div>
                              <p className="font-medium">{item.productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 px-4 text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="py-3 px-4 text-right font-semibold">Total:</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => navigate('/mis-pedidos')}
                className="text-green-1 flex items-center hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Volver a mis pedidos
              </button>
              
              {order.status === 'PENDING' && (
                <button
                  onClick={() => console.log('Cancelación de pedido solicitada')}
                  className="text-red-1 hover:text-red-600 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar pedido
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderDetails; 