// Proof of Work Route - Server-Side Validation & Anti-Tamper Verification
// Phase 2: Server-Side Validation & Persistence

const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const advancedLocationVerification = require('../services/advancedLocationVerification');

const router = express.Router();

// IMPORTANT: This SECRET_SALT must match the client-side salt
// Store this in environment variables in production
const SECRET_SALT = process.env.PROOF_SECRET_SALT || 'ProofSalt2025_SecureHash_TimeGeo_AntiTamper_ChangeInProduction!';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/proof-of-work');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG) are allowed'));
    }
  }
});

/**
 * Calculate SHA-256 hash of file
 * IMPORTANT: Client hashes the Base64 string of the file contents.
 * To ensure both sides match, we hash the Base64 string on the server too.
 */
async function calculateFileHash(filePath) {
  // Read file as base64 string to mirror client-side hashing
  const base64 = await fs.readFile(filePath, { encoding: 'base64' });
  const hash = crypto.createHash('sha256').update(base64, 'utf8').digest('hex');
  return hash;
}

/**
 * Generate server-side integrity hash
 * Must match client-side formula: SHA-256(Lat:Lon:Timestamp:SecretSalt:FileHash)
 */
function generateServerHash(latitude, longitude, timestamp, fileHash) {
  const dataString = `${latitude}:${longitude}:${timestamp}:${SECRET_SALT}:${fileHash}`;
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * POST /api/proof-of-work/upload
 * Upload proof of work with location and time verification
 * 
 * Phase 2: Steps 4, 5, 6
 */
router.post('/upload', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    // Step 4.1: Receive Data
    const {
      latitude,
      longitude,
      timestamp,
      accuracy,
      isMocked,
      clientHash,
      // Advanced location data
      networkLatitude,
      networkLongitude,
      networkAccuracy,
      altitude,
      heading,
      speed,
      trustScore,
    } = req.body;

    const userId = req.user.id; // From authenticate middleware
    const userRole = req.user.role; // Get user's role (manager/employee)
    const uploadedFile = req.file;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    console.log(`\n========== PROOF UPLOAD ==========`);
    console.log(`🌐 Client IP: ${clientIp}`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`👤 User Role from JWT: ${userRole}`);
    console.log(`👤 User Email: ${req.user.email}`);
    console.log(`==================================\n`);

    // Validation
    if (!uploadedFile) {
      return res.status(400).json({ error: 'Photo file is required' });
    }

    if (!latitude || !longitude || !timestamp || !clientHash) {
      // Clean up uploaded file
      await fs.unlink(uploadedFile.path);
      return res.status(400).json({ error: 'Missing required fields: latitude, longitude, timestamp, clientHash' });
    }

    // Step 4.2: Re-Check Mock Status
    // Final safety measure - reject if location was mocked
    if (isMocked === 'true' || isMocked === true) {
      await fs.unlink(uploadedFile.path);
      console.log('⚠ Mock location detected - proof rejected for user:', userId);
      return res.status(403).json({ 
        error: 'Mock location detected',
        message: 'Cannot accept proof with mock/fake GPS enabled' 
      });
    }

    // Step 4.3: ADVANCED LOCATION VERIFICATION
    console.log('🔍 Running advanced location verification...');
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: parseInt(timestamp),
      accuracy: parseFloat(accuracy),
      networkLocation: networkLatitude && networkLongitude ? {
        latitude: parseFloat(networkLatitude),
        longitude: parseFloat(networkLongitude),
        accuracy: parseFloat(networkAccuracy || 0),
      } : null,
      sensors: {
        altitude: altitude ? parseFloat(altitude) : null,
        heading: heading ? parseFloat(heading) : null,
        speed: speed ? parseFloat(speed) : null,
      },
      clientTrustScore: trustScore ? parseInt(trustScore) : 100,
    };

    const verificationResult = await advancedLocationVerification.verifyLocation(
      userId,
      locationData,
      clientIp
    );

    console.log('✅ Verification completed. Trust score:', verificationResult.trustScore);

    if (!verificationResult.passed) {
      await fs.unlink(uploadedFile.path);
      console.log('❌ Location verification failed:', verificationResult.warnings);
      return res.status(403).json({ 
        error: 'Location verification failed',
        message: verificationResult.warnings.join(' '),
        trustScore: verificationResult.trustScore,
        checks: verificationResult.checks,
      });
    }

    if (verificationResult.warnings.length > 0) {
      console.log('⚠️ Verification warnings:', verificationResult.warnings);
    }

    // Step 5: Anti-Tamper Verification (The Cryptographic Lock)
    
    // Step 5.1: Recalculate File Hash
    const serverFileHash = await calculateFileHash(uploadedFile.path);
    console.log('📁 Uploaded file path:', uploadedFile.path);
    console.log('📁 File size:', uploadedFile.size);
    console.log('🔐 Server file hash:', serverFileHash);

    // Step 5.2: Recalculate Server Hash
    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);
    const parsedTimestamp = parseInt(timestamp);
    
    console.log('📍 Location data:', {
      latitude: parsedLat,
      longitude: parsedLon,
      timestamp: parsedTimestamp,
    });
    
    const dataString = `${parsedLat}:${parsedLon}:${parsedTimestamp}:${SECRET_SALT}:${serverFileHash}`;
    console.log('🔗 Server data string (first 100):', dataString.substring(0, 100) + '...');
    
    const serverHash = generateServerHash(parsedLat, parsedLon, parsedTimestamp, serverFileHash);
    
    console.log('✅ Server integrity hash:', serverHash);
    console.log('📱 Client integrity hash:', clientHash);
    console.log('🔍 Hashes match?', serverHash.toLowerCase() === clientHash.toLowerCase());

    // Step 5.3: Comparison
    if (serverHash.toLowerCase() !== clientHash.toLowerCase()) {
      // Integrity check failed - data was tampered with
      await fs.unlink(uploadedFile.path);
      console.error('❌ INTEGRITY VERIFICATION FAILED');
      console.error('   Server hash:', serverHash);
      console.error('   Client hash:', clientHash);
      console.error('   User:', userId);
      return res.status(403).json({ 
        error: 'Integrity verification failed',
        message: 'The proof data has been tampered with. File, location, or timestamp was altered.' 
      });
    }

    console.log('✓ Integrity verified - proof is authentic');

    // Step 6: Secure Persistence
    
    // In production, upload to S3/Cloud Storage and use that URL
    // For now, we'll use a relative path
    const photoUrl = `/uploads/proof-of-work/${uploadedFile.filename}`;

    // Convert timestamp to PostgreSQL TIMESTAMPTZ format
    const verifiedTimestamp = new Date(parseInt(timestamp));

    // Step 6: Database Insert
    const result = await pool.query(
      `INSERT INTO proof_of_work 
       (user_id, user_role, photo_url, verified_timestamp, latitude, longitude, accuracy, integrity_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, user_role, photo_url, verified_timestamp, latitude, longitude, accuracy, integrity_hash, created_at`,
      [
        userId,
        userRole, // Store the user's role
        photoUrl,
        verifiedTimestamp,
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(accuracy) || 0,
        serverHash, // Store the verified hash
      ]
    );

    const proof = result.rows[0];

    console.log('✓ Proof of work stored:', proof.id);

    res.status(201).json({
      success: true,
      message: 'Proof of work verified and stored successfully',
      proof: {
        id: proof.id,
        photoUrl: proof.photo_url,
        verifiedTimestamp: proof.verified_timestamp,
        latitude: proof.latitude,
        longitude: proof.longitude,
        accuracy: proof.accuracy,
        integrityHash: proof.integrity_hash,
      }
    });

  } catch (error) {
    console.error('Error processing proof of work:', error);

    // Clean up file if it was uploaded
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    // Handle duplicate integrity_hash (UNIQUE constraint violation)
    if (error.code === '23505' && error.constraint === 'proof_of_work_integrity_hash_key') {
      return res.status(409).json({ 
        error: 'Duplicate proof',
        message: 'This proof has already been submitted' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process proof of work',
      message: error.message 
    });
  }
});

