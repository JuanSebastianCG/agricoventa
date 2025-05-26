import React, { useEffect } from 'react';
import useForm from '../../hooks/useForm';
import { User, UserUpdateData } from '../../services/userService';
import Input from '../common/Input';
import Button from '../common/Button';
import FormError from '../common/FormError';

interface UserFormProps {
  user: User | null;
  onSubmit: (data: UserUpdateData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}) => {
  const { formData, handleChange, errors, setErrors, validateForm, setFormData } = useForm<UserUpdateData>({
    fullName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true
  });

  // Cargar datos del usuario cuando se recibe
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        password: '', // No mostrar la contraseña
        role: user.role as 'user' | 'admin',
        isActive: user.isActive
      });
    }
  }, [user, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    const validationErrors: Record<string, string> = {};
    if (!formData.fullName) validationErrors.fullName = 'El nombre es obligatorio';
    if (!formData.email) validationErrors.email = 'El email es obligatorio';
    
    // Si hay errores, mostrarlos y no continuar
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Preparar datos para enviar (omitir password si está vacío)
    const dataToSubmit: UserUpdateData = {
      ...formData,
      password: formData.password ? formData.password : undefined
    };

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Nombre completo"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
        />
      </div>

      <div>
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
      </div>

      <div>
        <Input
          label="Contraseña (dejar en blanco para mantener la actual)"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        {formData.password && (
          <p className="text-xs text-gray-500 mt-1">
            La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rol
        </label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        >
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        {errors.role && <FormError message={errors.role} />}
      </div>

      <div>
        <label className="flex items-center text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={(e) => handleChange({
              target: {
                name: 'isActive',
                value: e.target.checked
              }
            } as React.ChangeEvent<HTMLInputElement>)}
            className="h-4 w-4 text-blue-600 rounded mr-2"
          />
          Usuario activo
        </label>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
};

export default UserForm; 