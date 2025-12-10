@echo off
echo 🚀 Setting up Project Time Manager...
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL v12 or higher.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed!

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd server
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd client
call npm install
cd ..

REM Create environment file for server
echo ⚙️  Setting up environment configuration...
if not exist server\.env (
    copy server\env.example server\.env
    echo 📝 Created server\.env file. Please update with your database credentials.
) else (
    echo 📝 server\.env already exists.
)

echo.
echo 🗄️  Database Setup Required:
echo =============================
echo 1. Create a PostgreSQL database:
echo    CREATE DATABASE project_time_manager;
echo.
echo 2. Run the schema script:
echo    psql -U your_username -d project_time_manager -f server\database\schema.sql
echo.
echo 3. Update server\.env with your database credentials
echo.

echo 🚀 To start the application:
echo ============================
echo.
echo Backend (Command Prompt 1):
echo   cd server
echo   npm run dev
echo.
echo Frontend (Command Prompt 2):
echo   cd client
echo   npm start
echo.
echo 📱 Default Login Credentials:
echo   Email: admin@company.com
echo   Password: admin123
echo.
echo 🌐 Backend will run on: http://localhost:5000
echo 📱 Mobile app will be available via Expo
echo.
echo ✅ Setup complete! Follow the instructions above to start the application.
pause






