# Project Time Manager

A comprehensive mobile application for tracking employee time and project costs in service-based companies. Built with React Native for the mobile app and Node.js/PostgreSQL for the backend.

## 🚀 Features

### Core Functionality
- **Time Tracking**: Start/stop timer functionality for employees on specific projects
- **Cost Calculation**: Automatic cost calculation based on employee salary structures (hourly, daily, monthly)
- **Project Management**: Track multiple projects across different clients
- **Employee Management**: Manage employee information and salary structures
- **Dashboard & Reporting**: Comprehensive analytics and reporting

### Key Capabilities
- Real-time time tracking with start/stop functionality
- Automatic cost calculation based on employee salary types
- Project overview with total costs and employee breakdowns
- Employee performance tracking and analytics
- Client and project management
- Detailed reporting and analytics dashboard

## 🏗️ Architecture

### Backend (Node.js + PostgreSQL)
- **RESTful API** with Express.js
- **PostgreSQL** database with optimized schema
- **JWT Authentication** for secure access
- **Automatic cost calculation** triggers
- **Comprehensive reporting** endpoints

### Frontend (React Native)
- **Cross-platform** mobile app (iOS/Android)
- **Material Design** with React Native Paper
- **Real-time updates** and intuitive UI
- **Offline-capable** with data synchronization

## 📋 Prerequisites

Before running this application, ensure you have:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Expo CLI** for React Native development
- **Git** for version control

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project-manager5
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd server
npm install
```

#### Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE project_time_manager;
```

2. Run the schema script:
```bash
psql -U your_username -d project_time_manager -f database/schema.sql
```

#### Environment Configuration
Create a `.env` file in the `server` directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=your_db_username
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Admin Default Credentials
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

#### Start the Backend Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Frontend Setup (React Native)

#### Install Dependencies
```bash
cd client
npm install
```

#### Start the Development Server
```bash
npm start
```

This will start the Expo development server. You can then:
- Scan the QR code with Expo Go app on your phone
- Press `i` for iOS simulator
- Press `a` for Android emulator

## 🔧 Configuration

### API Configuration
Update the API base URL in `client/src/services/api.js`:
```javascript
const BASE_URL = 'http://your-server-ip:5000/api';
```

For physical device testing, replace `localhost` with your computer's IP address.

### Database Configuration
The application comes with sample data including:
- 3 sample clients
- 5 sample employees with different salary structures
- 3 sample projects
- Default admin user (admin@company.com / admin123)

## 📱 Usage

### Getting Started
1. **Login**: Use the default admin credentials or create a new supervisor account
2. **Dashboard**: View overview of projects, employees, and time tracking
3. **Time Tracking**: Start/stop time entries for employees on projects
4. **Projects**: View and manage project details and statistics
5. **Employees**: Manage employee information and view their time entries

### Key Workflows

#### Starting Time Tracking
1. Go to "Time Tracking" tab
2. Tap "Start Tracking" FAB
3. Select project and employee
4. Add optional description
5. Tap "Start Tracking"

#### Stopping Time Tracking
1. Go to "Time Tracking" tab
2. Find the active time entry
3. Tap "Stop" button
4. Add optional description

#### Viewing Project Details
1. Go to "Projects" tab
2. Tap on any project
3. View detailed statistics and employee breakdown

#### Adding Manual Time Entry
1. Go to "Time Tracking" tab
2. Tap "Start Tracking" FAB
3. Select "Add Time Entry" option
4. Fill in start/end times manually

## 🗄️ Database Schema

### Core Tables
- **clients**: Client information
- **projects**: Project details linked to clients
- **employees**: Employee information with salary structures
- **users**: Supervisor/admin authentication
- **time_entries**: Time tracking records with automatic cost calculation

### Key Features
- **Automatic cost calculation** via database triggers
- **Hourly rate calculation** based on salary type
- **Comprehensive indexing** for performance
- **Data integrity** constraints and foreign keys

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Password hashing** with bcrypt and salt rounds
- **Role-based access control** (Admin, Supervisor roles)
- **Session management** with automatic token validation
- **Multi-factor authentication** ready (future enhancement)

