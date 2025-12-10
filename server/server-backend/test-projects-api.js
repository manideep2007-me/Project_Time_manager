#!/usr/bin/env node

const http = require('http');

// Test projects API endpoint
function testProjectsAPI() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/projects?page=1&limit=100',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode === 200,
            response: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            error: error.message,
            response: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message
      });
    });
    
    req.end();
  });
}

// Main function
async function main() {
  try {
    console.log('🧪 Testing Projects API Endpoint');
    console.log('================================');
    
    const result = await testProjectsAPI();
    
    if (result.success) {
      console.log('✅ Projects API working!');
      console.log(`📊 Projects returned: ${result.response.projects?.length || 0}`);
      
      if (result.response.projects && result.response.projects.length > 0) {
        console.log('\n📋 First 5 projects:');
        result.response.projects.slice(0, 5).forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.name} (${project.status}) - ${project.client_name}`);
        });
      }
    } else {
      console.log('❌ Projects API failed');
      console.log(`📊 Status: ${result.status}`);
      console.log(`📊 Error: ${result.error || result.response}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
main();
