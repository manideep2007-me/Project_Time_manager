# API Documentation - Project Time Manager

## 🌐 API Overview

The Project Time Manager API is a RESTful web service built with Node.js and Express.js. It provides comprehensive endpoints for managing projects, employees, time tracking, and analytics.

**Base URL**: `http://localhost:5000/api` (development)  
**Production URL**: `https://yourdomain.com/api`

---

## 🔐 Authentication

All API endpoints (except login/register) require authentication via JWT token.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Token Management
- Tokens expire after 24 hours (configurable)
- Automatic token refresh on client side
- 401 status code for expired/invalid tokens

---

## 📋 API Endpoints

### Authentication Endpoints

#### POST /auth/login
**Description**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "admin@company.com",
  "password": "admin123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@company.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin"
    }
  }
}
```

#### POST /auth/register
**Description**: Register new supervisor user

**Request Body**:
```json
{
  "email": "supervisor@company.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### GET /auth/profile
**Description**: Get current user profile

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@company.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /auth/change-password
**Description**: Change user password

**Request Body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

### Client Endpoints

#### GET /clients
**Description**: Get all clients with optional filtering

**Query Parameters**:
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `search` (optional): Search by name or email

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "name": "Acme Corporation",
        "email": "contact@acme.com",
        "phone": "+1-555-0123",
        "address": "123 Business St, City, State",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

#### GET /clients/:id
**Description**: Get specific client by ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1-555-0123",
    "address": "123 Business St, City, State",
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "status": "active",
        "total_cost": 15000.00
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /clients
**Description**: Create new client

**Request Body**:
```json
{
  "name": "New Client Inc",
  "email": "info@newclient.com",
  "phone": "+1-555-0456",
  "address": "456 New St, City, State"
}
```

#### PUT /clients/:id
**Description**: Update existing client

#### DELETE /clients/:id
**Description**: Delete client (soft delete)

---

### Project Endpoints

#### GET /projects
**Description**: Get all projects with optional filtering

**Query Parameters**:
- `page`, `limit`, `search` (optional): Pagination and search
- `client_id` (optional): Filter by client
- `status` (optional): Filter by status (active, completed, on_hold)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "description": "Complete website overhaul",
        "client_id": "uuid",
        "client_name": "Acme Corporation",
        "status": "active",
        "start_date": "2024-01-01",
        "end_date": "2024-06-01",
        "budget": 50000.00,
        "total_cost": 15000.00,
        "total_hours": 120.5,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
  }
}
```

#### GET /projects/:id
**Description**: Get specific project with detailed information

#### GET /projects/:id/stats
**Description**: Get project statistics and analytics

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "project": {
      "id": "uuid",
      "name": "Website Redesign",
      "total_cost": 15000.00,
      "total_hours": 120.5,
      "employee_count": 3,
      "time_entries_count": 45
    },
    "employees": [
      {
        "employee_id": "EMP001",
        "name": "John Doe",
        "hours": 45.5,
        "cost": 6825.00,
        "percentage": 45.5
      }
    ],
    "daily_stats": [
      {
        "date": "2024-01-01",
        "hours": 8.0,
        "cost": 1200.00
      }
    ]
  }
}
```

#### POST /projects
**Description**: Create new project

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "client_id": "uuid",
  "status": "active",
  "start_date": "2024-01-01",
  "end_date": "2024-06-01",
  "budget": 30000.00
}
```

#### PUT /projects/:id
**Description**: Update existing project

#### DELETE /projects/:id
**Description**: Delete project (soft delete)

---

### Employee Endpoints

#### GET /employees
**Description**: Get all employees with optional filtering

**Query Parameters**:
- `page`, `limit`, `search` (optional): Pagination and search
- `department` (optional): Filter by department
- `status` (optional): Filter by active/inactive status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "uuid",
        "employee_id": "EMP001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@company.com",
        "phone": "+1-555-0123",
        "department": "Engineering",
        "salary_type": "hourly",
        "salary_amount": 75.00,
        "hourly_rate": 75.00,
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
  }
}
```

#### GET /employees/:id
**Description**: Get specific employee with detailed information

#### GET /employees/:id/time-entries
**Description**: Get time entries for specific employee

#### GET /employees/departments/list
**Description**: Get list of all departments

**Response** (200 OK):
```json
{
  "success": true,
  "data": ["Engineering", "Design", "Marketing", "Sales"]
}
```

#### POST /employees
**Description**: Create new employee

**Request Body**:
```json
{
  "employee_id": "EMP002",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@company.com",
  "phone": "+1-555-0456",
  "department": "Design",
  "salary_type": "monthly",
  "salary_amount": 6000.00
}
```

#### PUT /employees/:id
**Description**: Update existing employee

#### PATCH /employees/:id/toggle-status
**Description**: Toggle employee active/inactive status

#### DELETE /employees/:id
**Description**: Delete employee (soft delete)

---

### Time Entry Endpoints

#### GET /time-entries
**Description**: Get all time entries with optional filtering

