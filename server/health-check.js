#!/usr/bin/env node

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

// Check backend health
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
            statusCode: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            status: 'error',
            statusCode: res.statusCode,
            error: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 'error',
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 'timeout',
        error: 'Request timeout'
      });
    });
  });
}

// Main function
async function main() {
  log('🔍 Project Time Manager - Health Check', 'bold');
  log('=====================================', 'bold');
  
  const health = await checkBackendHealth();
  
  if (health.status === 'healthy') {
    log('✅ Backend is healthy!', 'green');
    log(`📊 Status: ${health.response.status}`, 'blue');
    log(`🕒 Timestamp: ${health.response.timestamp}`, 'blue');
    log(`📦 Version: ${health.response.version}`, 'blue');
  } else if (health.status === 'unhealthy') {
    log('⚠️  Backend is unhealthy', 'yellow');
    log(`📊 Status Code: ${health.statusCode}`, 'blue');
    log(`📄 Response: ${JSON.stringify(health.response, null, 2)}`, 'blue');
  } else {
    log('❌ Backend is not responding', 'red');
    log(`📊 Error: ${health.error}`, 'red');
    log('\n💡 Troubleshooting tips:', 'yellow');
    log('1. Make sure the backend is running: npm run start:backend', 'blue');
    log('2. Check if port 5000 is available', 'blue');
    log('3. Verify database connection', 'blue');
    log('4. Check backend logs for errors', 'blue');
  }
  
  log('\n🔗 Useful URLs:', 'bold');
  log('• Backend API: http://localhost:5000', 'blue');
  log('• API Documentation: http://localhost:5000/api-docs', 'blue');
  log('• Health Check: http://localhost:5000/api/health', 'blue');
}

// Run health check
main().catch(error => {
  log(`❌ Health check failed: ${error.message}`, 'red');
  process.exit(1);
});
