import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import UserList from '../../components/admin/UserList';
import UserForm from '../../components/admin/UserForm';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import { User, UserUpdateData } from '../../services/userService';
import { getAllUsers, updateUser, deleteUser, updateProfileImage } from '../../services/userService';
import { toast } from 'react-hot-toast';

const Users: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser?.userType !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar los usuarios');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateProfileImage = async (userId: string, file: File) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      
      await updateProfileImage(userId, formData);
      await loadUsers(); // Recargar la lista de usuarios
      toast.success('Imagen de perfil actualizada correctamente');
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error('Error al actualizar la imagen de perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: UserUpdateData) => {
    try {
      setIsLoading(true);
      if (selectedUser) {
        await updateUser(selectedUser.id, data);
        toast.success('Usuario actualizado correctamente');
      }
      setIsFormOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      await deleteUser(selectedUser.id);
      toast.success('Usuario eliminado correctamente');
      setIsDeleteModalOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser?.userType !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administración de Usuarios</h1>
      
      <UserList
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onUpdateProfileImage={handleUpdateProfileImage}
      />

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <UserForm
              user={selectedUser}
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario ${selectedUser?.fullName}? Esta acción no se puede deshacer.`}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Users; 