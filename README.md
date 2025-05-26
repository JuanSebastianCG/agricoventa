# Agricoventas

Agricoventas is a full-stack e-commerce platform designed specifically for agricultural products in Colombia. The platform connects farmers and agricultural producers directly with buyers, creating a more efficient marketplace while ensuring product quality through certification verification.

![Agricoventas](./frontend/src/assets/logo.png)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Docker Setup (Recommended)](#docker-setup-recommended)
- [Manual Installation](#manual-installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Certification System](#certification-system)
- [AWS Deployment](#aws-deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### User Features
- User registration and authentication (JWT-based)
- User profiles with location management
- Role-based access control (Buyer, Seller, Admin)
- Profile image upload and management
- Phone number verification

### Product Features
- Product creation and management
- Product categorization with hierarchical categories
- Product image uploads (multiple images per product)
- Product search and filtering
- Featured products

### Certification System
- Upload and verification of Colombian agricultural certifications
- Admin approval workflow for certifications
- Certificate expiration tracking
- Required certification enforcement for sellers

### Shopping Features
- Shopping cart functionality
- Order processing and tracking
- Product reviews and ratings
- Favoriting products

### Admin Features
- User management
- Product moderation
- Certification approval
- Category management
- Dashboard with analytics

## Tech Stack

### Backend
- **Node.js** with **Express.js** framework
- **Prisma ORM** with **MongoDB** database
- **JWT** for authentication
- **Multer** for file uploads
- **Zod** for validation
- **bcrypt** for password hashing

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Context API** for state management
- **Tailwind CSS** for styling
- **Axios** for API requests
- **React Toastify** for notifications
- **Chart.js** for data visualization

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- **AWS Elastic Beanstalk** for deployment
- **Amazon ECR** for container registry
- **MongoDB** for database

## Project Structure

```
Expressjs_React_Agricoventas/
├── backend/
│   ├── prisma/            # Prisma schema and migrations
│   ├── src/
│   │   ├── config/        # Application configuration
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── schemas/       # Validation schemas (Zod)
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   ├── __tests__/     # Backend tests
│   │   ├── index.ts       # Application entry point
│   │   └── server.ts      # Express server setup
│   ├── uploads/           # Uploaded files storage
│   ├── Dockerfile         # Docker configuration for backend
│   └── package.json
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── assets/        # Images, fonts, etc.
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── interfaces/    # TypeScript interfaces
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main App component
│   │   └── main.tsx       # Application entry point
│   ├── Dockerfile         # Docker configuration for frontend
│   ├── nginx.conf         # Nginx configuration for production
│   └── package.json
├── docker-compose.yml     # Docker Compose configuration
├── Dockerrun.aws.json     # AWS Elastic Beanstalk configuration
├── aws-deploy.sh          # AWS deployment script
├── setup.sh               # Setup script for Unix-based systems
├── setup.bat              # Setup script for Windows
├── env-example            # Example environment variables
├── .gitignore
└── README.md
```

## Docker Setup (Recommended)

The easiest way to run Agricoventas is using Docker, which handles all dependencies and environment setup automatically.

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Expressjs_React_Agricoventas.git
cd Expressjs_React_Agricoventas
```

2. Run the setup script:

For Windows:
```bash
setup.bat
```

For macOS/Linux:
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Create the necessary environment files
- Create required directories
- Build and start all Docker containers
- Seed the database with initial data

3. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

### Manual Docker Setup

If you prefer to set up manually:

1. Copy the environment example file:
```bash
cp env-example .env
```

2. Edit the `.env` file with your configuration

3. Start the Docker containers:
```bash
docker-compose up -d
```

4. Seed the database:
```bash
docker-compose exec backend npm run seed:all
```

## Manual Installation

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Clone the Repository
```bash
git clone https://github.com/yourusername/Expressjs_React_Agricoventas.git
cd Expressjs_React_Agricoventas
```

### Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Database Setup
1. Set up a MongoDB database (local or MongoDB Atlas)
2. Configure your database connection in `.env` (see Environment Variables section)
3. Run Prisma migrations:
```bash
cd backend
npx prisma generate
npx prisma db push
```

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/agricoventas?retryWrites=true&w=majority"

# Server
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

### Frontend (.env)
```
VITE_BACKEND_URL=http://localhost:3001/api
```

## Running the Application

### Development Mode
```bash
# Start backend server
cd backend
npm run dev

# Start frontend development server
cd ../frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:userId` - Get user profile by ID
- `PUT /api/users/:userId` - Update user profile
- `PUT /api/users/me/profile-image` - Update profile image
- `GET /api/users/me/location` - Get user's primary location

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:productId` - Get product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:productId` - Update a product
- `DELETE /api/products/:productId` - Delete a product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/user/:userId` - Get products by user ID
- `GET /api/products/category/:categoryId` - Get products by category ID

### Certifications
- `POST /api/certifications/upload` - Upload a certification
- `GET /api/certifications/user/:userId` - Get user's certifications
- `GET /api/certifications/verify/:userId` - Verify user's certifications
- `GET /api/certifications/admin` - Get all certifications (admin)
- `PUT /api/certifications/approve/:certificationId` - Approve a certification
- `PUT /api/certifications/reject/:certificationId` - Reject a certification
- `GET /api/certifications/user/:userId/required-status` - Get required certification status

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category (admin)
- `PUT /api/categories/:categoryId` - Update a category (admin)
- `DELETE /api/categories/:categoryId` - Delete a category (admin)

### Locations
- `GET /api/locations/user/:userId` - Get user locations
- `POST /api/locations` - Create a location
- `PUT /api/locations/:locationId` - Update a location
- `DELETE /api/locations/:locationId` - Delete a location

## Authentication

The system uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived token (1 day) used for API access
2. **Refresh Token**: Longer-lived token (7 days) used to issue new access tokens

Authentication flow:
1. User registers or logs in
2. Server provides access token and refresh token
3. Client includes access token in Authorization header
4. When access token expires, client uses refresh token to get a new one

## Data Models

### User
- Basic info: username, email, password, name
- Role: BUYER, SELLER, or ADMIN
- Location information
- Profile image
- Certification status (for sellers)

### Product
- Basic info: name, description, price
- Category and origin location
- Stock quantity and unit measure
- Images
- Seller information
- Reviews and ratings

### Certification
- User association
- Certification type (INVIMA, ICA, etc.)
- Certificate number
- Issue and expiry dates
- Verification status

### Category
- Hierarchical structure (parent-child)
- Name and description

### Order
- User association
- Products and quantities
- Pricing information
- Status tracking
- Payment and shipping details

## Certification System

Agricoventas implements a certification verification system to ensure product quality:

1. Sellers must upload four required Colombian certifications:
   - INVIMA (Instituto Nacional de Vigilancia de Medicamentos y Alimentos)
   - ICA (Instituto Colombiano Agropecuario)
   - Registro Sanitario
   - Certificado Orgánico (if applicable)

2. Each certification undergoes admin verification:
   - Admins can approve or reject with a reason
   - Sellers are notified of certification status
   - Rejected certifications can be resubmitted

3. Certification enforcement:
   - Sellers cannot list products without verified certifications
   - Certification expiry dates are tracked
   - Certifications must be renewed before expiry

## AWS Deployment

Agricoventas can be easily deployed to AWS using Elastic Beanstalk with Docker.

### Prerequisites
- AWS Account
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Elastic Beanstalk CLI](https://github.com/aws/aws-elastic-beanstalk-cli-setup) (optional, but recommended)

### Deployment Steps

1. Set required environment variables:
```bash
export AWS_ACCOUNT_ID=your_aws_account_id
export AWS_REGION=your_aws_region
```

2. For VPC configuration (if needed):
```bash
export VPC_ID=your_vpc_id
export SUBNET_IDS=your_subnet_ids
export SECURITY_GROUP=your_security_group
```

3. Run the deployment script:
```bash
chmod +x aws-deploy.sh
./aws-deploy.sh
```

The script will:
- Log in to Amazon ECR
- Create repositories if they don't exist
- Build and push Docker images
- Create or update the Elastic Beanstalk application and environment

### Manual AWS Deployment

If you prefer to deploy manually:

1. Build the Docker images:
```bash
docker build -t agricoventas-frontend ./frontend
docker build -t agricoventas-backend ./backend
```

2. Create ECR repositories in your AWS account

3. Tag and push the images:
```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker tag agricoventas-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-frontend:latest

docker tag agricoventas-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-backend:latest
```

4. Create an Elastic Beanstalk application and environment using the Dockerrun.aws.json file

### Production Environment Variables

For a production deployment, ensure you set these additional environment variables in your Elastic Beanstalk environment:

- `NODE_ENV`: Set to "production"
- `DATABASE_URL`: Your MongoDB connection string (consider using MongoDB Atlas)
- `JWT_SECRET`: A strong secret key for JWT tokens
- `CORS_ORIGIN`: The domain of your application

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [React](https://reactjs.org/)
- [Prisma](https://www.prisma.io/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/) 