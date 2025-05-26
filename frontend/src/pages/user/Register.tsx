import React, { useState } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Input from '../../components/common/Input';
import AuthButton from '../../components/common/AuthButton';
import useForm from '../../hooks/useForm';
import authService, { RegisterData } from '../../services/authService';
import Notification from '../../components/common/Notification';
import FormError from '../../components/common/FormError';
import TermsModal from './TermsModal';

interface RegisterFormValues {
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  userType: 'BUYER' | 'SELLER';
  // Teléfono field
  phoneNumber: string;
  // Location fields
  addressLine1: string;
  addressLine2: string;
  city: string;
  department: string;
  postalCode: string;
  country: string;
}

const Register: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Phone icon
  const phoneIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );

  // Función para traducir mensajes de error del inglés al español
  const translateErrorMessage = (message: string): string => {
    const errorMessages: Record<string, string> = {
      "Password must contain at least one uppercase letter": "La contraseña debe contener al menos una letra mayúscula",
      "Password must contain at least one lowercase letter": "La contraseña debe contener al menos una letra minúscula",
      "Password must contain at least one number": "La contraseña debe contener al menos un número",
      "Password must contain at least one special character": "La contraseña debe contener al menos un carácter especial",
      "Password must be at least 8 characters": "La contraseña debe tener al menos 8 caracteres",
      "Username is already taken": "El nombre de usuario ya está en uso",
      "Username already exists": "El nombre de usuario ya está en uso",
      "Email is already registered": "El correo electrónico ya está registrado",
      "Email already exists": "El correo electrónico ya está registrado",
      "Username must be at least 3 characters long": "El nombre de usuario debe tener al menos 3 caracteres",
      "Username can only contain letters, numbers and underscores": "El nombre de usuario solo puede contener letras, números y guiones bajos",
      "Email is not valid": "El correo electrónico no es válido",
      "Phone number is required": "El número de teléfono es requerido",
      "Phone number must be 10 digits": "El número de teléfono debe tener 10 dígitos",
      "First name is required": "El nombre es requerido",
      "Last name is required": "El apellido es requerido",
      "Address is required": "La dirección es requerida",
      "City is required": "La ciudad es requerida",
      "Department is required": "El departamento es requerido",
      "Unique constraint failed on the constraint: `users_phone_number_key`": "Este número de teléfono ya está registrado. Por favor utilice otro número."
    };

    if (message.includes("users_phone_number_key")) {
      return "Este número de teléfono ya está registrado. Por favor utilice otro número.";
    }

    return errorMessages[message] || message;
  };

  // Form validation function
  const validateForm = (values: RegisterFormValues) => {
    const errors: Partial<Record<keyof RegisterFormValues, string>> = {};
    
    // Nombre validation
    if (!values.nombre) {
      errors.nombre = 'El nombre es requerido';
    }
    
    // Apellido validation
    if (!values.apellido) {
      errors.apellido = 'El apellido es requerido';
    }
    
    // Username validation
    if (!values.username) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (values.username.length < 3) {
      errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(values.username)) {
      errors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }
    
    // Email validation
    if (!values.email) {
      errors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Correo electrónico inválido';
    }
    
    // Phone validation
    if (!values.phoneNumber) {
      errors.phoneNumber = 'El número de teléfono es requerido';
    } else if (!/^\d{10}$/.test(values.phoneNumber)) {
      errors.phoneNumber = 'Formato inválido. Debe contener 10 dígitos';
    }
    
    // Password validation
    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    } else if (values.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else {
      // Check for uppercase
      if (!/[A-Z]/.test(values.password)) {
        errors.password = 'La contraseña debe contener al menos una letra mayúscula';
      }
      // Check for lowercase
      else if (!/[a-z]/.test(values.password)) {
        errors.password = 'La contraseña debe contener al menos una letra minúscula';
      }
      // Check for number
      else if (!/[0-9]/.test(values.password)) {
        errors.password = 'La contraseña debe contener al menos un número';
      }
    }
    
    // Confirm password validation
    if (!values.confirmPassword) {
      errors.confirmPassword = 'Confirme su contraseña';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    // Terms validation
    if (!values.acceptTerms) {
      errors.acceptTerms = 'Debe aceptar los términos y condiciones';
    }
    
    // Ubicación validations (still required)
    if (!values.addressLine1) {
      errors.addressLine1 = 'La dirección es requerida';
      setIsLocationExpanded(true); // Auto-expand if there's an error
    }
    
    if (!values.city) {
      errors.city = 'La ciudad es requerida';
      setIsLocationExpanded(true); // Auto-expand if there's an error
    }
    
    if (!values.department) {
      errors.department = 'El departamento es requerido';
      setIsLocationExpanded(true); // Auto-expand if there's an error
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Create register data
      const registerData: RegisterData = {
        username: values.username,
        email: values.email,
        password: values.password,
        firstName: values.nombre,
        lastName: values.apellido,
        phoneNumber: `+57${values.phoneNumber}`,
        userType: values.userType || 'BUYER',
        location: {
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2 || '',
          city: values.city,
          department: values.department,
          country: values.country || 'Colombia',
          postalCode: values.postalCode || ''
        }
      };
      
      // Call register API
      await authService.register(registerData);
      
      // Show success message
      setRegistrationSuccess(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Check for specific constraint error on phone number
      if (error.response?.data?.error?.message && 
          error.response.data.error.message.includes('users_phone_number_key')) {
        setServerError('Este número de teléfono ya está registrado. Por favor utilice otro número.');
        return;
      }
      
      // Handle different error types
      if (error && error.status === 409) {
        setServerError('El nombre de usuario o correo electrónico ya está registrado.');
      } else if (error.response?.data?.error?.details && Array.isArray(error.response.data.error.details)) {
        // Extract validation errors from response
        const validationErrors = error.response.data.error.details.map((detail: any) => 
          `${translateErrorMessage(detail.message || detail.path || "")}`
        );
        setServerError(validationErrors.join('. '));
      } else if (error && error.error && error.error.details && Array.isArray(error.error.details)) {
        // Extract validation errors from the server and translate them
        const validationErrors = error.error.details.map((detail: any) => 
          `${translateErrorMessage(detail.message)} (${detail.path})`
        );
        setServerError(validationErrors.join('. '));
      } else if (error && error.errors && Array.isArray(error.errors)) {
        // Format validation errors array from the server
        const translatedErrors = error.errors.map(translateErrorMessage);
        setServerError(translatedErrors.join('. '));
      } else if (error && typeof error.errors === 'object') {
        // Format validation errors object from the server
        const errorValues = Object.values(error.errors).flat();
        const translatedErrors = errorValues.map((msg: any) => 
          typeof msg === 'string' ? translateErrorMessage(msg) : msg
        );
        setServerError(translatedErrors.join('. '));
      } else if (error && error.error && error.error.message) {
        // Handle structured error message
        setServerError(translateErrorMessage(error.error.message));
      } else if (error.response?.data?.error?.message) {
        // Direct error message from response
        setServerError(translateErrorMessage(error.response.data.error.message));
      } else if (error && error.message) {
        setServerError(translateErrorMessage(error.message));
      } else {
        setServerError('Error en el registro. Por favor, inténtelo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useForm<RegisterFormValues>({
    initialValues: {
      nombre: '',
      apellido: '',
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      userType: 'BUYER',
      // Location fields (still required)
      addressLine1: '',
      addressLine2: '',
      city: '',
      department: '',
      postalCode: '',
      country: 'Colombia'
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  // Toggle location dropdown
  const toggleLocationDropdown = () => {
    setIsLocationExpanded(!isLocationExpanded);
  };

  // Register icon
  const registerIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  // Login icon
  const loginIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  // Location icon
  const locationIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // Chevron icon (for dropdown)
  const chevronIcon = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={`h-5 w-5 transition-transform duration-300 ${isLocationExpanded ? 'rotate-180' : ''}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  // Check if any location field has an error
  const hasLocationErrors = () => {
    return !!(form.touched.addressLine1 && form.errors.addressLine1) || 
           !!(form.touched.city && form.errors.city) || 
           !!(form.touched.department && form.errors.department);
  };

  // Función para mostrar el modal de términos y condiciones
  const openTermsModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTermsModal(true);
  };

  // Función para cerrar el modal de términos y condiciones
  const closeTermsModal = () => {
    setShowTermsModal(false);
  };

  // Función para aceptar los términos y condiciones
  const acceptTerms = () => {
    form.setFieldValue('acceptTerms', true);
    setShowTermsModal(false);
  };

  return (
    <MainLayout title="Registro">
      {/* Modal de términos y condiciones */}
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={closeTermsModal} 
        onAccept={acceptTerms}
      />
      
      <div className="flex justify-center items-center min-h-[calc(100vh-180px)] py-10 px-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-green-1">Crear Cuenta</h1>
            <p className="text-gray-1 mt-2">Únete a nuestra comunidad hoy</p>
          </div>
          
          {serverError && (
            <Notification 
              type="error" 
              message={serverError} 
              onClose={() => setServerError(null)}
              autoClose={false}
              autoCloseTime={12000}
            />
          )}
          
          {registrationSuccess ? (
            <div className="text-center py-6">
              <Notification 
                type="success" 
                message="¡Su cuenta ha sido creada exitosamente! Ya puede iniciar sesión con sus credenciales."
              />
              <div className="mb-4 p-4 bg-green-0-5 rounded-full inline-flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">¡Registro Exitoso!</h2>
              <p className="text-gray-1 mb-6">Su cuenta ha sido creada exitosamente.</p>
              <AuthButton 
                icon={loginIcon}
                onClick={() => window.location.href = '/login'}
                fullWidth={false}
                className="mx-auto bg-green-1 text-white hover:bg-green-0-9 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Iniciar Sesión
              </AuthButton>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Nombre"
                    type="text"
                    name="nombre"
                    placeholder="Ingrese su nombre"
                    value={form.values.nombre}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.nombre && !!form.errors.nombre}
                    helperText={form.touched.nombre ? form.errors.nombre : ''}
                    fullWidth
                  />
                </div>
                <div>
                  <Input
                    label="Apellido"
                    type="text"
                    name="apellido"
                    placeholder="Ingrese su apellido"
                    value={form.values.apellido}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.apellido && !!form.errors.apellido}
                    helperText={form.touched.apellido ? form.errors.apellido : ''}
                    fullWidth
                  />
                </div>
              </div>
              
              <div>
                <Input
                  label="Nombre de usuario"
                  type="text"
                  name="username"
                  placeholder="Elija un nombre de usuario único"
                  value={form.values.username}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.username && !!form.errors.username}
                  helperText={form.touched.username ? form.errors.username : ''}
                  fullWidth
                />
              </div>
              
              <div>
                <Input
                  label="Correo electrónico"
                  type="email"
                  name="email"
                  placeholder="Ingrese su correo electrónico"
                  value={form.values.email}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.email && !!form.errors.email}
                  helperText={form.touched.email ? form.errors.email : ''}
                  fullWidth
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-1 mb-2">
                  Número de teléfono
                </label>
                <div className="relative flex">
                  <div className="flex items-center justify-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-0-5 rounded-l-md text-gray-1 font-medium">
                    +57
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="3XX XXX XXXX"
                    value={form.values.phoneNumber}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    className={`py-2 px-4 w-full border rounded-r-md focus:outline-none transition-colors ${
                      form.touched.phoneNumber && form.errors.phoneNumber 
                        ? 'border-red-1 text-red-1 focus:border-red-1' 
                        : 'border-gray-0-5 focus:border-green-1'
                    }`}
                  />
                </div>
                {form.touched.phoneNumber && form.errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-1">{form.errors.phoneNumber}</p>
                )}
              </div>
              
              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  placeholder="Cree una contraseña segura"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.password && !!form.errors.password}
                  helperText={form.touched.password ? form.errors.password : ''}
                  fullWidth
                  showPasswordToggle
                />
              </div>
              
              <div>
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  name="confirmPassword"
                  placeholder="Repita su contraseña"
                  value={form.values.confirmPassword}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  error={form.touched.confirmPassword && !!form.errors.confirmPassword}
                  helperText={form.touched.confirmPassword ? form.errors.confirmPassword : ''}
                  fullWidth
                  showPasswordToggle
                />
              </div>
              
              {/* Location section - now as dropdown */}
              <div className="mt-6 border border-gray-0-5 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={toggleLocationDropdown}
                  className={`w-full flex items-center justify-between p-4 text-left transition-colors ${hasLocationErrors() ? 'bg-red-50' : 'bg-gray-50'} hover:bg-gray-100`}
                >
                  <div className="flex items-center">
                    <div className={`mr-2 ${hasLocationErrors() ? 'text-red-500' : 'text-green-1'}`}>
                      {locationIcon}
                    </div>
                    <h3 className={`text-lg font-medium ${hasLocationErrors() ? 'text-red-500' : 'text-gray-1'}`}>
                      Información de ubicación
                    </h3>
                    {hasLocationErrors() && (
                      <div className="ml-2 text-red-500 text-sm">
                        * Campos requeridos
                      </div>
                    )}
                  </div>
                  <div className={`${hasLocationErrors() ? 'text-red-500' : 'text-green-1'}`}>
                    {chevronIcon}
                  </div>
                </button>
                
                {isLocationExpanded && (
                  <div className="p-4 space-y-4 animate-fadeIn">
                    <div>
                      <Input
                        label="Dirección"
                        type="text"
                        name="addressLine1"
                        placeholder="Ej. Calle 50 # 45-67"
                        value={form.values.addressLine1}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        error={form.touched.addressLine1 && !!form.errors.addressLine1}
                        helperText={form.touched.addressLine1 ? form.errors.addressLine1 : ''}
                        fullWidth
                      />
                    </div>
                    
                    <div>
                      <Input
                        label="Dirección complementaria (opcional)"
                        type="text"
                        name="addressLine2"
                        placeholder="Ej. Apto 301, Torre B"
                        value={form.values.addressLine2}
                        onChange={form.handleChange}
                        onBlur={form.handleBlur}
                        error={form.touched.addressLine2 && !!form.errors.addressLine2}
                        helperText={form.touched.addressLine2 ? form.errors.addressLine2 : ''}
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Ciudad"
                          type="text"
                          name="city"
                          placeholder="Ej. Medellín"
                          value={form.values.city}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          error={form.touched.city && !!form.errors.city}
                          helperText={form.touched.city ? form.errors.city : ''}
                          fullWidth
                        />
                      </div>
                      
                      <div>
                        <Input
                          label="Departamento"
                          type="text"
                          name="department"
                          placeholder="Ej. Antioquia"
                          value={form.values.department}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          error={form.touched.department && !!form.errors.department}
                          helperText={form.touched.department ? form.errors.department : ''}
                          fullWidth
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Código Postal"
                          type="text"
                          name="postalCode"
                          placeholder="Ej. 050001"
                          value={form.values.postalCode}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          error={form.touched.postalCode && !!form.errors.postalCode}
                          helperText={form.touched.postalCode ? form.errors.postalCode : ''}
                          fullWidth
                        />
                      </div>
                      <div>
                        <Input
                          label="País"
                          type="text"
                          name="country"
                          placeholder="Ej. Colombia"
                          value={form.values.country}
                          onChange={form.handleChange}
                          onBlur={form.handleBlur}
                          error={form.touched.country && !!form.errors.country}
                          helperText={form.touched.country ? form.errors.country : ''}
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start my-4">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={form.values.acceptTerms}
                    onChange={form.handleChange}
                    className="w-4 h-4 border border-gray-0-9 rounded bg-gray-0-5 accent-green-1 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="font-medium text-gray-1 cursor-pointer">
                    Acepto los <a 
                      href="#" 
                      onClick={openTermsModal}
                      className="text-green-1 hover:underline"
                    >
                      términos y condiciones
                    </a>
                  </label>
                  {form.touched.acceptTerms && form.errors.acceptTerms && (
                    <FormError message={form.errors.acceptTerms} />
                  )}
                </div>
              </div>
              
              <div className="pt-4">
                <AuthButton
                  type="submit"
                  icon={registerIcon}
                  isLoading={isSubmitting}
                  fullWidth
                  className="bg-green-1 text-white hover:bg-green-0-9 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Crear Cuenta
                </AuthButton>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-gray-1">
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/login" className="text-green-1 font-medium hover:text-green-0-9">
                    Iniciar Sesión
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Register; 