### Input Security
- **Comprehensive input validation** with express-validator
- **SQL injection prevention** with parameterized queries
- **XSS protection** with input sanitization
- **CSRF protection** with secure headers
- **Data type validation** and format checking

### API Security
- **Rate limiting** with multiple tiers (general, auth, time-tracking)
- **Request throttling** and burst protection
- **Security headers** with Helmet.js
- **CORS configuration** with origin restrictions
- **Audit logging** for all security events

### Database Security
- **Encrypted connections** with SSL/TLS
- **Connection pooling** for secure access
- **Data integrity** with constraints and triggers
- **Backup encryption** and secure storage
- **Access logging** and monitoring

## 📊 Reporting & Analytics

### Dashboard Metrics
- Total cost across all projects
- Active projects and employees
- Recent time entries
- Top projects by cost
- Top employees by hours

### Project Analytics
- Total hours and cost per project
- Employee breakdown with individual contributions
- Daily time entry patterns
- Project status and budget tracking

### Employee Analytics
- Individual time tracking statistics
- Project participation breakdown
- Performance metrics and trends

## 🚀 Deployment

### Backend Deployment
1. Set up PostgreSQL database on your server
2. Configure environment variables
3. Deploy Node.js application (PM2, Docker, etc.)
4. Set up reverse proxy (Nginx)

### Mobile App Deployment
1. Build production APK/IPA files
2. Submit to Google Play Store / Apple App Store
3. Configure app signing and certificates

## 🧪 Testing

### Automated Testing
```bash
# Backend testing
cd server
npm test

# Run specific test suites
npm test -- --grep "Authentication"
npm test -- --grep "Time Entries"
npm test -- --grep "Security"
```

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load and stress testing
- **Database Tests**: Data integrity and triggers

### Manual Testing Checklist
- [ ] Authentication and authorization flows
- [ ] Time tracking start/stop functionality
- [ ] Cost calculation accuracy
- [ ] Input validation and error handling
- [ ] Rate limiting and security measures
- [ ] Mobile app functionality across devices
- [ ] Database triggers and constraints

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists and schema is loaded

#### API Connection
- Verify server is running on correct port
- Check firewall settings
- Update API base URL for mobile app

#### Mobile App Issues
- Clear Expo cache: `expo start -c`
- Restart Metro bundler
- Check device network connectivity

## 📈 Future Enhancements

### Planned Features
- **Offline capability** with data synchronization
- **Push notifications** for time tracking reminders
- **Advanced reporting** with PDF/Excel export
- **Project budgeting** and cost tracking
- **Team collaboration** features
- **Integration** with external time tracking tools
- **Multi-factor authentication** (MFA)
- **Advanced analytics** and machine learning insights

### Technical Improvements
- **Real-time updates** with WebSockets
- **Advanced caching** strategies with Redis
- **Performance optimization** and monitoring
- **Enhanced security** measures
- **Microservices architecture** migration
- **Container orchestration** with Docker/Kubernetes

## 📚 Documentation

### Comprehensive Guides
- **[Complete Documentation](DOCUMENTATION.md)** - Master documentation index
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Developer setup and guidelines
- **[User Guide](USER_GUIDE.md)** - End-user manual and tutorials
- **[Architecture Guide](ARCHITECTURE.md)** - System architecture and design
- **[Security Documentation](SECURITY.md)** - Complete security implementation
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Database Setup](DATABASE_SETUP.md)** - Database configuration guide

### Component Documentation
- **[Backend API](server/README.md)** - Server-side API reference
- **[Mobile App](client/README.md)** - Frontend development guide

### Additional Resources
- **Setup Scripts**: Automated installation and configuration
- **Testing Suite**: Comprehensive test coverage
- **Monitoring**: Production monitoring and alerting
- **Backup Strategy**: Data protection and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Project Time Manager** - Efficiently track time and costs for your service-based business! 🚀
