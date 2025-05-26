import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto } from '../../interfaces/category';
import categoryService from '../../services/categoryService';
import CategoryForm from '../../components/admin/CategoryForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/StyledButton';
import { FiEdit, FiTrash2, FiPlusCircle, FiChevronDown, FiChevronRight, FiDatabase, FiFolder, FiFolderPlus, FiFile } from 'react-icons/fi';

const ManageCategories: React.FC = () => {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [allCategoriesForForm, setAllCategoriesForForm] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchCategories = useCallback(async (includeChildren = true) => {
    setIsLoading(true);
    try {
      console.log("[ManageCategories] Fetching categories...");
      
      // Try different approaches to get categories
      let categoriesData: ICategory[] = [];
      let errorMessage = '';
      
      // Approach 1: Get categories with their children for main display
      try {
        console.log("[ManageCategories] Approach 1: Using getCategories with includeChildren and includeParent");
        const topLevelResponse = await categoryService.getCategories({ 
          includeChildren: true, 
          includeParent: true 
        });
        
        console.log("[ManageCategories] Top level categories response:", topLevelResponse);
        
        if (topLevelResponse && topLevelResponse.categories && topLevelResponse.categories.length > 0) {
          console.log("[ManageCategories] Successfully loaded categories:", topLevelResponse.categories.length);
          categoriesData = topLevelResponse.categories;
        } else {
          errorMessage = "No categories found with includeChildren and includeParent params";
        }
      } catch (error1: any) {
        console.error("[ManageCategories] Error in approach 1:", error1);
        errorMessage = error1.message || "Error in approach 1";
      }
      
      // Approach 2: If approach 1 failed, try getAllCategories
      if (categoriesData.length === 0) {
        try {
          console.log("[ManageCategories] Approach 2: Using getAllCategories");
          const allCategories = await categoryService.getAllCategories();
          console.log("[ManageCategories] getAllCategories response:", allCategories);
          
          if (allCategories && allCategories.length > 0) {
            console.log("[ManageCategories] Successfully loaded categories from getAllCategories:", allCategories.length);
            categoriesData = allCategories;
          } else {
            errorMessage += " | No categories found from getAllCategories";
          }
        } catch (error2: any) {
          console.error("[ManageCategories] Error in approach 2:", error2);
          errorMessage += " | " + (error2.message || "Error in approach 2");
        }
      }
      
      // Approach 3: Direct API call with minimal params
      if (categoriesData.length === 0) {
        try {
          console.log("[ManageCategories] Approach 3: Direct API call");
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api'}/categories`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          const data = await response.json();
          
          console.log("[ManageCategories] Direct API response:", data);
          
          if (data.success && data.data && data.data.categories && data.data.categories.length > 0) {
            console.log("[ManageCategories] Successfully loaded categories from direct API:", data.data.categories.length);
            categoriesData = data.data.categories;
          } else {
            errorMessage += " | No categories found from direct API call";
          }
        } catch (error3: any) {
          console.error("[ManageCategories] Error in approach 3:", error3);
          errorMessage += " | " + (error3.message || "Error in approach 3");
        }
      }
      
      // Set categories data if any of the approaches worked
      if (categoriesData.length > 0) {
        setCategories(categoriesData);
      } else {
        console.warn("[ManageCategories] All approaches failed to load categories:", errorMessage);
        setCategories([]);
        toast.info("No hay categorías para mostrar. Puedes crear una nueva categoría.");
      }

      // Get all categories (without children) for the dropdown in the form
      try {
        const allCategoriesResponse = await categoryService.getCategories({ 
          includeChildren: false 
        });
        
        console.log("[ManageCategories] All categories for form response:", allCategoriesResponse);
        
        if (allCategoriesResponse && allCategoriesResponse.categories && allCategoriesResponse.categories.length > 0) {
          console.log("[ManageCategories] Successfully loaded categories for form:", allCategoriesResponse.categories.length);
          setAllCategoriesForForm(allCategoriesResponse.categories);
        } else {
          console.warn("[ManageCategories] No categories found for form dropdown");
          // Use the categories we already have for the form if they exist
          if (categoriesData.length > 0) {
            setAllCategoriesForForm(categoriesData);
          } else {
            setAllCategoriesForForm([]);
          }
        }
      } catch (formError: any) {
        console.error("[ManageCategories] Error fetching categories for form:", formError);
        // Use the categories we already have for the form if they exist
        if (categoriesData.length > 0) {
          setAllCategoriesForForm(categoriesData);
        } else {
          setAllCategoriesForForm([]);
        }
      }

    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      toast.error(`Error al cargar categorías: ${errorMsg}`);
      console.error("[ManageCategories] Error in fetchCategories function:", error);
      setCategories([]);
      setAllCategoriesForForm([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenModal = (category: ICategory | null = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmitCategory = async (data: ICreateCategoryDto | IUpdateCategoryDto) => {
    setIsLoading(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data as IUpdateCategoryDto);
        toast.success('Categoría actualizada con éxito');
      } else {
        await categoryService.createCategory(data as ICreateCategoryDto);
        toast.success('Categoría creada con éxito');
      }
      fetchCategories();
      handleCloseModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al guardar categoría: ${errorMsg}`);
      console.error("Error submitting category:", error);
    }
    setIsLoading(false);
  };

  const handleOpenConfirmDeleteModal = (category: ICategory) => {
    setCategoryToDelete(category);
    setIsConfirmDeleteModalOpen(true);
  };

  const handleCloseConfirmDeleteModal = () => {
    setIsConfirmDeleteModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsLoading(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      toast.success('Categoría eliminada con éxito');
      fetchCategories();
      handleCloseConfirmDeleteModal();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
      toast.error(`Error al eliminar categoría: ${errorMsg}`);
      console.error("Error deleting category:", error);
    }
    setIsLoading(false);
  };
  
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const renderCategoryRow = (category: ICategory, level: number = 0) => (
    <React.Fragment key={category.id}>
      <tr className={`${level > 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
        <td style={{ paddingLeft: `${level * 20 + 16}px` }} className="py-3 px-4 border-b border-gray-200 text-sm">
          <div className="flex items-center">
            {category.children && category.children.length > 0 ? (
              <button 
                onClick={() => toggleExpand(category.id)} 
                className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={expandedCategories[category.id] ? "Collapse category" : "Expand category"}
              >
                {expandedCategories[category.id] ? (
                  <FiChevronDown className="text-blue-500" />
                ) : (
                  <FiChevronRight className="text-blue-500" />
                )}
              </button>
            ) : (
              <span className="mr-2 w-5 h-5 flex items-center justify-center">
                {level === 0 ? (
                  <FiFolder className="text-yellow-500" />
                ) : (
                  <FiFile className="text-gray-400" />
                )}
              </span>
            )}
            <span className={`font-medium ${level === 0 ? 'text-gray-800 text-base' : 'text-gray-700'}`}>
              {category.name}
            </span>
            {level === 0 && category.children && category.children.length > 0 && (
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {category.children.length} subcategorías
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-600 truncate max-w-xs">
          {category.description || '-'}
        </td>
        <td className="py-3 px-4 border-b border-gray-200 text-sm">
          <div className="flex items-center space-x-2">
            <Button variant="text" size="sm" onClick={() => handleOpenModal(category)} aria-label="Editar">
              <FiEdit className="w-4 h-4 text-blue-600" />
            </Button>
            <Button variant="text" size="sm" onClick={() => handleOpenConfirmDeleteModal(category)} aria-label="Eliminar">
              <FiTrash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </td>
      </tr>
      {expandedCategories[category.id] && category.children && category.children.map(child => renderCategoryRow(child, level + 1))}
    </React.Fragment>
  );

  const createInitialCategories = async () => {
    setIsLoading(true);
    try {
      // Define initial categories
      const initialCategories = [
        { name: 'Frutas', description: 'Todo tipo de frutas frescas' },
        { name: 'Verduras', description: 'Vegetales y verduras frescas' },
        { name: 'Granos', description: 'Granos y cereales' },
        { name: 'Lácteos', description: 'Productos lácteos' },
        { name: 'Carnes', description: 'Carnes y productos cárnicos' }
      ];
      
      // Create each category
      for (const category of initialCategories) {
        await categoryService.createCategory(category);
      }
      
      toast.success('Categorías iniciales creadas con éxito');
      fetchCategories(); // Reload categories
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      toast.error(`Error al crear categorías iniciales: ${errorMsg}`);
      console.error("[ManageCategories] Error creating initial categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !categories.length) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div></div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gestionar Categorías</h1>
        <Button 
          variant="primary" 
          color="primary" 
          onClick={() => handleOpenModal()} 
          leftIcon={<FiFolderPlus className="w-5 h-5"/>}
        >
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 && !isLoading ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <FiFolderPlus className="mx-auto text-gray-400 w-12 h-12 mb-4" />
          <p className="text-gray-600 text-lg">No hay categorías registradas.</p>
          <p className="text-sm text-gray-500 mt-1 mb-6">Crea la primera categoría para organizar tus productos.</p>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="primary" 
              onClick={() => handleOpenModal()} 
              leftIcon={<FiFolderPlus className="w-5 h-5"/>}
            >
              Nueva Categoría
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={createInitialCategories} 
              leftIcon={<FiDatabase className="w-5 h-5"/>}
              isLoading={isLoading}
            >
              Crear Categorías Iniciales
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
            <FiFolder className="text-yellow-500 mr-2" />
            <span className="font-medium text-gray-700">Estructura de Categorías</span>
            <span className="ml-auto text-sm text-gray-500">
              {categories.length} categorías principales
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Only render top-level categories first */}
              {categories
                .filter(category => !category.parentId)
                .map(category => renderCategoryRow(category))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        >
          <CategoryForm
            category={editingCategory}
            allCategories={allCategoriesForForm} // Pass all categories for parent selection
            onSubmit={handleSubmitCategory}
            onCancel={handleCloseModal}
            isLoading={isLoading}
          />
        </Modal>
      )}

      {isConfirmDeleteModalOpen && categoryToDelete && (
        <Modal
          isOpen={isConfirmDeleteModalOpen}
          onClose={handleCloseConfirmDeleteModal}
          title="Confirmar Eliminación"
          footer = {
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCloseConfirmDeleteModal} disabled={isLoading}>Cancelar</Button>
              <Button variant="danger" onClick={handleDeleteCategory} isLoading={isLoading} disabled={isLoading}>Eliminar</Button>
            </div>
          }
        >
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar la categoría "<strong>{categoryToDelete.name}</strong>"?
            Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ManageCategories; 