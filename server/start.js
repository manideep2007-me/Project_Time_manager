#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

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

// Check if backend is healthy
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for backend to be ready
async function waitForBackend(maxAttempts = 30) {
  log('🔍 Checking backend health...', 'yellow');
  
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkBackendHealth()) {
      log('✅ Backend is ready!', 'green');
      return true;
    }
    
    log(`⏳ Waiting for backend... (${i + 1}/${maxAttempts})`, 'blue');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  log('❌ Backend failed to start within expected time', 'red');
  return false;
}

// Start backend
function startBackend() {
  log('🚀 Starting backend server...', 'yellow');
  
  const backend = spawn('npm', ['start'], {
    cwd: './server-backend',
    stdio: 'pipe',
    shell: true
  });
  
  backend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Server running on')) {
      log('✅ Backend server started', 'green');
    }
  });
  
  backend.stderr.on('data', (data) => {
    log(`Backend Error: ${data.toString()}`, 'red');
  });
  
  backend.on('close', (code) => {
    log(`Backend process exited with code ${code}`, 'red');
  });
  
  return backend;
}

// Start frontend
function startFrontend() {
  log('📱 Starting frontend...', 'yellow');
  
  const frontend = spawn('npm', ['start'], {
    cwd: './frontend/mobile',
    stdio: 'inherit',
    shell: true
  });
  
  frontend.on('close', (code) => {
    log(`Frontend process exited with code ${code}`, 'red');
  });
  
  return frontend;
}

// Main function
async function main() {
  try {
    log('🎯 Project Time Manager - Starting Application', 'bold');
    log('===============================================', 'bold');
    
    // Start backend
    const backend = startBackend();
    
    // Wait for backend to be ready
    const backendReady = await waitForBackend();
    
    if (!backendReady) {
      log('❌ Failed to start backend. Please check the logs.', 'red');
      process.exit(1);
    }
    
    // Start frontend
    const frontend = startFrontend();
    
    // Handle process termination
    process.on('SIGINT', () => {
      log('\n🛑 Shutting down application...', 'yellow');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      log('\n🛑 Shutting down application...', 'yellow');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });
    
    log('\n🎉 Application started successfully!', 'green');
    log('📱 Frontend: Expo Dev Tools will open automatically', 'blue');
    log('🔧 Backend: http://localhost:5000', 'blue');
    log('📚 API Docs: http://localhost:5000/api-docs', 'blue');
    log('\nPress Ctrl+C to stop the application', 'yellow');
    
  } catch (error) {
    log(`❌ Error starting application: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the application
main();
