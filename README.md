# User Management CRUD API

A lightweight Node.js TypeScript application providing a full CRUD (Create, Read, Update, Delete) API for user management with built-in memory storage and load balancing capabilities.

## Features

- **RESTful API** for user management operations
- **In-memory storage** - no database setup required
- **TypeScript** for type safety and better development experience
- **Jest testing** suite with comprehensive test coverage
- **Load balancing** support for horizontal scaling
- **Environment-based configuration**

## Prerequisites

- Node.js (version 24 or higher)
- npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment configuration:

```bash
cp .example.env .env
```

4. Edit the `.env` file and add your port number:

```env
PORT=4000
```

## Available Scripts

- `npm run start:dev` - Start the development server with hot reload
- `npm run start:prod` - Start in production environment
- `npm run start:multi` - Start Load balancer
- `npm test` - Run the test suite with Jest
- `npm run test:cov` - Run tests with coverage report

## API Endpoints

### Users

- `GET/api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update user by ID
- `DELETE /api/users/:id` - Delete user by ID

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The test suite includes:

- Unit tests for all service functions
- Integration tests for API endpoints
- Error handling tests
- Validation tests

```

## Notes

- Data is stored in memory and will be lost when the server restarts
- The application automatically generates unique IDs for new users
- Input validation is performed on all create and update operations
```
