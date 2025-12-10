# Project Time Manager - Full Stack Application

A comprehensive project management and time tracking application built with React Native (Expo) frontend and Node.js backend with PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager
- Expo CLI (for mobile development)

### One-Command Setup
```bash
# Clone the repository
git clone <repository-url>
cd project-manager5

# Run the automated setup
node setup.js
```

### Manual Setup
```bash
# Install all dependencies
npm run install:all

# Setup database
npm run setup:db

# Seed database with sample data
npm run seed:db

# Start both frontend and backend
npm start
```

## 📱 Application Structure

```
project-manager5/
├── frontend/mobile/          # React Native (Expo) frontend
│   ├── src/
│   │   ├── api/             # API client and endpoints
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── navigation/      # Navigation configuration
│   │   ├── screens/         # App screens
│   │   ├── services/        # Business logic services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── package.json
├── server-backend/           # Node.js backend API
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API route handlers
│   │   └── index.js         # Server entry point
│   ├── database/            # Database schema and migrations
│   ├── scripts/             # Database setup and seeding
│   └── package.json
└── package.json             # Root package with integration scripts
```

## 🛠️ Available Scripts

### Development
```bash
npm start                    # Start both frontend and backend
npm run dev                  # Start in development mode with hot reload
npm run dev:backend          # Start only backend in dev mode
npm run dev:frontend         # Start only frontend in dev mode
```

### Individual Services
```bash
npm run start:backend        # Start only backend
npm run start:frontend       # Start only frontend
```

### Database Management
```bash
npm run setup:db            # Setup database schema
npm run seed:db             # Seed database with sample data
```

### Mobile Development
```bash
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run on web browser
```

### Utilities
```bash
npm run health              # Check backend health
npm run test                # Run backend tests
npm run clean               # Clean all node_modules
```

## 🔧 Configuration

### Backend Configuration
Create `server-backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=0.0.0.0
CLIENT_URL=http://localhost:3000
```

### Frontend Configuration
Create `frontend/mobile/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

## 📊 Features

### Frontend (React Native + Expo)
- **Authentication**: Login, registration, and profile management
- **Dashboard**: Overview of projects, time entries, and analytics
- **Project Management**: Create, edit, and track projects
- **Client Management**: Manage client information and relationships
- **Employee Management**: Employee profiles and performance tracking
- **Time Tracking**: Start/stop timers and manual time entry
- **File Uploads**: Upload task-related documents and images
- **Location Services**: GPS-based location tracking
- **Offline Support**: Basic offline functionality
- **Role-based UI**: Different interfaces for admin, supervisor, and employee roles

### Backend (Node.js + Express + PostgreSQL)
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based authentication with role-based access control
- **Database**: PostgreSQL with proper relationships and constraints
- **Validation**: Comprehensive input validation and sanitization
- **Security**: Rate limiting, CORS, security headers, and audit logging
- **File Uploads**: Multer-based file upload handling
- **Analytics**: Advanced reporting and analytics endpoints
- **API Documentation**: Interactive Swagger/OpenAPI documentation

### Database Features
- **Relational Design**: Proper foreign key relationships
- **Audit Trail**: Complete audit logging for compliance
- **Data Integrity**: Constraints and validation at database level
- **Performance**: Indexed queries for optimal performance
- **Migrations**: Automated database setup and schema management

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with three user roles:

- **Admin**: Full system access
- **Supervisor**: Project and employee management
- **Employee**: Time tracking and limited access

## 📱 Mobile Development

### Running on Devices
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Development Tools
- **Expo Dev Tools**: Available at http://localhost:19002
- **React Native Debugger**: For advanced debugging
- **Flipper**: For network and performance debugging

## 🌐 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run specific test suites
cd server-backend && npm test -- --grep "auth"
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment
1. Build for production: `expo build`
2. Deploy to app stores or web hosting
3. Update API endpoints for production

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Run `npm run setup:db` to create database

2. **Frontend Can't Connect to Backend**
   - Check if backend is running on port 5000
   - Verify `EXPO_PUBLIC_API_BASE_URL` in frontend `.env`
   - For Android emulator, use `http://10.0.2.2:5000`

3. **Port Already in Use**
   - Change `PORT` in backend `.env`
   - Update frontend API URL accordingly

4. **Dependencies Issues**
   - Run `npm run clean` to remove all node_modules
   - Run `npm run install:all` to reinstall dependencies

### Getting Help
- Check the logs: `npm run logs:backend`
- Verify health: `npm run health`
- Check API documentation: http://localhost:5000/api-docs

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the troubleshooting section

---

**Happy Coding! 🎉**