import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { FaCrown } from 'react-icons/fa';
import userService from '../../services/userService';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Pre-fill form with user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user, isAuthenticated, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const updatedUser = await userService.updateCurrentUser(formData);
      updateUser(updatedUser);
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      setError('Error al actualizar el perfil');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.subscriptionType === 'PREMIUM';
  
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Perfil</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}

      {/* Subscription Card */}
      <div className="mb-6 p-4 border rounded-lg shadow-sm bg-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Estado de Suscripción</h2>
          {isPremium && <FaCrown className="text-yellow-500 text-xl" />}
        </div>
        <p className="mb-3">
          {isPremium 
            ? 'Tu cuenta tiene acceso Premium' 
            : 'Tu cuenta tiene acceso Normal'}
        </p>
        <Link 
          to="/subscription"
          className="inline-block text-green-500 hover:text-green-700 font-medium"
        >
          {isPremium ? 'Administrar suscripción' : 'Actualizar a Premium'}
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-1 focus:ring-green-1"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-1 focus:ring-green-1"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-1 focus:ring-green-1"
            disabled
          />
          <p className="mt-1 text-xs text-gray-500">El correo electrónico no se puede cambiar.</p>
        </div>
        
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-1 focus:ring-green-1"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/perfil')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-1 hover:bg-green-0-9 text-white rounded-md"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile; 