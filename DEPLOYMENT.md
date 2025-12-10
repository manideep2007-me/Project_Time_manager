# Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the Project Time Manager application to production environments.

## 📋 Prerequisites

### Server Requirements
- **Operating System**: Ubuntu 20.04+ or CentOS 8+
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 50GB+ SSD storage
- **CPU**: 2+ cores (4+ cores recommended)
- **Network**: Stable internet connection

### Software Requirements
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ (v15+ recommended)
- **Nginx**: v1.18+ (reverse proxy)
- **PM2**: Process manager for Node.js
- **SSL Certificate**: Let's Encrypt or commercial certificate

## 🗄️ Database Setup

### PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### Database Configuration
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE project_time_manager;
CREATE USER pm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE project_time_manager TO pm_user;

# Exit psql
\q
```

### Database Schema Setup
```bash
# Run schema script
psql -U pm_user -d project_time_manager -f server/database/schema.sql

# Verify tables
psql -U pm_user -d project_time_manager -c "\dt"
```

## 🔧 Backend Deployment

### 1. Server Setup
```bash
# Create application directory
sudo mkdir -p /opt/project-time-manager
sudo chown $USER:$USER /opt/project-time-manager
cd /opt/project-time-manager

# Clone repository
git clone <repository-url> .

# Install dependencies
cd server
npm install --production
```

### 2. Environment Configuration
```bash
# Create production environment file
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_time_manager
DB_USER=pm_user
DB_PASSWORD=secure_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

# Admin Default Credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password
EOF
```

### 3. PM2 Configuration
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'project-time-manager',
    script: 'index.js',
    cwd: '/opt/project-time-manager/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/project-time-manager-error.log',
    out_file: '/var/log/pm2/project-time-manager-out.log',
    log_file: '/var/log/pm2/project-time-manager.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 Nginx Configuration

### 1. Install Nginx
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Nginx Configuration
```bash
# Create site configuration
sudo cat > /etc/nginx/sites-available/project-time-manager << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API Proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health Check
    location /health {
        proxy_pass http://localhost:5000/api/health;
        access_log off;
    }
    
    # Static Files (if serving frontend)
    location / {
        root /opt/project-time-manager/client/build;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/project-time-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📱 Mobile App Deployment

### 1. Build Configuration
```bash
cd client

# Install dependencies
npm install

# Configure for production
cat > app.config.js << EOF
export default {
  expo: {
    name: "Project Time Manager",
    slug: "project-time-manager",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.projecttimemanager"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourcompany.projecttimemanager"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: "https://yourdomain.com/api"
    }
  }
};
EOF
```

### 2. Build for Production
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### 3. App Store Deployment

#### Google Play Store
1. **Create Developer Account**: Register at Google Play Console
2. **Upload APK**: Upload the generated APK file
3. **Store Listing**: Complete app description and screenshots
4. **Content Rating**: Complete content rating questionnaire
5. **Pricing**: Set app pricing (free/paid)
6. **Release**: Submit for review

#### Apple App Store
1. **Create Developer Account**: Register at Apple Developer
2. **App Store Connect**: Create new app in App Store Connect
3. **Upload Build**: Upload the generated IPA file
4. **App Information**: Complete app metadata
5. **Screenshots**: Upload app screenshots
6. **Review Information**: Provide review notes
7. **Submit for Review**: Submit to Apple for review

## 🔍 Monitoring & Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. Database Monitoring
```bash
# Install PostgreSQL monitoring
sudo apt install postgresql-contrib

# Enable query logging
sudo nano /etc/postgresql/14/main/postgresql.conf
# Add: log_statement = 'all'
# Add: log_min_duration_statement = 1000

sudo systemctl restart postgresql
```

### 3. System Monitoring
```bash
# Install system monitoring
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5000/tcp  # Block direct access to Node.js
```

### 2. Database Security
```bash
# Secure PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: listen_addresses = 'localhost'
# Set: ssl = on

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Set: local all all peer
# Set: host all all 127.0.0.1/32 md5
```

### 3. Application Security
```bash
# Set proper file permissions
sudo chown -R www-data:www-data /opt/project-time-manager
sudo chmod -R 755 /opt/project-time-manager
sudo chmod 600 /opt/project-time-manager/server/.env
```

## 📊 Backup Strategy

### 1. Database Backup
```bash
# Create backup script
cat > /opt/backup-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U pm_user -h localhost project_time_manager > \$BACKUP_DIR/db_backup_\$DATE.sql
find \$BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# Schedule daily backups
echo "0 2 * * * /opt/backup-db.sh" | sudo crontab -
```

### 2. Application Backup
```bash
# Create application backup script
cat > /opt/backup-app.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf \$BACKUP_DIR/app_backup_\$DATE.tar.gz /opt/project-time-manager
find \$BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-app.sh

# Schedule weekly backups
echo "0 3 * * 0 /opt/backup-app.sh" | sudo crontab -
```

## 🚨 Disaster Recovery

### 1. Recovery Procedures
```bash
# Database recovery
psql -U pm_user -d project_time_manager < /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql

# Application recovery
tar -xzf /opt/backups/app_backup_YYYYMMDD_HHMMSS.tar.gz -C /
pm2 restart project-time-manager
```

### 2. Health Checks
```bash
# Create health check script
cat > /opt/health-check.sh << EOF
#!/bin/bash
# Check API health
curl -f http://localhost:5000/api/health || exit 1

# Check database connection
psql -U pm_user -d project_time_manager -c "SELECT 1;" || exit 1

# Check PM2 process
pm2 status project-time-manager | grep -q "online" || exit 1
EOF

chmod +x /opt/health-check.sh

# Schedule health checks
echo "*/5 * * * * /opt/health-check.sh" | sudo crontab -
```

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Analyze database performance
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Optimize indexes
REINDEX DATABASE project_time_manager;
```

### 2. Application Optimization
```bash
# Monitor PM2 performance
pm2 monit

# Check memory usage
pm2 show project-time-manager

# Restart if memory usage is high
pm2 restart project-time-manager --max-memory-restart 1G
```

## 🔄 Updates & Maintenance

### 1. Application Updates
```bash
# Update application
cd /opt/project-time-manager
git pull origin main
cd server
npm install --production
pm2 restart project-time-manager
```

### 2. System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection**: Check PostgreSQL service and credentials
2. **Port Conflicts**: Ensure ports 80, 443, and 5000 are available
3. **SSL Issues**: Verify certificate installation and renewal
4. **Memory Issues**: Monitor PM2 memory usage and restart if needed

### Log Locations
- **Application Logs**: `/var/log/pm2/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **System Logs**: `/var/log/syslog`

### Contact Information
- **Technical Support**: support@yourdomain.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.yourdomain.com

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Review Cycle**: Monthly






