# Agricoventas Frontend

This is the frontend application for Agricoventas, a platform connecting Colombian agricultural producers directly with buyers. Built with React and TypeScript, it provides a modern, responsive user interface for the e-commerce system.

## Overview

The frontend application is structured as a single-page application (SPA) with these key features:

- **Modern Tech Stack**: React, TypeScript, Vite, and Tailwind CSS
- **Component-Based Architecture**: Reusable, modular components
- **Responsive Design**: Mobile-first approach for all device sizes
- **Context API**: For state management across the application
- **Custom Hooks**: For encapsulating and reusing logic
- **Type Safety**: Complete TypeScript implementation

## Directory Structure

```
frontend/
├── public/                  # Static assets served directly
│   ├── favicon.ico          # Site favicon
│   └── images/              # Static images
├── src/
│   ├── assets/              # Bundled assets (images, fonts)
│   │   ├── images/          # Application images
│   │   └── styles/          # Global styles
│   ├── components/          # React components
│   │   ├── admin/           # Admin dashboard components
│   │   │   ├── CategoryForm.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── common/          # Shared components
│   │   │   ├── Card.tsx
│   │   │   ├── FormError.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Notification.tsx
│   │   │   └── UserProfile.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── products/        # Product-related components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductFilter.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductImageGallery.tsx
│   │   └── ui/              # UI components
│   │       ├── Button.tsx
│   │       ├── Dropdown.tsx
│   │       ├── Modal.tsx
│   │       ├── StyledButton.tsx
│   │       ├── StyledInput.tsx
│   │       └── StyledTextArea.tsx
│   ├── context/             # React Context providers
│   │   ├── AppContext.tsx   # Main application context
│   │   ├── AuthContext.tsx  # Authentication context
│   │   └── CartContext.tsx  # Shopping cart context
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts       # Authentication hook
│   │   ├── useCart.ts       # Shopping cart hook
│   │   ├── useForm.ts       # Form handling hook
│   │   └── useProducts.ts   # Product data hook
│   ├── interfaces/          # TypeScript interfaces
│   │   ├── auth.ts          # Authentication types
│   │   ├── category.ts      # Category types
│   │   ├── certification.ts # Certification types
│   │   ├── order.ts         # Order types
│   │   ├── product.ts       # Product types
│   │   └── user.ts          # User types
│   ├── pages/               # Application pages
│   │   ├── admin/           # Admin pages
│   │   │   ├── CertificationApproval.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ManageCategories.tsx
│   │   ├── products/        # Product pages
│   │   │   ├── ProductCreate.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── ProductList.tsx
│   │   └── user/            # User account pages
│   │       ├── Login.tsx
│   │       ├── Profile.tsx
│   │       └── Register.tsx
│   ├── services/            # API service functions
│   │   ├── api.ts           # Axios instance and interceptors
│   │   ├── authService.ts   # Authentication API calls
│   │   ├── categoryService.ts # Category API calls
│   │   ├── certificationService.ts # Certification API calls
│   │   ├── orderService.ts  # Order API calls
│   │   └── productService.ts # Product API calls
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.ts     # Date formatting utilities
│   │   ├── formatUtils.ts   # String/currency formatting
│   │   ├── storageUtils.ts  # Local storage helpers
│   │   └── validationUtils.ts # Input validation helpers
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global CSS with Tailwind
├── .env                     # Environment variables
├── .env.example             # Example environment variables
├── index.html               # HTML entry point
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.ts           # Vite bundler configuration
```

## Key Features

### Component Architecture

The frontend uses a hierarchical component structure:

1. **UI Components**: Basic, reusable UI elements (buttons, inputs)
2. **Common Components**: Shared components used across the application
3. **Feature Components**: Components for specific features
4. **Page Components**: Top-level components that represent routes
5. **Layout Components**: Structural components that define the page layout

### State Management

State is managed through a combination of:

- **Local State**: `useState` for component-specific state
- **Context API**: For shared state across components
- **Custom Hooks**: To encapsulate state logic and reuse it

The main contexts are:

1. **AppContext**: Global application state and user information
2. **AuthContext**: Authentication state and functions
3. **CartContext**: Shopping cart state and operations

