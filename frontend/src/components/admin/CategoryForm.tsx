import React, { useState, useEffect } from 'react';
import { ICategory, ICreateCategoryDto, IUpdateCategoryDto } from '../../interfaces/category';
import TextField from '../ui/StyledInput';
import TextareaField from '../ui/StyledTextArea';
import Button from '../ui/StyledButton';
import FormField from '../ui/FormField';
import { FiFolder, FiFile } from 'react-icons/fi';

interface CategoryFormProps {
  category?: ICategory | null;
  allCategories: ICategory[]; // For parent selection, excluding current category and its children if editing
  onSubmit: (data: ICreateCategoryDto | IUpdateCategoryDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  allCategories,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState<string | null | undefined>(
    category?.parentId
  );
  const [isSubcategory, setIsSubcategory] = useState<boolean>(!!category?.parentId);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setParentId(category.parentId);
      setIsSubcategory(!!category.parentId);
    } else {
      setName('');
      setDescription('');
      setParentId(null);
      setIsSubcategory(false);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: ICreateCategoryDto | IUpdateCategoryDto = {
      name,
      description: description || null,
      parentId: isSubcategory ? parentId || null : null,
    };
    onSubmit(data);
  };

  // Filter out the current category and its children from parent options
  const getParentOptions = () => {
    let filtered = allCategories;
    
    if (category) {
      // First, get all descendant IDs to exclude
      const childrenIds: Set<string> = new Set();
      
      const collectChildrenIds = (categoryId: string) => {
        const children = allCategories.filter(c => c.parentId === categoryId);
        children.forEach(child => {
          childrenIds.add(child.id);
          collectChildrenIds(child.id);
        });
      };
      
      // Collect all descendants of the current category
      collectChildrenIds(category.id);
      
      // Filter out the current category and all its descendants
      filtered = allCategories.filter(c => 
        c.id !== category.id && !childrenIds.has(c.id)
      );
    }
    
    // Only allow top-level categories as parents to prevent deep nesting
    const topLevelCategories = filtered.filter(c => !c.parentId);
    
    return topLevelCategories.map(c => ({ 
      value: c.id, 
      label: c.name 
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center mb-2">
          {category?.parentId ? (
            <FiFile className="text-gray-400 mr-2" />
          ) : (
            <FiFolder className="text-yellow-500 mr-2" />
          )}
          <h3 className="text-lg font-medium text-gray-800">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
        </div>
        {category?.parentId && (
          <div className="text-sm text-gray-500 ml-6">
            Subcategoría de: <span className="font-medium">{allCategories.find(c => c.id === category.parentId)?.name || 'Categoría Principal'}</span>
          </div>
        )}
      </div>

      <TextField
        label="Nombre de la Categoría"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Ej: Frutas Frescas"
      />
      
      <TextareaField
        label="Descripción (Opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Una breve descripción de la categoría"
        rows={3}
      />
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Categoría</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="categoryType"
              checked={!isSubcategory}
              onChange={() => {
                setIsSubcategory(false);
                setParentId(null);
              }}
            />
            <span className="ml-2">Categoría Principal</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="categoryType"
              checked={isSubcategory}
              onChange={() => setIsSubcategory(true)}
            />
            <span className="ml-2">Subcategoría</span>
          </label>
        </div>
      </div>
      
      {isSubcategory && (
        <FormField
          type="select"
          label="Categoría Padre"
          name="parentId"
          value={parentId || ''}
          onChange={(e) => setParentId(e.target.value || null)}
          options={[
            { value: '', label: 'Seleccione una categoría padre' },
            ...getParentOptions(),
          ]}
          required
        />
      )}
      
      <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="solid" 
          color="primary" 
          isLoading={isLoading} 
          disabled={isLoading || (isSubcategory && !parentId)}
        >
          {category ? 'Actualizar Categoría' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm; 