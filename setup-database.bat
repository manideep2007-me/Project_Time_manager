@echo off
echo 🗄️ Setting up PostgreSQL Database for Project Time Manager
echo ========================================================

echo.
echo Step 1: Checking PostgreSQL installation...
"C:\Program Files\PostgreSQL\15\bin\psql" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL not found. Please install PostgreSQL first.
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo ✅ PostgreSQL found!

echo.
echo Step 2: Creating database...
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -c "CREATE DATABASE project_time_manager;" 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Database might already exist or connection failed.
    echo Please check your PostgreSQL password.
)

echo.
echo Step 3: Running schema script...
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d project_time_manager -f server\database\schema.sql
if %errorlevel% neq 0 (
    echo ❌ Schema setup failed. Please check the error messages above.
    pause
    exit /b 1
)
echo ✅ Schema created successfully!

echo.
echo Step 4: Verifying setup...
"C:\Program Files\PostgreSQL\15\bin\psql" -U postgres -d project_time_manager -f verify-database.sql
if %errorlevel% neq 0 (
    echo ⚠️  Verification failed. Please check the error messages above.
)

echo.
echo Step 5: Creating environment file...
if not exist server\.env (
    echo # Database Configuration > server\.env
    echo DB_HOST=localhost >> server\.env
    echo DB_PORT=5432 >> server\.env
    echo DB_NAME=project_time_manager >> server\.env
    echo DB_USER=postgres >> server\.env
    echo DB_PASSWORD=your_postgres_password_here >> server\.env
    echo. >> server\.env
    echo # JWT Configuration >> server\.env
    echo JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random >> server\.env
    echo JWT_EXPIRES_IN=24h >> server\.env
    echo. >> server\.env
    echo # Server Configuration >> server\.env
    echo PORT=5000 >> server\.env
    echo NODE_ENV=development >> server\.env
    echo CLIENT_URL=http://localhost:3000 >> server\.env
    echo. >> server\.env
    echo # Admin Default Credentials >> server\.env
    echo ADMIN_EMAIL=admin@company.com >> server\.env
    echo ADMIN_PASSWORD=admin123 >> server\.env
    echo ✅ Environment file created: server\.env
    echo 📝 Please update the database password in server\.env
) else (
    echo 📝 Environment file already exists: server\.env
)

echo.
echo 🎉 Database setup complete!
echo.
echo Next steps:
echo 1. Update server\.env with your PostgreSQL password
echo 2. Run: cd server ^&^& npm install ^&^& npm run dev
echo 3. Test: http://localhost:5000/api/health
echo.
pause






