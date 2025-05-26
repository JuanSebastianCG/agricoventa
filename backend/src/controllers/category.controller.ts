import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
  CategoryResponse,
} from '../schemas/category.schema';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
} from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

const prisma = new PrismaClient();

export class CategoryController {
  private db: PrismaClient;

  constructor(dbClient: PrismaClient = prisma) {
    this.db = dbClient;
  }

  /**
   * Create a new category
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData: CreateCategoryDto = req.body;

      // Check for parentId validity if provided
      if (categoryData.parentId) {
        const parentCategory = await (this.db as any).category.findUnique({
          where: { id: categoryData.parentId },
        });
        if (!parentCategory) {
          sendErrorResponse(res, 'Parent category not found', HttpStatusCode.BAD_REQUEST);
          return;
        }
        // Optional: Check hierarchy depth (e.g., max 2 levels)
        if (parentCategory.parentId) {
            sendErrorResponse(res, 'Cannot create a category more than two levels deep.', HttpStatusCode.BAD_REQUEST);
            return;
        }
      }

      const category = await (this.db as any).category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          parentId: categoryData.parentId,
        },
        include: {
          parent: categoryData.parentId ? true : undefined,
          children: categoryData.parentId ? true : undefined,
        },
      });
      sendSuccessResponse(res, this.mapToCategoryResponse(category), HttpStatusCode.CREATED);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        sendErrorResponse(res, 'Category with this name already exists.', HttpStatusCode.CONFLICT);
      } else {
        console.error('Error creating category:', error);
        sendErrorResponse(res, 'Failed to create category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Get a category by ID
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;
      const { includeParent, includeChildren } = req.query as unknown as CategoryQueryDto;

      const category = await (this.db as any).category.findUnique({
        where: { id: categoryId },
        include: {
          parent: includeParent ? true : undefined,
          children: includeChildren ? true : undefined,
        },
      });

      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }
      sendSuccessResponse(res, this.mapToCategoryResponse(category, includeParent, includeChildren));
    } catch (error: any) {
      console.error(`Error fetching category ${req.params.categoryId}:`, error);
      sendErrorResponse(res, 'Failed to fetch category', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all categories with filtering
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      console.log("🔍 GET /categories request received with query:", req.query);
      const { parentId, includeChildren, includeParent, level } = req.query as unknown as CategoryQueryDto;

      // Logging the request parameters
      console.log(`Query params: parentId=${parentId}, includeChildren=${includeChildren}, includeParent=${includeParent}, level=${level}`);

      // Default query - initially get all categories without filters
      let where: any = {};
      
      // Only apply filters if they are explicitly provided
      if (parentId !== undefined) {
        where.parentId = parentId;
      } else if (level === 1) {
        // Only top-level categories if level 1 is specifically requested
        where.parentId = null;
      }
      // If no filters are provided, we'll get all categories

      console.log("🔍 Constructed query where clause:", where);

      const include: any = {};
      if (includeParent) {
        include.parent = true;
      }
      if (includeChildren) {
        include.children = true;
      }

      console.log("🔍 Include options:", include);

      // Special case for level 2 categories
      if (level === 2 && !parentId) {
        console.log("🔍 Fetching level 2 categories specifically");
        // If we want all level 2 categories, we fetch top-level, then their children.
        const topLevelCategories = await (this.db as any).category.findMany({
          where: { parentId: null },
          include: { children: true },
        });
        console.log(`🔍 Found ${topLevelCategories.length} top-level categories`);
        
        const secondLevelCategories = topLevelCategories.flatMap(tlc => tlc.children || []);
        console.log(`🔍 Extracted ${secondLevelCategories.length} second-level categories`);
        
        const responseCategories = secondLevelCategories.map(cat => 
          this.mapToCategoryResponse(cat, includeParent, false)
        );

        console.log(`🔍 Sending response with ${responseCategories.length} second-level categories`);
        sendSuccessResponse(res, { categories: responseCategories, total: secondLevelCategories.length });
        return;
      }

      // Normal category query
      console.log("🔍 Executing findMany with where:", where, "and include:", include);
      const categories = await (this.db as any).category.findMany({
        where,
        include,
        orderBy: { name: 'asc' },
      });

      console.log(`🔍 Found ${categories.length} categories from database`);
      
      if (categories.length === 0) {
        console.log("⚠️ No categories found with the given filters. Trying without filters...");
        
        // If no categories found with filters, try getting all categories
        const allCategories = await (this.db as any).category.findMany({
          orderBy: { name: 'asc' },
          include: {
            parent: true,
            children: true
          }
        });
        
        console.log(`🔍 Found ${allCategories.length} categories without filters`);
        
        if (allCategories.length > 0) {
          const responseCategories = allCategories.map(cat => 
            this.mapToCategoryResponse(cat, true, true)
          );
          console.log(`🔍 Sending response with ${responseCategories.length} categories (without filters)`);
          sendSuccessResponse(res, { categories: responseCategories, total: allCategories.length });
          return;
        }
      }

      const responseCategories = categories.map(cat => 
        this.mapToCategoryResponse(cat, includeParent, includeChildren)
      );
      
      console.log(`🔍 Sending response with ${responseCategories.length} categories`);
      sendSuccessResponse(res, { categories: responseCategories, total: categories.length });
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      sendErrorResponse(res, 'Failed to fetch categories', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a category
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;
      const updateData: UpdateCategoryDto = req.body;

      const category = await (this.db as any).category.findUnique({ where: { id: categoryId } });
      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }

      // Prevent making a category its own parent or creating circular dependencies
      if (updateData.parentId && updateData.parentId === categoryId) {
        sendErrorResponse(res, 'Category cannot be its own parent.', HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Check for parentId validity if provided
      if (updateData.parentId) {
        const parentCategory = await (this.db as any).category.findUnique({
          where: { id: updateData.parentId },
        });
        if (!parentCategory) {
          sendErrorResponse(res, 'Parent category not found', HttpStatusCode.BAD_REQUEST);
          return;
        }
         // Optional: Check hierarchy depth (e.g., max 2 levels)
        if (parentCategory.parentId) {
            sendErrorResponse(res, 'Cannot move category to be more than two levels deep.', HttpStatusCode.BAD_REQUEST);
            return;
        }
      }


      const updatedCategory = await (this.db as any).category.update({
        where: { id: categoryId },
        data: {
          name: updateData.name,
          description: updateData.description,
          parentId: updateData.parentId === null ? null : updateData.parentId, // Explicitly allow unsetting parent
        },
        include: {
          parent: updateData.parentId ? true : undefined,
          children: updateData.parentId ? true : undefined,
        },
      });
      sendSuccessResponse(res, this.mapToCategoryResponse(updatedCategory));
    } catch (error: any) {
      const categoryId = req.params.categoryId;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        sendErrorResponse(res, 'Category with this name already exists.', HttpStatusCode.CONFLICT);
      } else {
        console.error(`Error updating category ${categoryId}:`, error);
        sendErrorResponse(res, 'Failed to update category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryId = req.params.categoryId;

      const category = await (this.db as any).category.findUnique({
        where: { id: categoryId },
        include: { children: true, products: { take: 1 } }, // Check for children and products
      });

      if (!category) {
        sendNotFoundResponse(res, 'Category not found');
        return;
      }

      if (category.children && category.children.length > 0) {
        sendErrorResponse(
          res,
          'Cannot delete category with child categories. Please delete or reassign child categories first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }

      if (category.products && category.products.length > 0) {
        sendErrorResponse(
          res,
          'Cannot delete category with associated products. Please reassign products to another category first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }
      
      // Also need to check ProductRecommendations
      const recommendations = await (this.db as any).productRecommendation.findFirst({
        where: { categoryId: categoryId } as any
      });

      if (recommendations) {
         sendErrorResponse(
          res,
          'Cannot delete category with associated product recommendations. Please reassign recommendations first.',
          HttpStatusCode.BAD_REQUEST
        );
        return;
      }


      await (this.db as any).category.delete({
        where: { id: categoryId },
      });
      sendSuccessResponse(res, { message: 'Category deleted successfully' }, HttpStatusCode.OK);
    } catch (error: any) {
      const categoryId = req.params.categoryId;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
         sendNotFoundResponse(res, 'Category not found');
      } else {
        console.error(`Error deleting category ${categoryId}:`, error);
        sendErrorResponse(res, 'Failed to delete category', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
    }
  }

  /**
   * Map category entity to category response
   */
  private mapToCategoryResponse(
    category: any, // Prisma category type, potentially with parent/children
    includeParent?: boolean,
    includeChildren?: boolean
  ): CategoryResponse {
    const response: CategoryResponse = {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };

    if (includeParent && category.parent) {
      response.parent = this.mapToCategoryResponse(category.parent, false, false); // Avoid deep nesting
    }
    if (includeChildren && category.children) {
      response.children = category.children.map((child: any) =>
        this.mapToCategoryResponse(child, false, false) // Avoid deep nesting
      );
    }
    return response;
  }
} 