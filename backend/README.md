# Agricoventas Backend

The backend for Agricoventas provides a robust RESTful API that powers the agricultural e-commerce platform, handling authentication, product management, certification verification, order processing, and more.

## Architecture Overview

The backend follows a modular architecture with clear separation of concerns:

```
Controller → Service → Repository → Database
     ↓
Response Handling
```

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Repositories**: Abstract database operations (via Prisma)
- **Middleware**: Process requests before they reach route handlers
- **Utils**: Reusable utility functions
- **Schemas**: Data validation using Zod

## Detailed Directory Structure

```
backend/
├── prisma/                      # Database configuration
│   ├── schema.prisma            # Prisma schema (MongoDB)
│   └── seed.ts                  # Database seed script
├── src/
│   ├── config/                  # Application configuration
│   │   ├── corsConfig.ts        # CORS configuration
│   │   ├── envConfig.ts         # Environment variables
│   │   └── swaggerConfig.ts     # API documentation
│   ├── controllers/             # Request handlers
│   │   ├── auth.controller.ts   # Authentication
│   │   ├── user.controller.ts   # User management
│   │   ├── product.controller.ts # Product management
│   │   ├── category.controller.ts # Category management
│   │   ├── certification.controller.ts # Certification management
│   │   └── order.controller.ts   # Order processing
│   ├── middleware/              # Express middleware
│   │   ├── auth.middleware.ts   # Authentication/authorization
│   │   ├── validation.middleware.ts # Request validation
│   │   ├── error.middleware.ts  # Error handling
│   │   ├── logger.middleware.ts # Request logging
│   │   └── upload.middleware.ts # File upload handling
│   ├── routes/                  # API routes
│   │   ├── auth.routes.ts       # Authentication routes
│   │   ├── user.routes.ts       # User routes
│   │   ├── product.routes.ts    # Product routes
│   │   ├── category.routes.ts   # Category routes
│   │   ├── certification.routes.ts # Certification routes
│   │   └── order.routes.ts      # Order routes
│   ├── schemas/                 # Validation schemas (Zod)
│   │   ├── auth.schema.ts       # Authentication schemas
│   │   ├── user.schema.ts       # User schemas
│   │   ├── product.schema.ts    # Product schemas
│   │   ├── category.schema.ts   # Category schemas
│   │   └── order.schema.ts      # Order schemas
│   ├── types/                   # TypeScript type definitions
│   │   ├── auth.types.ts        # Authentication types
│   │   ├── user.types.ts        # User types
│   │   ├── product.types.ts     # Product types
│   │   └── common.types.ts      # Shared types
│   ├── utils/                   # Utility functions
│   │   ├── responseHandler.ts   # Standardized API responses
│   │   ├── errorHandler.ts      # Error processing
│   │   ├── certificateValidator.ts # Certification validation
│   │   ├── tokenUtils.ts        # JWT utilities
│   │   └── HttpStatusCode.ts    # HTTP status codes
│   ├── __tests__/              # Backend tests
│   │   ├── auth.test.ts        # Authentication tests
│   │   ├── product.test.ts     # Product tests
│   │   └── certification.test.ts # Certification tests
│   ├── index.ts                # Application entry point
│   └── server.ts               # Express server setup
├── uploads/                    # Uploaded files storage
│   ├── certifications/         # Certification documents/images
│   ├── products/               # Product images
│   └── profiles/               # User profile images
├── .env                        # Environment variables
├── .env.example                # Example environment variables
├── package.json                # Project dependencies
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This documentation
```

## Database Design

Agricoventas uses MongoDB with Prisma ORM. The schema in `prisma/schema.prisma` defines these main collections:

### Core Collections
- **User**: Account information, authentication, and role management
- **Product**: Agricultural product listings with details and inventory
- **Location**: Addresses and geographical information
- **Category**: Hierarchical product categorization
- **UserCertification**: Seller certification documentation and verification

### Supporting Collections
- **ProductImage**: Product gallery images with metadata
- **Order & CartItem**: Order management and shopping cart functionality
- **Review**: Product reviews and ratings
- **Notification**: System notifications for users

## API Design

The API follows RESTful principles with these characteristics:

