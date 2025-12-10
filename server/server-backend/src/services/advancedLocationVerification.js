/**
 * Advanced Location Verification Service (Backend)
 * 
 * Implements:
 * 1. IP Geolocation cross-verification
 * 2. Velocity/Speed checks (impossible movements)
 * 3. Historical location pattern analysis
 * 4. Multi-source location verification
 */

const axios = require('axios');
const pool = require('../config/database');

class AdvancedLocationVerificationService {
  
  /**
   * Verify location using multiple methods
   */
  async verifyLocation(userId, locationData, clientIp) {
    const verificationResults = {
      passed: true,
      trustScore: 100,
      checks: {
        ipGeolocation: { passed: true, message: '' },
        velocityCheck: { passed: true, message: '' },
        networkGpsMatch: { passed: true, message: '' },
        sensors: { passed: true, message: '' },
      },
      warnings: [],
    };

    // 1. IP Geolocation Check
    const ipCheck = await this.verifyIpGeolocation(
      locationData.latitude,
      locationData.longitude,
      clientIp
    );
    verificationResults.checks.ipGeolocation = ipCheck;
    if (!ipCheck.passed) {
      verificationResults.trustScore -= 30;
      verificationResults.warnings.push(ipCheck.message);
    }

    // 2. Velocity/Speed Check (check against last location)
    const velocityCheck = await this.checkVelocity(
      userId,
      locationData.latitude,
      locationData.longitude,
      locationData.timestamp
    );
    verificationResults.checks.velocityCheck = velocityCheck;
    if (!velocityCheck.passed) {
      verificationResults.trustScore -= 40;
      verificationResults.warnings.push(velocityCheck.message);
      verificationResults.passed = false; // Critical failure
    }

    // 3. Network-GPS Match Check
    if (locationData.networkLocation) {
      const matchCheck = this.verifyNetworkGpsMatch(locationData);
      verificationResults.checks.networkGpsMatch = matchCheck;
      if (!matchCheck.passed) {
        verificationResults.trustScore -= 25;
        verificationResults.warnings.push(matchCheck.message);
      }
    }

    // 4. Sensor Consistency Check
    const sensorCheck = this.verifySensors(locationData.sensors);
    verificationResults.checks.sensors = sensorCheck;
    if (!sensorCheck.passed) {
      verificationResults.trustScore -= 15;
      verificationResults.warnings.push(sensorCheck.message);
    }

    // Final decision
    if (verificationResults.trustScore < 50) {
      verificationResults.passed = false;
    }

    console.log('🔍 Location Verification Results:', verificationResults);
    return verificationResults;
  }

  /**
   * 1. IP Geolocation Verification
   * Cross-check GPS coordinates against IP address location
   */
  async verifyIpGeolocation(latitude, longitude, clientIp) {
    try {
      // Skip for localhost/private IPs
      if (!clientIp || clientIp === '::1' || clientIp.startsWith('192.168') || clientIp.startsWith('10.')) {
        return {
          passed: true,
          message: 'Local IP - skipping check',
        };
      }

      console.log(`🌍 Checking IP geolocation for ${clientIp}...`);

      // Use free IP geolocation API (ip-api.com - 45 requests/minute free)
      const response = await axios.get(`http://ip-api.com/json/${clientIp}`, {
        timeout: 5000,
      });

      if (response.data.status === 'success') {
        const ipLat = response.data.lat;
        const ipLon = response.data.lon;
        const ipCity = response.data.city;
        const ipCountry = response.data.country;

        console.log(`📍 IP Location: ${ipCity}, ${ipCountry} (${ipLat}, ${ipLon})`);
        console.log(`📍 GPS Location: (${latitude}, ${longitude})`);

        // Calculate distance between IP location and GPS location
        const distance = this.calculateDistance(latitude, longitude, ipLat, ipLon);
        console.log(`📏 Distance between IP and GPS: ${distance.toFixed(2)} km`);

        // If distance > 500km, it's highly suspicious (could be VPN)
        if (distance > 500) {
          return {
            passed: false,
            message: `GPS location is ${distance.toFixed(0)}km from IP location (${ipCity}, ${ipCountry}). Possible VPN or location spoofing.`,
          };
        }

        // If distance > 100km, give a warning but don't fail
        if (distance > 100) {
          return {
            passed: true,
            message: `GPS is ${distance.toFixed(0)}km from IP location. Could be mobile network routing.`,
          };
        }

        return {
          passed: true,
          message: `IP location matches GPS (${distance.toFixed(0)}km away)`,
        };
      }

      // IP geolocation failed, but don't fail the entire check
      return {
        passed: true,
        message: 'IP geolocation unavailable',
      };

    } catch (error) {
      console.error('Error in IP geolocation check:', error.message);
      return {
        passed: true,
        message: 'IP geolocation check failed (service unavailable)',
      };
    }
  }