### Routing

Routing is handled with React Router with these main route groups:

- **Public Routes**: Accessible to all users
- **Protected Routes**: Require authentication
- **Role-Based Routes**: Accessible based on user roles (buyer, seller, admin)

### API Integration

Communication with the backend is handled through:

1. **Axios Instance**: Configured with base URL and interceptors
2. **Service Modules**: Organized by domain (auth, products, etc.)
3. **Request/Response Handling**: Consistent error handling

The `api.ts` service configures Axios with:
- Authentication token management
- Request/response interceptors
- Error handling with retries for 401 responses
- Consistent response structure

### Form Handling

Forms are handled using:

1. **Custom `useForm` Hook**: For form state, validation, and submission
2. **Reusable Form Components**: Consistent input styling and behavior
3. **Validation**: Client-side validation with feedback

### User Authentication Flow

The authentication flow includes:

1. **Registration**: Multi-step form with validation
2. **Login**: Email/password with JWT storage
3. **Token Refresh**: Automatic refresh of expired tokens
4. **Logout**: Token invalidation and state cleanup
5. **Protected Routes**: Authentication checking

### User Roles and Permissions

The application supports different user roles:

1. **Buyer**: Can browse products, add to cart, and place orders
2. **Seller**: Can create and manage products, upload certifications
3. **Admin**: Can manage users, approve certifications, and moderate content

## Styling and Design System

The UI is built with Tailwind CSS following these principles:

1. **Consistent Color Palette**: Defined in `tailwind.config.js`
2. **Responsive Design**: Mobile-first approach with breakpoints
3. **Component Consistency**: Shared styling through component props
4. **Custom UI Components**: Styled extensions of HTML elements

## Development Workflow

### Prerequisites
- Node.js (v14 or later)
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure the API URL

### Local Development
```bash
# Start development server with hot module replacement
npm run dev

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Building for Production
```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

## Environment Configuration

The frontend uses environment variables for configuration:

```
# API connection
VITE_BACKEND_URL=http://localhost:3001/api

# Feature flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_MOCK_API=false
```

Configure these in `.env` for development or in deployment settings for production.

## Common Scenarios

### Adding a New Page

1. Create a new component in the appropriate subdirectory of `src/pages/`
2. Add the route in `App.tsx`
3. Import and use any required services or components

### Creating a New Component

1. Create a new file in the appropriate subdirectory of `src/components/`
2. Define props interface using TypeScript
3. Implement the component with proper typing
4. Export the component for use in other parts of the application

### Adding a New API Service

1. Define the response interface in `src/interfaces/`
2. Create a new service file in `src/services/`
3. Implement service methods using the base API instance

## Recommended Tools

- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript React code snippets

- **Browser Extensions**:
  - React Developer Tools
  - Redux DevTools (if using Redux)

## Performance Optimization

The application implements these optimizations:

1. **Code Splitting**: Lazy loading of routes and large components
2. **Memoization**: Using `useMemo` and `useCallback` for expensive operations
3. **Virtualization**: For long lists with react-window
4. **Image Optimization**: Proper sizing and formats
5. **Bundle Analysis**: With rollup-plugin-visualizer

## Deployment

### Preparation
1. Update environment variables for production
2. Build the application: `npm run build`
3. Test the production build: `npm run preview`

### Deployment Options
- **Vercel**: Recommended for easy deployment of React applications
- **Netlify**: Simple hosting with continuous deployment
- **GitHub Pages**: For static hosting
- **Docker**: Containerization for consistent environments

### Containerization
The frontend includes a Dockerfile for containerization:
```bash
# Build Docker image
docker build -t agricoventas-frontend .

# Run container
docker run -p 5173:80 agricoventas-frontend
```

## Troubleshooting

### Common Issues
- **API Connection**: Check API URL in environment variables
- **CORS Errors**: Ensure backend has proper CORS configuration
- **Authentication Issues**: Check token storage and refresh mechanism
- **Styling Problems**: Check Tailwind configuration and specificity

### Debug Mode
Enable more verbose logging by setting `localStorage.debug = 'agricoventas:*'` in your browser console.

## Additional Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Axios Documentation](https://axios-http.com/docs/intro)
