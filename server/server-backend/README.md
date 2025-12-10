# Project Time Manager - Backend API

A comprehensive Node.js backend API for managing projects, employees, clients, and time tracking with PostgreSQL database.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Client Management**: Full CRUD operations for client management
- **Project Management**: Complete project lifecycle management with status tracking
- **Employee Management**: Employee profiles with salary tracking and performance metrics
- **Time Tracking**: Comprehensive time entry management with cost calculation
- **Dashboard & Analytics**: Rich analytics and reporting capabilities
- **File Uploads**: Task-related file upload functionality
- **OTP System**: Phone number verification system

### Advanced Features
- **Audit Logging**: Complete audit trail for all operations
- **Rate Limiting**: API rate limiting for security
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling with detailed responses
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Database Migrations**: Automated database setup and seeding

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=project_time_manager
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   HOST=0.0.0.0
   CLIENT_URL=http://localhost:3000

   # Admin Default Credentials
   ADMIN_EMAIL=admin@company.com
   ADMIN_PASSWORD=admin123
   ```

4. **Database Setup**
   ```bash
   # Create database and run migrations
   npm run setup-db
   
   # Seed with sample data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, visit `http://localhost:5000/api-docs` for interactive API documentation.

## 🗄️ Database Schema

### Core Tables
- **users**: System users (admin, manager, employee roles)
- **clients**: Client information and contact details
- **employees**: Employee profiles with salary information
- **projects**: Project details with status tracking
- **time_entries**: Time tracking records with cost calculation
- **audit_logs**: System audit trail

### Key Relationships
- Projects belong to Clients
- Time Entries belong to Projects and Employees
- All operations are audited for compliance

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **admin**: Full system access
- **manager**: Project and employee management
- **employee**: Time tracking and limited access

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Clients
- `GET /api/clients` - List clients (with pagination and search)
- `GET /api/clients/:id` - Get specific client
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Projects
- `GET /api/projects` - List projects (with filters)
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/time-entries` - Get project time entries

### Employees
- `GET /api/employees` - List employees (with filters)
- `GET /api/employees/:id` - Get specific employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Soft delete employee
- `GET /api/employees/:id/time-entries` - Get employee time entries
- `GET /api/employees/:id/summary` - Get employee performance summary

### Time Entries
- `GET /api/time-entries` - List time entries (with filters)
- `GET /api/time-entries/:id` - Get specific time entry
- `POST /api/time-entries` - Create new time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Soft delete time entry
- `GET /api/time-entries/summary/overview` - Get time tracking summary

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/analytics` - Get detailed analytics
- `GET /api/dashboard/reports` - Get various reports

### File Uploads
- `POST /api/task-uploads` - Upload task-related files

### OTP
- `POST /api/otp/send` - Send OTP to phone number
- `POST /api/otp/verify` - Verify OTP

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | project_time_manager |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | 7d |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `CLIENT_URL` | Frontend URL | http://localhost:3000 |

### Rate Limiting
- General API: 1000 requests per 15 minutes
- Authentication: 100 requests per 15 minutes

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring

The API includes comprehensive logging and monitoring:
- Request logging with Morgan
- Audit logging for all operations
- Error tracking and reporting
- Health check endpoint at `/api/health`

## 🚀 Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up SSL/TLS
6. Configure reverse proxy (nginx)
7. Set up monitoring and logging

### Docker Deployment
```bash
# Build Docker image
docker build -t project-time-manager-api .

# Run container
docker run -p 5000:5000 --env-file .env project-time-manager-api
```

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- Rate limiting
- CORS configuration
- Security headers (Helmet.js)
- Audit logging

## 📝 API Response Format

### Success Response
```json
{
  "data": { ... },
  "message": "Success message",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": ["Validation error details"]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@projectmanager.com
- Documentation: http://localhost:5000/api-docs

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete CRUD operations for all entities
- JWT authentication
- Comprehensive analytics and reporting
- Swagger API documentation
- Audit logging
- File upload functionality