  /**
   * 2. Velocity/Speed Check
   * Check if user could physically travel from last location to current location
   */
  async checkVelocity(userId, currentLat, currentLon, currentTimestamp) {
    try {
      // Get user's last location from database
      const result = await pool.query(
        `SELECT latitude, longitude, verified_timestamp
         FROM proof_of_work
         WHERE user_id = $1
         ORDER BY verified_timestamp DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // First location for this user
        return {
          passed: true,
          message: 'First location recorded',
        };
      }

      const lastLocation = result.rows[0];
      const lastLat = parseFloat(lastLocation.latitude);
      const lastLon = parseFloat(lastLocation.longitude);
      const lastTimestamp = parseInt(lastLocation.verified_timestamp);

      // Calculate distance and time
      const distance = this.calculateDistance(lastLat, lastLon, currentLat, currentLon);
      const timeDiff = (currentTimestamp - lastTimestamp) / 1000; // Convert to seconds
      const timeDiffHours = timeDiff / 3600;

      console.log(`⏱️ Time since last location: ${timeDiffHours.toFixed(2)} hours`);
      console.log(`📏 Distance from last location: ${distance.toFixed(2)} km`);

      // If time difference is less than 1 second, skip check (duplicate/retry)
      if (timeDiff < 1) {
        return {
          passed: true,
          message: 'Immediate retry - skipping velocity check',
        };
      }

      // Calculate speed in km/h
      const speed = distance / timeDiffHours;
      console.log(`🏃 Calculated speed: ${speed.toFixed(2)} km/h`);

      // Maximum realistic speeds:
      // - Walking: 5 km/h
      // - Car: 120 km/h
      // - High-speed train: 300 km/h
      // - Airplane: 900 km/h
      const MAX_REALISTIC_SPEED = 1000; // km/h (accounting for flights)

      if (speed > MAX_REALISTIC_SPEED) {
        return {
          passed: false,
          message: `Impossible travel speed: ${speed.toFixed(0)} km/h. ` +
                   `Distance: ${distance.toFixed(0)}km in ${timeDiffHours.toFixed(1)} hours. ` +
                   `This is physically impossible without teleportation.`,
        };
      }

      // Warning for very fast speeds (but still possible with flights)
      if (speed > 500) {
        return {
          passed: true,
          message: `Very fast travel detected: ${speed.toFixed(0)} km/h (possible with air travel)`,
        };
      }

      return {
        passed: true,
        message: `Realistic travel speed: ${speed.toFixed(0)} km/h`,
      };

    } catch (error) {
      console.error('Error in velocity check:', error.message);
      return {
        passed: true,
        message: 'Velocity check failed (error)',
      };
    }
  }

  /**
   * 3. Network-GPS Match Verification
   */
  verifyNetworkGpsMatch(locationData) {
    if (!locationData.networkLocation) {
      return {
        passed: true,
        message: 'Network location unavailable',
      };
    }

    const distance = this.calculateDistance(
      locationData.latitude,
      locationData.longitude,
      locationData.networkLocation.latitude,
      locationData.networkLocation.longitude
    );

    console.log(`📡 GPS vs Network distance: ${distance.toFixed(2)} km`);

    if (distance > 10) {
      return {
        passed: false,
        message: `GPS and Network locations differ by ${distance.toFixed(1)}km. Possible GPS spoofing.`,
      };
    }

    if (distance > 5) {
      return {
        passed: true,
        message: `Moderate GPS/Network mismatch: ${distance.toFixed(1)}km`,
      };
    }

    return {
      passed: true,
      message: `GPS and Network locations match (${distance.toFixed(1)}km)`,
    };
  }

  /**
   * 4. Sensor Consistency Verification
   */
  verifySensors(sensors) {
    if (!sensors) {
      return {
        passed: true,
        message: 'Sensor data unavailable',
      };
    }

    const issues = [];

    // Check altitude
    if (sensors.altitude !== null) {
      if (sensors.altitude < -500 || sensors.altitude > 8900) {
        issues.push(`Invalid altitude: ${sensors.altitude}m`);
      }
    }

    // Check speed
    if (sensors.speed !== null && sensors.speed < 0) {
      issues.push(`Invalid speed: ${sensors.speed}`);
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: `Sensor inconsistencies: ${issues.join(', ')}`,
      };
    }

    return {
      passed: true,
      message: 'Sensors consistent',
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new AdvancedLocationVerificationService();
