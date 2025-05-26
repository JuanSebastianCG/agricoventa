import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import MainLayout from '../../components/layout/MainLayout';
import Card from '../../components/ui/Card';
import userService, { User, UserUpdateData } from '../../services/userService';

const Perfil: React.FC = () => {
  const { user: contextUser, updateUser: updateContextUser } = useAppContext();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UserUpdateData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await userService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setFormData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
          });
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Error al cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };
    
    if (contextUser) {
      fetchUserData();
    }
  }, [contextUser]);
  
  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!contextUser) {
      navigate('/login');
    }
  }, [contextUser, navigate]);
  
  // Manejar cambios en el formulario de información personal
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar la selección de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen no debe superar los 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Crear URL para previsualización
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);

      // Subir la imagen inmediatamente después de seleccionarla
      handleImageUpload(file);
    }
  };
  
  // Manejar el envío del formulario de información personal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await userService.updateCurrentUser(formData);
      
      setUser(updatedUser);
      updateContextUser({
        ...contextUser!,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email
      });
      
      setSuccess('Información actualizada correctamente');
      setLoading(false);
      setIsEditing(false);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la información');
      setLoading(false);
      console.error('Error updating user data:', err);
    }
  };
  
  // Manejar la carga de imagen de perfil
  const handleImageUpload = async (file?: File) => {
    if (!user) return;
    
    const imageToUpload = file || selectedImage;
    if (!imageToUpload) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await userService.updateCurrentProfileImage(imageToUpload);
      
      if (updatedUser) {
        setUser(updatedUser);
        updateContextUser({
          ...contextUser!,
          profileImage: updatedUser.profileImage
        });
        
        setSuccess('Imagen de perfil actualizada correctamente');
        setSelectedImage(null);
        setPreviewUrl(null);
        
        // Limpiar el input de archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error updating profile image:', err);
      setError(err.message || 'Error al actualizar la imagen de perfil');
    } finally {
      setLoading(false);
    }
  };
  
  const getUserInitials = () => {
    if (!user) return '';
    return (user.firstName?.charAt(0) || '').toUpperCase() + (user.lastName?.charAt(0) || '').toUpperCase();
  };
  
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '/assets/default-avatar.png';
    
    // If the path is already a full URL (starts with http:// or https://), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, prepend the API URL
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${apiUrl}/${cleanPath}`;
  };
  
  if (loading && !user) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta de imagen de perfil */}
          <Card className="bg-white shadow-sm">
            <div className="p-6 flex flex-col items-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {user?.profileImage ? (
                      <img
                        src={getImageUrl(user.profileImage)}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                                ${getUserInitials()}
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-2xl font-semibold">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profileImage"
                    className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center w-10 h-10"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-800">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                </div>
                <p className="text-sm text-gray-500">
                  Haz clic en el ícono de cámara para cambiar tu foto de perfil
                </p>
              </div>
            </div>
          </Card>
          
          {/* Tarjeta de información personal */}
          <Card className="bg-white shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Información personal</h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-300"
                    >
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{user?.firstName}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Apellido</p>
                    <p className="font-medium">{user?.lastName}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Correo electrónico</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Nombre de usuario</p>
                    <p className="font-medium">{user?.username}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Tipo de usuario</p>
                    <p className="font-medium">{user?.userType}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Perfil; 