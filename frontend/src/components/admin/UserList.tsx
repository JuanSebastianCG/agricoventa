import React, { useState } from 'react';
import { User } from '../../services/userService';
import Button from '../common/Button';
import { useAppContext } from '../../context/AppContext';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onUpdateProfileImage: (userId: string, file: File) => Promise<void>;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  onEdit, 
  onDelete,
  onUpdateProfileImage 
}) => {
  const [filter, setFilter] = useState('');
  const { user: currentUser } = useAppContext();
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.fullName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleImageChange = async (userId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onUpdateProfileImage(userId, file);
      } catch (error) {
        console.error('Error al actualizar la imagen:', error);
      }
    }
  };

  const getUserInitials = (user: User) => {
    const names = user.fullName.split(' ');
    return names.map(name => name[0]).join('').toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          className="w-full p-2 border rounded-md"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <table className="min-w-full bg-white border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left border-b">Imagen</th>
            <th className="px-4 py-2 text-left border-b">Nombre</th>
            <th className="px-4 py-2 text-left border-b">Usuario</th>
            <th className="px-4 py-2 text-left border-b">Email</th>
            <th className="px-4 py-2 text-left border-b">Rol</th>
            <th className="px-4 py-2 text-left border-b">Estado</th>
            <th className="px-4 py-2 text-left border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">
                  <div className="relative w-10 h-10">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                                  ${getUserInitials(user)}
                                </div>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                          {getUserInitials(user)}
                        </div>
                      )}
                    </div>
                    {currentUser?.userType === 'ADMIN' && (
                      <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(user.id, e)}
                        />
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 border-b">{user.fullName}</td>
                <td className="px-4 py-2 border-b">{user.username}</td>
                <td className="px-4 py-2 border-b">{user.email}</td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.userType === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.userType}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2 border-b">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onEdit(user)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => onDelete(user)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                No se encontraron usuarios que coincidan con la búsqueda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList; 