# PostgreSQL Database Setup Guide

## 🗄️ Step-by-Step Database Setup

### **Step 1: Install PostgreSQL**

#### **Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer as Administrator
3. Set password for `postgres` user (remember this!)
4. Use default port 5432
5. Complete installation

#### **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### **Step 2: Create Database**

#### **Windows (Command Line):**
```cmd
# Open Command Prompt as Administrator
cd "C:\Program Files\PostgreSQL\15\bin"
psql -U postgres

# In psql prompt:
CREATE DATABASE project_time_manager;
\q
```

#### **Linux/macOS:**
```bash
sudo -u postgres psql
CREATE DATABASE project_time_manager;
\q
```

### **Step 3: Run Schema Script**

#### **Windows:**
```cmd
# From your project directory
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d project_time_manager -f server\database\schema.sql
```

#### **Linux/macOS:**
```bash
psql -U postgres -d project_time_manager -f server/database/schema.sql
```

### **Step 4: Verify Setup**

Run the verification script:
```cmd
# Windows
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d project_time_manager -f verify-database.sql

# Linux/macOS
psql -U postgres -d project_time_manager -f verify-database.sql
```

### **Step 5: Configure Environment**

Create `server/.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Admin Default Credentials
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
```

### **Step 6: Test Connection**

Start the server:
```bash
cd server
npm install
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📊 Connected to PostgreSQL database
📱 Health check: http://localhost:5000/api/health
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **"psql: command not found"**
   - Add PostgreSQL bin directory to PATH
   - Windows: Add `C:\Program Files\PostgreSQL\15\bin` to PATH

2. **"password authentication failed"**
   - Check your postgres user password
   - Try: `psql -U postgres -h localhost`

3. **"database does not exist"**
   - Make sure you created the database first
   - Check database name spelling

4. **"permission denied"**
   - Make sure you're using the correct user
   - Check database permissions

### **Verification Commands:**

```sql
-- Check tables
\dt

-- Check functions
\df

-- Check triggers
SELECT * FROM information_schema.triggers;

-- Test sample data
SELECT * FROM clients LIMIT 5;
SELECT * FROM employees LIMIT 5;
```

## ✅ Success Indicators

You'll know the setup is successful when:
- ✅ Database connection established
- ✅ All tables created (clients, projects, employees, users, time_entries)
- ✅ All functions created (calculate_hourly_rate, etc.)
- ✅ All triggers created (cost calculation triggers)
- ✅ Sample data inserted
- ✅ Server starts without errors
- ✅ Health check endpoint responds: http://localhost:5000/api/health