1. **Consistent Response Format**:
   ```json
   {
     "success": true,
     "data": { ... }
   }
   ```
   or for errors:
   ```json
   {
     "success": false,
     "error": {
       "message": "Error description",
       "code": "ERROR_CODE"
     }
   }
   ```

2. **Resource-Based Endpoints**: Organized around resources (users, products, etc.)
3. **HTTP Methods**: 
   - GET: Retrieve resources
   - POST: Create resources
   - PUT: Update resources
   - DELETE: Remove resources

4. **Validation**: Request validation using Zod schemas
5. **Authentication**: JWT-based authentication with refresh token mechanism
6. **Rate Limiting**: Prevent abuse with request rate limiting
7. **Documentation**: Swagger/OpenAPI documentation at `/api-docs`

## Authentication System

The authentication system uses a dual-token approach:

1. **Access Token**: 
   - Short-lived JWT (1 day)
   - Contains user ID and roles
   - Used to authenticate API requests
   - Sent in Authorization header

2. **Refresh Token**:
   - Longer-lived token (7 days)
   - Stored in database and HTTP-only cookie
   - Used to issue new access tokens
   - Rotation with each refresh for security

3. **Token Blacklisting**:
   - Invalidated tokens are blacklisted
   - Prevents replay attacks during logout

### Auth Middleware

The `authenticate` middleware verifies tokens and attaches user information to the request object. The `authorize` middleware checks user roles for restricted routes.

## File Upload System

The backend handles file uploads for:
- Product images
- User profile pictures
- Certification documents

Using Multer middleware, files are:
1. Validated (type, size)
2. Renamed uniquely
3. Stored in appropriate directories
4. Paths are stored in the database
5. Served via static file middleware

## Certification Verification Flow

The certification system follows this workflow:

1. **Upload**: Sellers upload certification documents with metadata
2. **Validation**: System validates basic requirements
3. **Admin Review**: Administrators review and verify documents
4. **Approval/Rejection**: Certificate is approved or rejected with reason
5. **Notification**: Seller is notified of the outcome
6. **Enforcement**: Sellers require approved certifications to list products

## Error Handling

The error handling approach:

1. **Centralized Error Middleware**: Catches and processes all errors
2. **Detailed Error Types**: Different error classes for different scenarios
3. **Consistent Response Format**: Standardized error responses
4. **Error Logging**: Detailed error logging for debugging
5. **Client-Safe Messages**: Sanitized error messages for production

## Development Workflow

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure
4. Generate Prisma client: `npx prisma generate`
5. Initialize database: `npx prisma db push`

### Local Development
```bash
# Start development server with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Apply schema changes
npx prisma db push

# Reset database (CAUTION: deletes all data)
npx prisma db push --force-reset

# Seed database with initial data
npx prisma db seed
```

## Performance Considerations

- **Indexing**: MongoDB indexes are defined in the Prisma schema
- **Query Optimization**: Selective field inclusion in queries
- **Pagination**: All list endpoints support pagination
- **Caching**: Optional Redis caching for frequent queries
- **Compression**: Response compression for bandwidth reduction

## Security Measures

- **Input Validation**: All requests validated with Zod
- **Parameter Sanitization**: Prevents NoSQL injection
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configurable CORS policy
- **Secure Headers**: Helmet middleware for security headers
- **Environment Variables**: Sensitive information in .env
- **Token Security**: Short expiry, rotation, and blacklisting

## Deployment

### Preparation
1. Build the application: `npm run build`
2. Set environment variables for production
3. Ensure MongoDB connection is configured correctly

### Containerization
The backend includes a Dockerfile for containerization:
```bash
# Build Docker image
docker build -t agricoventas-backend .

# Run container
docker run -p 3001:3001 --env-file .env agricoventas-backend
```

### Deployment Options
- **Render**: Easy deployment with GitHub integration
- **Railway**: Simple deployment with automatic builds
- **Heroku**: Platform-as-a-service deployment
- **AWS/GCP/Azure**: More control with cloud providers

## Troubleshooting

### Common Issues
- **Database Connection**: Check MongoDB URI and network access
- **JWT Errors**: Verify secret keys and token expiration
- **File Upload Issues**: Check directory permissions and file size limits
- **CORS Errors**: Verify CORS configuration matches client domain

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and `LOG_LEVEL=debug` in your .env file.

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Authentication Guide](https://jwt.io/introduction/) 