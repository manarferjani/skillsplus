# SkillsPlus Backend API

Backend API for the SkillsPlus application with authentication, authorization, and role-based access control.

## Features

- User authentication with JWT tokens
- Role-based access control (Admin, Manager, Collaborator)
- Clerk authentication integration
- MongoDB database integration
- API documentation with Swagger

## API Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

## Authentication Endpoints

- **POST /api/auth/signup** - Register a new user
- **POST /api/auth/signin** - Login a user
- **POST /api/auth/clerk** - Authenticate with Clerk

## Role-Based Access

The system uses numeric roles to define access levels:

- **1**: Admin - Full system access
- **2**: Manager - Management access
- **3**: Collaborator - Standard access

See [ROLES.md](./docs/ROLES.md) for detailed information about the role system.

## Test Endpoints

- **GET /api/test/public** - Public access
- **GET /api/test/auth** - Authenticated users only
- **GET /api/test/manager** - Managers and admins only
- **GET /api/test/admin** - Admins only

## Technologies

- Node.js
- Express
- MongoDB/Mongoose
- JWT Authentication
- Clerk Authentication
- Swagger Documentation 