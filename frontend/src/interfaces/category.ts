export interface ICategory {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string; // Dates are typically strings in API responses
  updatedAt?: string | null;
  parent?: ICategory | null;
  children?: ICategory[];
  // Add productCount or recommendationCount if needed later
}

export interface ICreateCategoryDto {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export interface IUpdateCategoryDto extends Partial<ICreateCategoryDto> {}

export interface CategoryQueryDto {
  parentId?: string;
  includeChildren?: boolean;
  includeParent?: boolean;
  level?: 1 | 2;
} 