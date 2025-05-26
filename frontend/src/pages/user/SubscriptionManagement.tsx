import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import userService from '../../services/userService';
import { FaCrown, FaCheckCircle, FaTimes } from 'react-icons/fa';
import Header from '../../components/layout/Header';

const SubscriptionManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChangeSubscription = async (type: 'NORMAL' | 'PREMIUM') => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedUser = await userService.updateCurrentUser({
        subscriptionType: type
      });
      
      // Update the user in context
      updateUser(updatedUser);
      setSuccess(`¡Listo! Tu suscripción ha sido cambiada a ${type === 'PREMIUM' ? 'Premium' : 'Normal'}.`);
    } catch (err) {
      console.error('Error changing subscription:', err);
      setError('No se pudo actualizar la suscripción. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.subscriptionType === 'PREMIUM';

  return (
    <>
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">Gestión de Suscripción</h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <FaTimes className="flex-shrink-0 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md">
            <div className="flex items-center">
              <FaCheckCircle className="flex-shrink-0 mr-2" />
              <p>{success}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-1 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Estado de tu suscripción</h2>
              <div className="flex items-center">
                {isPremium && <FaCrown className="text-yellow-300 mr-2 text-xl" />}
                <span className="font-medium text-lg">{isPremium ? 'Premium' : 'Normal'}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">¿Qué incluye tu plan actual?</h3>
              
              {isPremium ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-1">Beneficios Premium</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Acceso a gráficas detalladas de comportamiento de precios por producto</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-1">¿Quieres cambiar?</h4>
                    <p className="mb-4 text-gray-600">
                      Puedes cambiar a un plan normal en cualquier momento. 
                      Perderás el acceso a las gráficas detalladas al finalizar el cambio.
                    </p>
                    <button
                      onClick={() => handleChangeSubscription('NORMAL')}
                      disabled={loading}
                      className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-300 flex justify-center items-center"
                    >
                      {loading ? 'Cambiando...' : 'Cambiar a plan Normal'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-1">Plan Normal (Actual)</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span>Acceso básico al marketplace</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-green-1">¡Mejora tu experiencia!</h4>
                    <p className="mb-4 text-gray-600">
                      Mejora a Premium para acceder a gráficas detalladas de comportamiento de precios
                      y tomar mejores decisiones basadas en datos.
                    </p>
                    <button
                      onClick={() => handleChangeSubscription('PREMIUM')}
                      disabled={loading}
                      className="w-full py-2 px-4 bg-green-1 hover:bg-green-0-9 text-white rounded-md transition-colors duration-300 flex justify-center items-center"
                    >
                      {loading ? 'Activando...' : (
                        <>
                          <FaCrown className="mr-2" />
                          Activar plan Premium
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionManagement; 