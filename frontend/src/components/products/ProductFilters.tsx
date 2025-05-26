import React from 'react';

interface ProductFiltersProps {
  onCategoryChange: (category: string) => void;
  onRegionChange: (region: string) => void;
  onQualityChange: (quality: string) => void;
  selectedCategory: string;
  selectedRegion: string;
  selectedQuality: string;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  onCategoryChange,
  onRegionChange,
  onQualityChange,
  selectedCategory,
  selectedRegion,
  selectedQuality
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="w-full sm:w-auto">
        <select
          className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Todas las Categorías</option>
          <option value="Frutas">Frutas</option>
          <option value="Verduras">Verduras</option>
          <option value="Granos">Granos</option>
          <option value="Café">Café</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <select
          className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          <option value="">Todas las Regiones</option>
          <option value="Antioquia">Antioquia</option>
          <option value="Nariño">Nariño</option>
          <option value="Cundinamarca">Cundinamarca</option>
          <option value="Valle">Valle</option>
          <option value="Cauca">Cauca</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <select
          className="w-full py-2 px-3 border border-gray-0-5 rounded-md focus:outline-none focus:ring-2 focus:ring-green-1"
          value={selectedQuality}
          onChange={(e) => onQualityChange(e.target.value)}
        >
          <option value="">Etiquetas de Calidad</option>
          <option value="Premium">Premium</option>
          <option value="Estándar">Estándar</option>
          <option value="Económico">Económico</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilters; 