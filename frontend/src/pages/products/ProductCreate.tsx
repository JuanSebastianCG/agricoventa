import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import FormField from '../../components/ui/FormField';
import StyledInput from '../../components/ui/StyledInput';
import StyledTextArea from '../../components/ui/StyledTextArea';
import StyledButton from '../../components/ui/StyledButton';
import StyledBorder from '../../components/ui/StyledBorder';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { certificationService } from '../../services/certificationService';
import categoryService from '../../services/categoryService';
import locationService, { COLOMBIAN_DEPARTMENTS, ILocation } from '../../services/locationService';
import { ICategory } from '../../interfaces/category';
import Header from '../../components/layout/Header';
import UserProfile from '../../components/common/UserProfile';

// Assuming you might want similar icons to Register.tsx, define or import them
// For now, using placeholder text or simple SVGs if needed directly
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const ProductCreate: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const isEditMode = !!productId;
  const { isAuthenticated, user } = useAppContext();
  
  const [isCertificateChecking, setIsCertificateChecking] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    originLocationId: '', // Will hold ID if existing location is selected
    price: '',
    availableQuantity: '',
    unitMeasure: '',
    isFeatured: false
  });

  // Location specific state
  const [userLocations, setUserLocations] = useState<ILocation[]>([]);
  const [isLoadingUserLocations, setIsLoadingUserLocations] = useState(false);
  const [isLocationSectionExpanded, setIsLocationSectionExpanded] = useState(false);
  const [locationSelectionMode, setLocationSelectionMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [newLocationData, setNewLocationData] = useState<Partial<ILocation>>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    department: '',
    postalCode: '',
    country: 'Colombia' // Default country
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; imageUrl: string }[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [categoriesList, setCategoriesList] = useState<ICategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [selectedParentCategoryId, setSelectedParentCategoryId] = useState<string>('');

  const [showNewLocationFields, setShowNewLocationFields] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    // Allow any user type to access this page
    // No redirection based on user type
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkCertifications = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setIsCertificateChecking(true);
          // Los administradores no necesitan certificados para crear productos
          if (user.userType === 'ADMIN') {
            console.log("[ProductCreate] Usuario es ADMIN, omitiendo verificación de certificados");
            setIsCertificateChecking(false);
            return;
          }
          // Cualquier usuario (no solo SELLER) puede crear productos si tiene los certificados
          console.log("[ProductCreate] Verificando certificados para usuario:", user.id);
          const certificationStatus = await certificationService.verifyUserCertifications(user.id);
          console.log("[ProductCreate] Resultado de verificación:", JSON.stringify(certificationStatus));
          
          if (!certificationStatus.hasAllCertifications) {
            console.log("[ProductCreate] Usuario no tiene todos los certificados necesarios");
            setSubmitError('Para crear productos necesitas tener los 4 certificados colombianos verificados. Puedes completarlos en la sección de certificados.');
            // No redireccionar automáticamente - solo mostrar la advertencia
          } else {
            console.log("[ProductCreate] Usuario tiene todos los certificados necesarios");
          }
        } catch (err) {
          console.error("[ProductCreate] Error checking user certifications:", err);
          setSubmitError('Error al verificar tus certificados. Por favor, intenta nuevamente más tarde.');
        } finally {
          setIsCertificateChecking(false);
        }
      }
    };
    checkCertifications();
  }, [isAuthenticated, user]); // Removed navigate from dependencies

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoriesList([]);
      try {
        const response = await categoryService.getAllCategories();
        console.log("[ProductCreate] Categories fetched:", response);
        
        // Si ya tenemos un array de categorías, usémoslo directamente
        if (Array.isArray(response)) {
          setCategoriesList(response);
        } else {
          console.error("[ProductCreate] getAllCategories did not return an array as expected:", response);
          setCategoriesList([]);
        }
      } catch (error) {
        console.error("[ProductCreate] Error fetching categories:", error);
        setCategoriesList([]);
        
        // Intento de recuperación: obtener categorías con getCategories en lugar de getAllCategories
        try {
          console.log("[ProductCreate] Attempting recovery with getCategories");
          const recoveryResponse = await categoryService.getCategories({
            includeChildren: true,
            includeParent: true
          });
          
          if (recoveryResponse && Array.isArray(recoveryResponse.categories)) {
            console.log("[ProductCreate] Recovery successful, got categories:", recoveryResponse.categories.length);
            setCategoriesList(recoveryResponse.categories);
          }
        } catch (recoveryError) {
          console.error("[ProductCreate] Recovery attempt also failed:", recoveryError);
        }
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch User Locations
  useEffect(() => {
    const fetchUserLocationsAndPrimary = async () => {
      if (user?.id) {
        setIsLoadingUserLocations(true);
        try {
          // Fetch all user locations (existing behavior)
          const allLocations = await locationService.getUserLocations(user.id);
          let primaryLocation: ILocation | null = null;

          // Fetch user's primary location
          try {
            primaryLocation = await locationService.getCurrentUserPrimaryLocation();
          } catch (primaryLocError) {
            console.error("[ProductCreate] Error fetching user's primary location specifically, continuing with all locations:", primaryLocError);
            // Non-fatal, proceed with whatever allLocations returned
          }

          let combinedLocations = [...allLocations];
          if (primaryLocation) {
            // Add primary to the list if not already present
            if (!allLocations.some(loc => loc.id === primaryLocation!.id)) {
              combinedLocations = [primaryLocation, ...allLocations]; // Prioritize primary by adding it to the front
            }
            // If creating a new product and no location is selected yet, pre-select the primary location.
            if (!isEditMode && !formData.originLocationId) {
              setFormData(prev => ({ ...prev, originLocationId: primaryLocation!.id }));
              setLocationSelectionMode('EXISTING'); // Ensure mode is set to existing
            }
          }
          
          setUserLocations(combinedLocations);

          // If editing and product has an originLocationId, it should be handled by loadProductData or already be in formData
          // If creating and no primary location was found, but other locations exist, do nothing here (user has to pick)

        } catch (error) {
          console.error("[ProductCreate] Error fetching user locations (general list):", error);
          setUserLocations([]); // Clear locations on general error
        } finally {
          setIsLoadingUserLocations(false);
        }
      }
    };

    if (!isCertificateChecking) { // Fetch locations after certificate check
      fetchUserLocationsAndPrimary();
    }
  }, [user?.id, isCertificateChecking, isEditMode]); // formData.originLocationId removed to prevent re-triggering on its own change

  const topLevelCategories = useMemo(() => {
    return categoriesList;
  }, [categoriesList]);

  const childCategoriesMap = useMemo(() => {
    const map = new Map<string, ICategory[]>();
    if (categoriesList) {
        categoriesList.forEach(parentCategory => {
          if (parentCategory.children && Array.isArray(parentCategory.children) && parentCategory.children.length > 0) {
            map.set(parentCategory.id, parentCategory.children);
          } else {
            map.set(parentCategory.id, []); 
          }
        });
    }
    return map;
  }, [categoriesList]);

  const currentChildCategories = useMemo(() => {
    if (!selectedParentCategoryId) return [];
    const children = childCategoriesMap.get(selectedParentCategoryId) || [];
    return children;
  }, [selectedParentCategoryId, childCategoriesMap]);
  
  // Add a helper function to handle image URLs correctly
  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return '';
    
    // If the path is already a full URL (starts with http:// or https://), use it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Otherwise, prepend the API URL
    const apiUrl = import.meta.env.VITE_BACKEND_URL;
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${apiUrl}/${cleanPath}`;
  };

  // Update the loadProductData function to properly handle image URLs
  const loadProductData = useCallback(async (productIdToLoad: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/products/${productIdToLoad}`);
      if (response.data.success) {
        const product = response.data.data;
        console.log("[ProductCreate] Loaded product:", product);
        
        const productCategoryId = product.categoryId || '';
        let parentIdToSet = '';
        
        // Buscar si esta categoría existe en nuestro listado
        console.log("[ProductCreate] Searching for category in list:", categoriesList.length, "categories");
        const productCategory = categoriesList.find(c => c.id === productCategoryId);
        
        if (productCategory) {
          console.log("[ProductCreate] Found product category:", productCategory);
          // Si la categoría tiene un padre, esta es una subcategoría
          if (productCategory.parentId) {
            parentIdToSet = productCategory.parentId;
            console.log("[ProductCreate] Setting parent category ID:", parentIdToSet);
          } else {
            // Si no tiene padre, es una categoría principal
            parentIdToSet = productCategory.id;
            console.log("[ProductCreate] Category is a parent category itself");
          }
        } else {
          // Si no encontramos la categoría, es posible que necesitemos buscar en subcategorías
          console.log("[ProductCreate] Category not found in top-level list, searching in subcategories");
          for (const parentCategory of categoriesList) {
            if (parentCategory.children && Array.isArray(parentCategory.children)) {
              const subcategory = parentCategory.children.find(sub => sub.id === productCategoryId);
              if (subcategory) {
                console.log("[ProductCreate] Found category as a subcategory of:", parentCategory.name);
                parentIdToSet = parentCategory.id;
                break;
              }
            }
          }
        }

        setFormData({
          name: product.name || '',
          categoryId: productCategoryId,
          description: product.description || '',
          originLocationId: product.originLocationId || '',
          price: product.basePrice?.toString() || '',
          availableQuantity: product.stockQuantity?.toString() || '',
          unitMeasure: product.unitMeasure || '',
          isFeatured: product.isFeatured || false
        });
        
        // Establecer categoría principal antes de la subcategoría
        if (parentIdToSet) {
          console.log("[ProductCreate] Setting selected parent category:", parentIdToSet);
          setSelectedParentCategoryId(parentIdToSet);
          // No establecemos aquí categoryId porque ya lo hicimos en setFormData
        }

        if (product.images && Array.isArray(product.images)) {
          // Store the full image objects, not just URLs
          setExistingImages(product.images.map((img: any) => ({
            id: img.id,
            imageUrl: img.imageUrl || img
          })));
        }
      } else {
        setSubmitError('Error al cargar los datos del producto para editar.');
        navigate('/pages/products/my-products');
      }
    } catch (err) {
      setSubmitError('Error grave al cargar los datos del producto.');
      console.error('Error loading product data for edit:', err);
      navigate('/pages/products/my-products');
    } finally {
      setIsLoading(false);
    }
  }, [categoriesList, navigate]);
  
  useEffect(() => {
    if (isEditMode && productId && !isCertificateChecking && categoriesList.length > 0) {
        // Delay loading product data until user locations are also potentially loaded, or handle pre-selection better
        if (!isLoadingUserLocations) { // Ensure locations are fetched before trying to match product's location
            loadProductData(productId);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isEditMode, productId, isCertificateChecking, categoriesList, isLoadingUserLocations]); // loadProductData is stable, added isLoadingUserLocations

  const toggleLocationSectionExpanded = () => {
    setIsLocationSectionExpanded(prev => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // console.log(`[ProductCreate] handleInputChange: name=${name}, value=${value}, type=${type}`);

    if (name === 'parentCategory') {
      setSelectedParentCategoryId(value);
      setFormData(prev => ({ ...prev, categoryId: '' })); // Clear subcategory when parent changes
      if (childCategoriesMap.get(value)?.length === 0) {
        setFormData(prev => ({ ...prev, categoryId: value }));
      }
    } else if (name === 'locationSelectionMode') {
      setLocationSelectionMode(value as 'EXISTING' | 'NEW');
      if (value === 'EXISTING') {
        setNewLocationData({ addressLine1: '', addressLine2: '', city: '', department: '', postalCode: '', country: 'Colombia' });
        // Potentially clear errors for newLocationData fields
        setErrors(prev => ({...prev, newLocAddressLine1: '', newLocCity: '', newLocDepartment: ''})); 
      } else {
        setFormData(prev => ({ ...prev, originLocationId: '' })); // Clear existing selection if switching to NEW
      }
    } else if (name.startsWith('newLoc')) {
      const fieldKey = name.substring(6).charAt(0).toLowerCase() + name.substring(7) as keyof Partial<ILocation>; // e.g. newLocAddressLine1 -> addressLine1
      setNewLocationData(prev => ({ ...prev, [fieldKey]: value }));
      if (errors[name]) setErrors(prev => ({...prev, [name]: ''})); // Clear error for this specific new location field
    } else if (name === 'originLocationId') {
      setFormData(prev => ({ ...prev, originLocationId: value }));
      setLocationSelectionMode('EXISTING'); // Ensure mode is EXISTING if they select from dropdown
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }

    if (errors[name] && !name.startsWith('newLoc')) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFiles(files);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    const newFiles = [...selectedFiles]; newFiles.splice(index, 1); setSelectedFiles(newFiles);
    const newPreviewUrls = [...previewUrls]; newPreviewUrls.splice(index, 1); setPreviewUrls(newPreviewUrls);
  };

  const removeExistingImage = (index: number) => {
    const removedImage = existingImages[index];
    setDeletedImageIds(prev => [...prev, removedImage.id]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.categoryId) newErrors.categoryId = 'La categoría es requerida (selecciona una subcategoría si aplica)';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    
    if (locationSelectionMode === 'NEW') {
      if (!newLocationData.addressLine1?.trim()) newErrors.newLocAddressLine1 = 'La dirección es requerida';
      if (!newLocationData.city?.trim()) newErrors.newLocCity = 'La ciudad es requerida';
      if (!newLocationData.department?.trim()) newErrors.newLocDepartment = 'El departamento es requerido';
      // Add validation for other newLocationData fields if they become mandatory
    } else { // EXISTING mode
      if (!formData.originLocationId) newErrors.originLocationId = 'Debe seleccionar una ubicación de origen existente o crear una nueva.';
    }

    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) newErrors.price = 'El precio debe ser un número mayor que cero';
    if (!formData.availableQuantity.trim()) newErrors.availableQuantity = 'La cantidad disponible es requerida';
    else if (isNaN(parseFloat(formData.availableQuantity)) || parseFloat(formData.availableQuantity) < 0) newErrors.availableQuantity = 'La cantidad disponible debe ser un número positivo o cero';
    if (!formData.unitMeasure) newErrors.unitMeasure = 'La unidad de medida es requerida';
    if (existingImages.length === 0 && selectedFiles.length === 0) newErrors.images = 'Debes proporcionar al menos una imagen del producto';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ProductCreate] Iniciando envío del formulario");
    
    if (!validateForm()) {
      console.log("[ProductCreate] Formulario no válido, abortando envío");
      return;
    }
    
    // Verificar certificados antes de crear/editar producto
    if (user?.userType !== 'ADMIN' && isAuthenticated && user?.id) {
      try {
        console.log("[ProductCreate] Verificando certificados para usuario no-admin:", user.id);
        setIsSubmitting(true);
        const certificationStatus = await certificationService.verifyUserCertifications(user.id);
        console.log("[ProductCreate] Resultado de verificación:", JSON.stringify(certificationStatus));
        
        if (!certificationStatus.hasAllCertifications) {
          console.log("[ProductCreate] Usuario no tiene todos los certificados necesarios, abortando");
          setSubmitError('Para crear productos necesitas tener los 4 certificados colombianos verificados. Completa tus certificaciones antes de continuar.');
          setIsSubmitting(false);
          // Don't redirect automatically
          // navigate('/certificados');
          return;
        } else {
          console.log("[ProductCreate] Usuario tiene todos los certificados, continuando");
        }
      } catch (err) {
        console.error("[ProductCreate] Error verificando certificados:", err);
        setSubmitError('Error al verificar tus certificados. Por favor, intenta nuevamente.');
        setIsSubmitting(false);
        return;
      }
    } else {
      console.log("[ProductCreate] Omitiendo verificación de certificados para admin o usuario no autenticado");
    }
    
    setSubmitError(null);
    let finalOriginLocationId = formData.originLocationId;

    try {
      // MODIFIED: Create location first if new location fields are shown
      if (locationSelectionMode === 'NEW') {
        if (!user?.id) {
          setSubmitError("Error: Usuario no identificado para crear la ubicación.");
          setIsSubmitting(false);
          return;
        }
        try {
          // Add any other necessary fields for location creation if your backend expects them
          // e.g., country, postalCode. For now, using what's in newLocationData.
          const createdLocation = await locationService.createLocation({
            ...newLocationData,
            // userId: user.id, // If your location service needs userId directly for creation
          });
          finalOriginLocationId = createdLocation.id;
          // Optionally, add to userLocations state if you want it in the dropdown immediately after
          setUserLocations(prev => [...prev, createdLocation]);
        } catch (locError: any) {
          console.error("[ProductCreate] Error creating new location:", locError);
          setSubmitError(`Error al crear la nueva ubicación: ${locError.message || 'Error desconocido'}`);
          setIsSubmitting(false);
          return;
        }
      }

      console.log("[ProductCreate] handleSubmit: finalOriginLocationId before product save:", finalOriginLocationId);

      if (!finalOriginLocationId) {
        setSubmitError("Error: La ubicación de origen es requerida y no se pudo determinar (después de intento de creación).");
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('originLocationId', finalOriginLocationId); 
      formDataToSend.append('basePrice', formData.price); 
      formDataToSend.append('stockQuantity', formData.availableQuantity);
      formDataToSend.append('unitMeasure', formData.unitMeasure);
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      
      if (user && user.id) {
        formDataToSend.append('sellerId', user.id);
      } else {
        console.error("[ProductCreate] handleSubmit: User ID not available for sellerId just before appending to FormData.");
        setSubmitError('Error: No se pudo identificar al vendedor (ID faltante). Por favor, reintenta.');
        setIsSubmitting(false);
        return;
      }
      
      // Log FormData before sending
      console.log("[ProductCreate] handleSubmit: FormData to be sent for product creation:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}: ${value instanceof File ? value.name : value}`);
      }
      
      // Update the field name to 'productImages' to match the backend middleware
      selectedFiles.forEach(file => formDataToSend.append('productImages', file));
      existingImages.forEach(image => formDataToSend.append('existingImages[]', image.imageUrl));
      
      // Add deleted image IDs to the form data
      deletedImageIds.forEach(id => formDataToSend.append('imagesToDelete', id));

      let response;
      if (isEditMode && productId) {
        response = await api.put(`/products/${productId}`, formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' }});
      } else {
        response = await api.post('/products', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' }});
      }
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Ya no redireccionamos automáticamente
        // setTimeout(() => { 
        //   navigate('/mis-productos');
        // }, 1500);
      } else {
        throw new Error(response.data.error?.message || 'Error al guardar el producto');
      }
    } catch (err: any) {
      console.error('Error submitting product:', err);
      const backendError = err.response?.data?.error?.details || err.response?.data?.error?.message || err.response?.data?.message || err.message;
      setSubmitError(backendError ? `Error del servidor: ${typeof backendError === 'string' ? backendError : JSON.stringify(backendError)}` : 'Error desconocido al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    navigate('/mis-productos');
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <div className="p-4">
            <UserProfile user={user} variant="detailed" showActions={false} />
          </div>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}
          </h1>
        </div>

        <Card className="mb-8">
          {isLoading && !isEditMode ? ( // Only show main loader for edit mode initial load
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              {submitError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                  <p>{submitError}</p>
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                  <p>
                    {isEditMode
                      ? 'Producto actualizado correctamente.'
                      : 'Producto creado correctamente.'}
                  </p>
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Información Básica</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Nombre del Producto"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    error={errors.name}
                    required
                  />
                  
                  <FormField
                    label="Categoría Principal"
                    name="parentCategory"
                    value={selectedParentCategoryId}
                    onChange={handleInputChange}
                    error={errors.categoryId} 
                  >
                    <select
                      name="parentCategory"
                      value={selectedParentCategoryId}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${
                        errors.categoryId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isLoadingCategories}
                    >
                      <option value="">
                        {isLoadingCategories ? "Cargando categorías..." : "Selecciona Categoría Principal"}
                      </option>
                      {!isLoadingCategories && topLevelCategories.length === 0 && (
                        <option value="" disabled>No hay categorías principales</option>
                      )}
                      {topLevelCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </FormField>

                  {selectedParentCategoryId && currentChildCategories.length > 0 && (
                    <FormField
                      label="Subcategoría"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      error={errors.categoryId}
                      required={currentChildCategories.length > 0}
                    >
                      <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${
                          errors.categoryId ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isLoadingCategories || currentChildCategories.length === 0}
                      >
                        <option value="">
                          {isLoadingCategories 
                            ? "Cargando..." 
                            : "Selecciona Subcategoría"}
                        </option>
                        {currentChildCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  )}
                   {/* Show categoryId directly if parent has no children and is selected */}
                   {selectedParentCategoryId && currentChildCategories.length === 0 && formData.categoryId && (
                     <div className="md:col-span-1 p-2 bg-gray-50 rounded-md">
                       <p className="text-sm text-gray-600">Categoría Seleccionada:</p>
                       <p className="font-medium">{topLevelCategories.find(c => c.id === formData.categoryId)?.name || 'N/A'}</p>
                     </div>
                   )}
                </div>

                <div className="mt-6">
                  <StyledTextArea
                    label="Descripción"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    error={errors.description}
                    required
                  />
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Detalles del Producto y Origen</h2>
                
                {/* Collapsible Location Section Start */}
                <div className="mt-6 border border-gray-300 rounded-md overflow-hidden mb-6">
                  <button
                    type="button"
                    onClick={toggleLocationSectionExpanded}
                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${(errors.originLocationId || errors.newLocAddressLine1 || errors.newLocCity || errors.newLocDepartment) ? 'bg-red-50' : 'bg-gray-50'} hover:bg-gray-100`}
                  >
                    <div className="flex items-center">
                      <div className={`mr-2 ${(errors.originLocationId || errors.newLocAddressLine1 || errors.newLocCity || errors.newLocDepartment) ? 'text-red-500' : 'text-green-1'}`}>
                        <LocationIcon />
                      </div>
                      <h3 className={`text-lg font-medium ${(errors.originLocationId || errors.newLocAddressLine1 || errors.newLocCity || errors.newLocDepartment) ? 'text-red-500' : 'text-gray-800'}`}>
                        Ubicación de Origen del Producto
                      </h3>
                      {(errors.originLocationId || errors.newLocAddressLine1 || errors.newLocCity || errors.newLocDepartment) && (
                        <div className="ml-2 text-red-500 text-sm">
                          * Información requerida
                        </div>
                      )}
                    </div>
                    <div className={`transition-transform duration-300 ${isLocationSectionExpanded ? 'rotate-180' : ''} ${(errors.originLocationId || errors.newLocAddressLine1 || errors.newLocCity || errors.newLocDepartment) ? 'text-red-500' : 'text-green-1'}`}>
                      <ChevronDownIcon />
                    </div>
                  </button>

                  {isLocationSectionExpanded && (
                    <div className="p-6 space-y-4 bg-white border-t border-gray-300">
                      <div className="flex items-center space-x-4 mb-4">
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="radio" 
                            name="locationSelectionMode" 
                            value="EXISTING"
                            checked={locationSelectionMode === 'EXISTING'}
                            onChange={handleInputChange}
                            className="form-radio h-4 w-4 text-green-1 focus:ring-green-1"
                          />
                          <span className="ml-2 text-gray-700">Usar ubicación existente</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input 
                            type="radio" 
                            name="locationSelectionMode" 
                            value="NEW"
                            checked={locationSelectionMode === 'NEW'}
                            onChange={handleInputChange}
                            className="form-radio h-4 w-4 text-green-1 focus:ring-green-1"
                          />
                          <span className="ml-2 text-gray-700">Crear nueva ubicación</span>
                        </label>
                      </div>

                      {locationSelectionMode === 'EXISTING' && (
                        <div className="space-y-4">
                          <FormField 
                            label="Seleccionar Ubicación Existente"
                            name="originLocationId"
                            value={formData.originLocationId}
                            onChange={handleInputChange}
                            error={errors.originLocationId}
                            required={locationSelectionMode === 'EXISTING'}
                          >
                            <select
                              name="originLocationId"
                              value={formData.originLocationId}
                              onChange={handleInputChange}
                              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-1 ${errors.originLocationId ? 'border-red-500' : 'border-gray-300'}`}
                              disabled={isLoadingUserLocations}
                            >
                              <option value="">{isLoadingUserLocations ? "Cargando..." : "Seleccionar..."}</option>
                              {userLocations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.addressLine1} ({loc.city}, {loc.department})
                                </option>
                              ))}
                            </select>
                          </FormField>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Región (Departamento)</label>
                              <div className="p-2 bg-gray-50 border border-gray-300 rounded-md">
                                <p className="text-gray-800">
                                  {userLocations.find(loc => loc.id === formData.originLocationId)?.department || 'No seleccionado'}
                                </p>
                              </div>
                          </div>
                        </div>
                      )}

                      {locationSelectionMode === 'NEW' && (
                        <div className="space-y-4">
                          <StyledInput
                            label="Dirección Principal"
                            name="newLocAddressLine1"
                            value={newLocationData.addressLine1 || ''}
                            onChange={handleInputChange}
                            error={errors.newLocAddressLine1}
                            required
                            placeholder="Ej. Calle 50 # 45-67"
                          />
                          <StyledInput
                            label="Dirección Complementaria (Opcional)"
                            name="newLocAddressLine2"
                            value={newLocationData.addressLine2 || ''}
                            onChange={handleInputChange}
                            placeholder="Ej. Apto 301, Torre B"
                          />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StyledInput
                              label="Ciudad"
                              name="newLocCity"
                              value={newLocationData.city || ''}
                              onChange={handleInputChange}
                              error={errors.newLocCity}
                              required
                              placeholder="Ej. Medellín"
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Departamento <span className="text-red-1">*</span>
                              </label>
                              <select
                              name="newLocDepartment"
                              value={newLocationData.department || ''}
                              onChange={handleInputChange}
                                className={`w-full py-2 px-3 border ${
                                  errors.newLocDepartment ? 'border-red-500' : 'border-gray-300'
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-1`}
                              required
                              >
                                <option value="">Seleccionar Departamento</option>
                                {COLOMBIAN_DEPARTMENTS.map(department => (
                                  <option key={department} value={department}>
                                    {department}
                                  </option>
                                ))}
                              </select>
                              {errors.newLocDepartment && (
                                <p className="mt-1 text-sm text-red-500">{errors.newLocDepartment}</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <StyledInput
                              label="Código Postal (Opcional)"
                              name="newLocPostalCode"
                              value={newLocationData.postalCode || ''}
                              onChange={handleInputChange}
                              placeholder="Ej. 050001"
                            />
                            <StyledInput
                              label="País"
                              name="newLocCountry"
                              value={newLocationData.country || 'Colombia'} // Default to Colombia
                              onChange={handleInputChange}
                              // Potentially make this read-only if always Colombia or validate if changed
                              // required 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Collapsible Location Section End */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quality, Price, Quantity, Unit Measure, IsFeatured fields follow */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio (COP) <span className="text-red-1">*</span>
                    </label>
                  <StyledInput
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    error={errors.price}
                    required
                  />
                  </div>

                  <StyledInput
                    label="Cantidad Disponible"
                    name="availableQuantity"
                    type="number"
                    min="0" // Allow 0
                    value={formData.availableQuantity}
                    onChange={handleInputChange}
                    error={errors.availableQuantity}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidad de Medida <span className="text-red-1">*</span>
                    </label>
                    <select
                      name="unitMeasure"
                      value={formData.unitMeasure}
                      onChange={handleInputChange}
                      className={`w-full py-2 px-3 border ${
                        errors.unitMeasure ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-green-1`}
                      required
                    >
                      <option value="">Seleccionar Unidad</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="gr">Gramo (gr)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="unidad">Unidad</option>
                      <option value="bulto">Bulto</option>
                      <option value="arroba">Arroba</option>
                    </select>
                    {errors.unitMeasure && (
                      <p className="mt-1 text-sm text-red-500">{errors.unitMeasure}</p>
                    )}
                  </div>

                  <div className="flex items-center md:col-span-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-1 focus:ring-green-1 border-gray-300 rounded"
                    />
                    <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                      Producto Destacado (aparecerá en la página principal)
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Imágenes del Producto</h2>
                {errors.images && (
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <p>{errors.images}</p>
                  </div>
                )}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700">Imágenes existentes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={getImageUrl(image.imageUrl)}
                            alt={`Existing product image ${index + 1}`}
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-1 text-white rounded-full p-1 shadow-md hover:bg-red-0-9"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <StyledBorder
                  variant={dragActive ? 'focus' : 'default'}
                  className={`border-2 border-dashed p-6 flex flex-col justify-center items-center ${
                    dragActive ? 'bg-green-0-4' : ''
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">
                      Arrastra y suelta imágenes aquí, o{' '}
                      <label htmlFor="file-upload" className="cursor-pointer text-green-1 font-medium hover:underline">
                        selecciona archivos
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hasta 5MB por imagen</p>
                  </div>
                </StyledBorder>
                
                {previewUrls.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-md font-medium mb-2 text-gray-700">Imágenes seleccionadas (nuevas)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-32 object-cover rounded border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-1 text-white rounded-full p-1 shadow-md hover:bg-red-0-9"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <StyledButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-1 text-white py-2 px-4 rounded-md hover:bg-green-2 focus:outline-none focus:ring-2 focus:ring-green-3"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
                </StyledButton>
              </div>
            </form>
          )}
        </Card>
      </div>
    </>
  );
};

export default ProductCreate;