/**
 * GET /api/proof-of-work/history
 * Get user's proof history (filtered by user_id and role)
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 50, offset = 0 } = req.query;

    // Real organization users see empty proof history (no dummy data)
    if (req.user && req.user.source === 'registry') {
      return res.json({
        success: true,
        proofs: [],
        count: 0,
        role: userRole,
      });
    }

    console.log(`\n========== FETCHING PROOF HISTORY ==========`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`👤 User Role: ${userRole}`);
    console.log(`👤 User Email: ${req.user.email}`);
    console.log(`📊 Query: WHERE user_id='${userId}' AND user_role='${userRole}'`);

    const result = await pool.query(
      `SELECT id, photo_url, verified_timestamp, latitude, longitude, accuracy, created_at, user_role
       FROM proof_of_work
       WHERE user_id = $1 AND user_role = $2
       ORDER BY verified_timestamp DESC
       LIMIT $3 OFFSET $4`,
      [userId, userRole, parseInt(limit), parseInt(offset)]
    );

    console.log(`✅ Found ${result.rows.length} proof records for ${userRole}`);
    console.log(`📋 Records:`, result.rows.map(r => ({ 
      id: r.id, 
      role: r.user_role, 
      timestamp: r.verified_timestamp 
    })));
    console.log(`==========================================\n`);

    res.json({
      success: true,
      proofs: result.rows,
      count: result.rows.length,
      role: userRole,
    });

  } catch (error) {
    console.error('Error fetching proof history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch proof history',
      message: error.message 
    });
  }
});

/**
 * GET /api/proof-of-work/:id
 * Get specific proof details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, user_id, photo_url, verified_timestamp, latitude, longitude, accuracy, integrity_hash, created_at
       FROM proof_of_work
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    res.json({
      success: true,
      proof: result.rows[0],
    });

  } catch (error) {
    console.error('Error fetching proof:', error);
    res.status(500).json({ 
      error: 'Failed to fetch proof',
      message: error.message 
    });
  }
});

module.exports = router;