**Query Parameters**:
- `page`, `limit` (optional): Pagination
- `project_id` (optional): Filter by project
- `employee_id` (optional): Filter by employee
- `start_date`, `end_date` (optional): Date range filtering
- `status` (optional): Filter by status (active, completed)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "time_entries": [
      {
        "id": "uuid",
        "project_id": "uuid",
        "project_name": "Website Redesign",
        "employee_id": "uuid",
        "employee_name": "John Doe",
        "start_time": "2024-01-01T09:00:00Z",
        "end_time": "2024-01-01T17:00:00Z",
        "duration_hours": 8.0,
        "hourly_rate": 75.00,
        "total_cost": 600.00,
        "description": "Working on homepage design",
        "status": "completed",
        "created_at": "2024-01-01T09:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "pages": 1 }
  }
}
```

#### GET /time-entries/active/list
**Description**: Get all currently active time entries

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "project_name": "Website Redesign",
      "employee_id": "uuid",
      "employee_name": "John Doe",
      "start_time": "2024-01-01T09:00:00Z",
      "description": "Working on homepage design",
      "duration_hours": 2.5,
      "hourly_rate": 75.00,
      "current_cost": 187.50
    }
  ]
}
```

#### POST /time-entries/start
**Description**: Start time tracking for an employee on a project

**Request Body**:
```json
{
  "projectId": "uuid",
  "employeeId": "uuid",
  "description": "Starting work on new feature"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Time tracking started successfully",
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "employee_id": "uuid",
    "start_time": "2024-01-01T09:00:00Z",
    "description": "Starting work on new feature",
    "status": "active"
  }
}
```

#### PUT /time-entries/:id/stop
**Description**: Stop time tracking for a specific entry

**Request Body**:
```json
{
  "description": "Completed the task"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Time tracking stopped successfully",
  "data": {
    "id": "uuid",
    "end_time": "2024-01-01T17:00:00Z",
    "duration_hours": 8.0,
    "total_cost": 600.00,
    "status": "completed"
  }
}
```

#### POST /time-entries
**Description**: Create manual time entry

**Request Body**:
```json
{
  "project_id": "uuid",
  "employee_id": "uuid",
  "start_time": "2024-01-01T09:00:00Z",
  "end_time": "2024-01-01T17:00:00Z",
  "description": "Manual time entry"
}
```

#### PUT /time-entries/:id
**Description**: Update existing time entry

#### DELETE /time-entries/:id
**Description**: Delete time entry

---

### Dashboard Endpoints

#### GET /dashboard/overview
**Description**: Get dashboard overview statistics

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_projects": 5,
      "active_projects": 3,
      "total_employees": 12,
      "active_employees": 10,
      "total_cost": 45000.00,
      "total_hours": 600.5
    },
    "recent_entries": [
      {
        "id": "uuid",
        "project_name": "Website Redesign",
        "employee_name": "John Doe",
        "duration_hours": 8.0,
        "cost": 600.00,
        "created_at": "2024-01-01T17:00:00Z"
      }
    ],
    "top_projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "total_cost": 15000.00,
        "total_hours": 120.5
      }
    ],
    "top_employees": [
      {
        "id": "uuid",
        "name": "John Doe",
        "total_hours": 45.5,
        "total_cost": 3412.50
      }
    ]
  }
}
```

#### GET /dashboard/projects/analytics
**Description**: Get project analytics

**Query Parameters**:
- `projectId` (optional): Specific project ID
- `startDate`, `endDate` (optional): Date range

#### GET /dashboard/employees/analytics
**Description**: Get employee analytics

**Query Parameters**:
- `employeeId` (optional): Specific employee ID
- `startDate`, `endDate` (optional): Date range

#### GET /dashboard/cost-analysis
**Description**: Get cost analysis data

**Query Parameters**:
- `startDate`, `endDate` (optional): Date range
- `groupBy` (optional): Group by day, week, month

---

## 📊 Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## 🔒 Rate Limiting

### Rate Limits
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Time Tracking**: 10 requests per minute

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Too many requests",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

---

## 🧪 Testing

### Health Check
```http
GET /api/health
```

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

### Test Data
The API includes sample data for testing:
- 3 sample clients
- 5 sample employees with different salary types
- 3 sample projects
- Default admin user (admin@company.com / admin123)

---

## 📝 Examples

### Complete Time Tracking Flow

1. **Start Time Tracking**:
```bash
curl -X POST http://localhost:5000/api/time-entries/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "uuid", "employeeId": "uuid", "description": "Working on feature"}'
```

2. **Check Active Entries**:
```bash
curl -X GET http://localhost:5000/api/time-entries/active/list \
  -H "Authorization: Bearer <token>"
```

3. **Stop Time Tracking**:
```bash
curl -X PUT http://localhost:5000/api/time-entries/uuid/stop \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"description": "Task completed"}'
```

### Dashboard Analytics
```bash
curl -X GET "http://localhost:5000/api/dashboard/overview" \
  -H "Authorization: Bearer <token>"
```

---

## 🔄 Webhooks (Future)

Planned webhook endpoints for real-time updates:
- `POST /webhooks/time-entry-started`
- `POST /webhooks/time-entry-stopped`
- `POST /webhooks/project-updated`
- `POST /webhooks/employee-status-changed`

---

**Last Updated**: January 2024  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0




