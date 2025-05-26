/**
 * Product model interface
 */
export interface IProduct {
  id?: string;
  name: string;
  description: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
  } | null;
  region?: string;
  price: number;
  availableQuantity: number;
  stockQuantity?: number;
  unitMeasure: string;
  images: Array<{
    id: string;
    imageUrl: string;
    altText?: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;
  isFeatured?: boolean;
  sellerId?: string;
  seller?: {
    id: string;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  originLocation?: {
    id: string;
    addressLine1: string;
    city: string;
    department: string;
  };
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date | null;
  averageRating?: number | null;
  reviewCount?: number;
}

/**
 * Product service interface
 */
export interface IProductService {
  getProducts(filters?: ProductFilters): Promise<IProduct[]>;
  getProductById(id: string): Promise<IProduct>;
  createProduct(product: Omit<IProduct, 'id'>): Promise<IProduct>;
  updateProduct(id: string, product: Partial<IProduct>): Promise<IProduct>;
  deleteProduct(id: string): Promise<boolean>;
  uploadProductImages(files: File[]): Promise<string[]>;
}

/**
 * Product filters interface
 */
export interface ProductFilters {
  category?: string;
  region?: string;
  sortBy?: string;
} 