import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import FormField from '../../components/ui/FormField';
import api from '../../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAppContext();
  
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    userType: 'BUYER',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!currentUser || currentUser.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Cargar usuarios
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/users');

      if (!response.data.success) {
        throw new Error('Error al cargar usuarios');
      }

      if (Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  // Manejadores de eventos
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      userType: user.userType,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await api.delete(`/users/${userId}`);
        
        if (response.data.success) {
          fetchUsers();
        } else {
          throw new Error(response.data.error?.message || 'Error al eliminar el usuario');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar el usuario');
        console.error('Error deleting user:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    // No validamos phoneNumber como requerido ya que puede ser null
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Asegurar que phoneNumber sea un string o null, no un string vacío
      const userData = {
        ...formData,
        phoneNumber: formData.phoneNumber.trim() || null
      };

      const response = await api.put(`/users/${selectedUser?.id}`, userData);
      
      if (response.data.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(response.data.error?.message || 'Error al actualizar el usuario');
      }
    } catch (err: any) {
      if (err.response?.data?.error?.details) {
        const validationErrors = err.response.data.error.details.reduce((acc: Record<string, string>, curr: any) => {
          acc[curr.path] = curr.message;
          return acc;
        }, {});
        setErrors(validationErrors);
      } else {
        setError(err.message || 'Error al actualizar el usuario');
      }
      console.error('Error updating user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay usuarios activos con role admin, mostrar advertencia
  const activeAdmins = users.filter(u => u.userType === 'ADMIN' && u.isActive);
  const showAdminWarning = activeAdmins.length <= 1;

  const modalFooter = (
    <div className="flex justify-end space-x-2">
      <button
        onClick={() => setIsModalOpen(false)}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        disabled={isLoading}
      >
        Cancelar
      </button>
      <button
        onClick={handleSubmit}
        className="px-4 py-2 text-sm font-medium text-white bg-green-1 hover:bg-green-0-9 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        disabled={isLoading}
      >
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {showAdminWarning && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
            <p className="font-bold">Advertencia:</p>
            <p>Debe haber al menos un usuario administrador activo en el sistema.</p>
          </div>
        )}

        {isLoading && users.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phoneNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.userType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isLoading && setIsModalOpen(false)}
        title="Editar Usuario"
        footer={modalFooter}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName}
            required
          />
          <FormField
            label="Apellido"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName}
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            required
          />
          <FormField
            label="Teléfono"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={errors.phoneNumber}
          />
          <FormField
            label="Tipo de Usuario"
            name="userType"
            type="select"
            value={formData.userType}
            onChange={handleInputChange}
            options={[
              { value: 'BUYER', label: 'Comprador' },
              { value: 'SELLER', label: 'Vendedor' },
              { value: 'ADMIN', label: 'Administrador' }
            ]}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-green-1 focus:ring-green-0-9 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Usuario Activo
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement; 