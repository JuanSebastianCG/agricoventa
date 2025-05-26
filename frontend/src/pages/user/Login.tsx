import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageContainer from '../../components/layout/PageContainer';
import useForm from '../../hooks/useForm';
import { useAppContext } from '../../context/AppContext';
import StyledInput from '../../components/ui/StyledInput';
import StyledButton from '../../components/ui/StyledButton';
import StyledCheckbox from '../../components/ui/StyledCheckbox';
import Card from '../../components/ui/Card';
import authService, { LoginData } from '../../services/authService';
import Notification from '../../components/common/Notification';

interface LoginFormValues {
  username: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Form validation function
  const validateForm = (values: LoginFormValues) => {
    const errors: Partial<Record<keyof LoginFormValues, string>> = {};
    
    if (!values.username) {
      errors.username = 'El nombre de usuario es requerido';
    }
    
    if (!values.password) {
      errors.password = 'La contraseña es requerida';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      // Prepare login data
      const loginData: LoginData = {
        username: values.username,
        password: values.password,
        remember: values.rememberMe
      };
      
      console.log('Attempting login with:', { username: values.username, remember: values.rememberMe });
      
      // Call the API to login
      const response = await authService.login(loginData);
      
      console.log('Login response:', response);
      
      // Verificar que la respuesta contiene token y datos de usuario
      if (!response || !response.token) {
        throw new Error('Respuesta del servidor inválida: falta el token de autenticación');
      }
      
      if (!response.user) {
        throw new Error('Respuesta del servidor inválida: faltan los datos del usuario');
      }
      
      // Store auth info in context
      login(response.token, response.user);
      
      // Small delay to ensure state updates
      setTimeout(() => {
        // Redirect to home page on success
        window.location.href = '/';
      }, 200);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setServerError('Nombre de usuario o contraseña inválidos. Por favor, inténtalo de nuevo.');
      } else if (error.response?.data?.error?.message) {
        setServerError(error.response.data.error.message);
      } else if (error && error.message) {
        setServerError(error.message);
      } else {
        setServerError('Error al iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const form = useForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    validate: validateForm,
    onSubmit: handleSubmit,
  });

  // Login icon
  const loginIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  return (
    <MainLayout title="Iniciar sesión">
      <PageContainer maxWidth="full" padding="none" bgColor="gray">
        <div className="flex justify-center items-center min-h-[calc(100vh-180px)]">
          <PageContainer maxWidth="md" bgColor="none" centered>
            <Card className="p-6" elevation="md">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-green-1">Iniciar Sesión</h1>
                <p className="text-gray-1 mt-2">¡Bienvenido de vuelta a tu plataforma agrícola!</p>
              </div>
              
              {serverError && (
                <Notification 
                  type="error" 
                  message={serverError} 
                  onClose={() => setServerError(null)}
                  autoClose={true}
                  autoCloseTime={8000}
                />
              )}
              
              <form onSubmit={form.handleSubmit} className="space-y-4">
                <div>
                  <StyledInput
                    name="username"
                    placeholder="Ingrese su nombre de usuario"
                    value={form.values.username}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.username ? form.errors.username : undefined}
                    label="Nombre de usuario"
                    icon={
                      <svg className="h-5 w-5 text-green-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                </div>
                
                <div>
                  <StyledInput
                    type="password"
                    name="password"
                    placeholder="Ingrese su contraseña"
                    value={form.values.password}
                    onChange={form.handleChange}
                    onBlur={form.handleBlur}
                    error={form.touched.password ? form.errors.password : undefined}
                    label="Contraseña"
                    icon={
                      <svg className="h-5 w-5 text-green-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />
                </div>
                
                <div className="mt-2">
                  <StyledCheckbox
                    id="rememberMe"
                    name="rememberMe"
                    label="Recordarme"
                    checked={form.values.rememberMe}
                    onChange={form.handleChange}
                  />
                </div>
                
                <div className="mt-4">
                  <StyledButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    leftIcon={!isSubmitting ? loginIcon : undefined}
                    fullWidth
                  >
                    {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                  </StyledButton>
                </div>
                
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-1">
                    ¡No te preocupes, solo necesitas tus credenciales, no tu contraseña de WiFi! 😉
                  </p>
                </div>
                
                <div className="text-center mt-4 pb-2">
                  <p className="text-sm text-gray-1">
                    ¿No tienes cuenta? <Link to="/register" className="text-green-1 hover:underline font-medium transition-colors">Regístrate</Link>
                  </p>
                </div>
              </form>
            </Card>
          </PageContainer>
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default Login; 