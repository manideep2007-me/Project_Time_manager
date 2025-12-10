# Development Guide - Project Time Manager

## 🚀 Getting Started

This guide will help you set up the development environment and understand the codebase structure for the Project Time Manager application.

---

## 📋 Prerequisites

### Required Software
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ (v15+ recommended)
- **Git**: For version control
- **Expo CLI**: For mobile development
- **Code Editor**: VS Code recommended

### Optional Tools
- **Postman/Insomnia**: API testing
- **pgAdmin**: Database management
- **React Native Debugger**: Mobile debugging
- **Docker**: Containerized development

---

## 🏗️ Project Structure

```
project-manager5/
├── client/                 # React Native mobile app
│   ├── src/
│   │   ├── screens/        # Screen components
│   │   ├── services/       # API services
│   │   └── theme/          # Theme configuration
│   ├── App.js             # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/            # Database configuration
│   ├── database/          # Database schema and migrations
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── tests/             # Test files
│   ├── index.js           # Server entry point
│   └── package.json
├── docs/                  # Documentation files
├── scripts/               # Build and deployment scripts
└── package.json           # Root package.json
```

---

## 🔧 Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd project-manager5

# Install all dependencies
npm run install-all

# Or install separately
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE project_time_manager;"

# Run database schema
psql -U postgres -d project_time_manager -f server/database/schema.sql

# Verify setup
psql -U postgres -d project_time_manager -f verify-database.sql
```

### 3. Environment Configuration

#### Server Environment (.env)
```bash
# Copy template
cp server/env-template.txt server/.env

# Edit server/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

#### Client Configuration
Update `client/src/services/api.js`:
```javascript
const BASE_URL = 'http://localhost:5000/api'; // Development
// const BASE_URL = 'http://your-ip:5000/api'; // Physical device
```

### 4. Start Development Servers

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start mobile app
cd client
npm start
```

---

## 📱 Mobile Development

### React Native with Expo

The mobile app is built with React Native using Expo for cross-platform development.

#### Key Dependencies
- **React Navigation**: Navigation between screens
- **React Native Paper**: Material Design components
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data storage
- **Moment.js**: Date/time manipulation

#### Screen Structure
```
src/screens/
├── LoginScreen.js          # Authentication
├── DashboardScreen.js      # Main dashboard
├── ProjectsScreen.js       # Projects list
├── ProjectDetailScreen.js  # Project details
├── EmployeesScreen.js      # Employees list
├── EmployeeDetailScreen.js # Employee details
├── TimeTrackingScreen.js   # Time tracking
└── TimeEntryScreen.js      # Time entry form
```

#### Navigation Flow
```
LoginScreen
    ↓
DashboardScreen (Tab Navigator)
    ├── Projects Tab
    │   ├── ProjectsScreen
    │   └── ProjectDetailScreen
    ├── Employees Tab
    │   ├── EmployeesScreen
    │   └── EmployeeDetailScreen
    └── Time Tracking Tab
        ├── TimeTrackingScreen
        └── TimeEntryScreen
```

#### State Management
- **Local State**: React hooks (useState, useEffect)
- **API State**: Custom hooks for data fetching
- **Authentication**: Context API for user state
- **Storage**: AsyncStorage for token persistence

### Development Commands

```bash
# Start Expo development server
npm start

# Run on specific platform
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser

# Clear cache
expo start -c

# Build for production
expo build:android
expo build:ios
```

### Debugging

#### React Native Debugger
1. Install React Native Debugger
2. Start the app in debug mode
3. Open React Native Debugger
4. Enable network inspection for API calls

#### Console Logging
```javascript
// API calls
console.log('API Response:', response.data);

// State updates
console.log('State updated:', newState);

// Error handling
console.error('API Error:', error);
```

---

## 🖥️ Backend Development

### Node.js with Express

The backend is built with Node.js and Express.js, providing a RESTful API.

#### Key Dependencies
- **Express**: Web framework
- **PostgreSQL**: Database with pg driver
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Helmet**: Security headers
- **Express Validator**: Input validation
- **Morgan**: Request logging

#### Project Structure
```
server/
├── config/
│   └── database.js         # Database configuration
├── database/
│   └── schema.sql          # Database schema
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── validation.js      # Input validation
│   ├── security.js        # Security middleware
│   └── audit.js           # Audit logging
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── clients.js         # Client management
│   ├── projects.js        # Project management
│   ├── employees.js       # Employee management
│   ├── timeEntries.js     # Time tracking
│   └── dashboard.js       # Analytics
├── tests/
│   ├── auth.test.js       # Authentication tests
│   └── timeEntries.test.js # Time tracking tests
└── index.js               # Server entry point
```

#### API Architecture
```
index.js
├── Middleware Stack
│   ├── Security (Helmet, CORS)
│   ├── Rate Limiting
│   ├── Request Logging
│   └── Authentication
├── Route Handlers
│   ├── /api/auth
│   ├── /api/clients
│   ├── /api/projects
│   ├── /api/employees
│   ├── /api/time-entries
│   └── /api/dashboard
└── Error Handling
```

### Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run specific test
npm test -- --grep "Authentication"

# Database operations
psql -U postgres -d project_time_manager -f database/schema.sql
```

### Database Development

