#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Project Time Manager Full-Stack Application...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'blue');
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error running command: ${command}`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

// Check if Node.js version is compatible
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 14) {
    log('❌ Node.js version 14 or higher is required', 'red');
    log(`Current version: ${nodeVersion}`, 'red');
    process.exit(1);
  }
  
  log(`✅ Node.js version ${nodeVersion} is compatible`, 'green');
}

// Create environment files
function createEnvFiles() {
  log('\n📝 Creating environment files...', 'yellow');
  
  // Backend .env
  const backendEnvPath = path.join(__dirname, 'server-backend', '.env');
  if (!fs.existsSync(backendEnvPath)) {
    const backendEnvContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=postgres
DB_PASSWORD=Super@123

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_123456789
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
HOST=0.0.0.0
CLIENT_URL=http://localhost:3000

# Admin Default Credentials
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123
`;
    
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    log('✅ Created server-backend/.env', 'green');
  } else {
    log('ℹ️  server-backend/.env already exists', 'blue');
  }
  
  // Frontend .env
  const frontendEnvPath = path.join(__dirname, 'frontend', 'mobile', '.env');
  if (!fs.existsSync(frontendEnvPath)) {
    const frontendEnvContent = `# Frontend Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
`;
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    log('✅ Created frontend/mobile/.env', 'green');
  } else {
    log('ℹ️  frontend/mobile/.env already exists', 'blue');
  }
}

// Install dependencies
function installDependencies() {
  log('\n📦 Installing dependencies...', 'yellow');
  
  // Root dependencies
  if (!runCommand('npm install')) {
    log('❌ Failed to install root dependencies', 'red');
    return false;
  }
  
  // Backend dependencies
  if (!runCommand('npm install', path.join(__dirname, 'server-backend'))) {
    log('❌ Failed to install backend dependencies', 'red');
    return false;
  }
  
  // Frontend dependencies
  if (!runCommand('npm install', path.join(__dirname, 'frontend', 'mobile'))) {
    log('❌ Failed to install frontend dependencies', 'red');
    return false;
  }
  
  log('✅ All dependencies installed successfully', 'green');
  return true;
}

// Setup database
function setupDatabase() {
  log('\n🗄️  Setting up database...', 'yellow');
  
  if (!runCommand('npm run setup-db', path.join(__dirname, 'server-backend'))) {
    log('❌ Failed to setup database', 'red');
    return false;
  }
  
  log('✅ Database setup completed', 'green');
  return true;
}

// Seed database
function seedDatabase() {
  log('\n🌱 Seeding database...', 'yellow');
  
  if (!runCommand('npm run seed', path.join(__dirname, 'server-backend'))) {
    log('❌ Failed to seed database', 'red');
    return false;
  }
  
  log('✅ Database seeded successfully', 'green');
  return true;
}

// Main setup function
async function main() {
  try {
    log('🎯 Project Time Manager Setup', 'bold');
    log('===============================', 'bold');
    
    // Check Node.js version
    checkNodeVersion();
    
    // Create environment files
    createEnvFiles();
    
    // Install dependencies
    if (!installDependencies()) {
      process.exit(1);
    }
    
    // Setup database
    if (!setupDatabase()) {
      log('⚠️  Database setup failed. Please check PostgreSQL is running.', 'yellow');
      log('You can run "npm run setup:db" later to retry.', 'blue');
    }
    
    // Seed database
    if (!seedDatabase()) {
      log('⚠️  Database seeding failed. You can run "npm run seed:db" later.', 'yellow');
    }
    
    log('\n🎉 Setup completed successfully!', 'green');
    log('\n📋 Next steps:', 'bold');
    log('1. Make sure PostgreSQL is running', 'blue');
    log('2. Update database credentials in server-backend/.env if needed', 'blue');
    log('3. Run "npm start" to start both frontend and backend', 'blue');
    log('4. Or run "npm run dev" for development mode with hot reload', 'blue');
    log('\n🔗 Useful commands:', 'bold');
    log('• npm start          - Start both frontend and backend', 'blue');
    log('• npm run dev        - Start in development mode', 'blue');
    log('• npm run start:backend  - Start only backend', 'blue');
    log('• npm run start:frontend - Start only frontend', 'blue');
    log('• npm run setup:db   - Setup database only', 'blue');
    log('• npm run seed:db    - Seed database only', 'blue');
    log('• npm run health     - Check backend health', 'blue');
    log('• npm run android    - Run on Android', 'blue');
    log('• npm run ios        - Run on iOS', 'blue');
    log('• npm run web        - Run on web', 'blue');
    
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run setup
main();