#### Schema Management
```sql
-- Create new table
CREATE TABLE new_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new column
ALTER TABLE existing_table ADD COLUMN new_column VARCHAR(100);

-- Create index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Create trigger
CREATE TRIGGER trigger_name
    BEFORE INSERT OR UPDATE ON table_name
    FOR EACH ROW EXECUTE FUNCTION function_name();
```

#### Sample Data
The database includes sample data for development:
- 3 sample clients
- 5 sample employees with different salary types
- 3 sample projects
- Default admin user

#### Database Functions
```sql
-- Calculate hourly rate based on salary type
CREATE OR REPLACE FUNCTION calculate_hourly_rate(
    salary_type salary_type,
    salary_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
BEGIN
    CASE salary_type
        WHEN 'hourly' THEN RETURN salary_amount;
        WHEN 'daily' THEN RETURN salary_amount / 8;
        WHEN 'monthly' THEN RETURN salary_amount / (30 * 8);
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

## 🧪 Testing

### Backend Testing

#### Test Structure
```
server/tests/
├── setup.js              # Test setup and configuration
├── auth.test.js          # Authentication tests
├── timeEntries.test.js   # Time tracking tests
├── projects.test.js      # Project management tests
└── employees.test.js     # Employee management tests
```

#### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

#### Test Examples
```javascript
// Authentication test
describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@company.com',
        password: 'admin123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### Frontend Testing

#### Manual Testing Checklist
- [ ] Authentication flow (login/logout)
- [ ] Navigation between screens
- [ ] Time tracking start/stop
- [ ] Data loading and display
- [ ] Error handling
- [ ] Form validation
- [ ] API integration

#### Device Testing
- [ ] iOS simulator
- [ ] Android emulator
- [ ] Physical iOS device
- [ ] Physical Android device
- [ ] Different screen sizes

---

## 🔧 Development Tools

### VS Code Extensions
- **ES7+ React/Redux/React-Native snippets**
- **PostgreSQL** (database management)
- **REST Client** (API testing)
- **Thunder Client** (API testing)
- **GitLens** (Git integration)
- **Prettier** (code formatting)
- **ESLint** (code linting)

### Database Tools
- **pgAdmin**: PostgreSQL administration
- **DBeaver**: Universal database tool
- **TablePlus**: Modern database client

### API Testing
- **Postman**: API testing and documentation
- **Insomnia**: API client
- **Thunder Client**: VS Code extension

### Mobile Development
- **Expo Go**: Mobile app testing
- **React Native Debugger**: Debugging tool
- **Flipper**: Mobile debugging platform

---

## 📝 Code Standards

### JavaScript/React Native
```javascript
// Use functional components with hooks
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependency]);
  
  return (
    <View>
      <Text>{prop1}</Text>
    </View>
  );
};

// Use async/await for API calls
const fetchData = async () => {
  try {
    const response = await api.get('/endpoint');
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
```

### Node.js/Express
```javascript
// Use async/await for route handlers
const getProjects = async (req, res) => {
  try {
    const projects = await db.query('SELECT * FROM projects');
    res.json({
      success: true,
      data: projects.rows
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Use middleware for common functionality
const validateProject = [
  body('name').notEmpty().withMessage('Name is required'),
  body('client_id').isUUID().withMessage('Invalid client ID')
];
```

### Database
```sql
-- Use descriptive names
CREATE TABLE project_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    -- ... other columns
);

-- Add proper indexes
CREATE INDEX idx_time_entries_project ON project_time_entries(project_id);
CREATE INDEX idx_time_entries_employee ON project_time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON project_time_entries(start_time);
```

---

## 🐛 Debugging

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database exists
psql -U postgres -l

# Test connection
psql -U postgres -d project_time_manager -c "SELECT 1;"
```

#### API Connection
```bash
# Check server is running
curl http://localhost:5000/api/health

# Check CORS settings
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/health
```

#### Mobile App Issues
```bash
# Clear Expo cache
expo start -c

# Reset Metro bundler
npx react-native start --reset-cache

# Check device network
ping your-server-ip
```

### Debugging Tools

#### Backend Debugging
```javascript
// Add debug logging
console.log('Request body:', req.body);
console.log('Query params:', req.query);
console.log('User:', req.user);

// Use debugger
debugger; // Set breakpoint

// Log SQL queries
console.log('SQL Query:', query);
console.log('Query params:', params);
```

#### Frontend Debugging
```javascript
// React Native Debugger
console.log('Component rendered');
console.log('State:', state);
console.log('Props:', props);

// Network debugging
console.log('API Request:', request);
console.log('API Response:', response);

// Use Flipper for advanced debugging
```

---

## 🚀 Deployment

### Development Deployment
```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm start
```

### Production Deployment
```bash
# Build mobile app
cd client
expo build:android
expo build:ios

# Deploy backend
cd server
npm install --production
pm2 start ecosystem.config.js
```

---

## 📚 Learning Resources

### React Native
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)

### Node.js/Express
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Development Tools
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [pgAdmin](https://www.pgadmin.org/)

---

## 🤝 Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Code Review Process
1. Create feature branch
2. Make changes with tests
3. Submit pull request
4. Code review
5. Merge to main

### Commit Message Format
```
type(scope): description

feat(auth): add JWT token refresh
fix(api): resolve time entry validation
docs(readme): update installation guide
```

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Guide Version**: 1.0.0




