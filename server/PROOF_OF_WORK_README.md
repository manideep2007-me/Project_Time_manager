# Time & Geotagging with Anti-Tamper/Anti-Fake GPS

## Overview

This feature provides cryptographically verified proof-of-work with:
- **Anti-Fake GPS Detection**: Detects and rejects mock/spoofed locations
- **Time & Geotagging**: Accurate timestamp and location from GPS fix
- **Anti-Tamper Protection**: Cryptographic integrity hash prevents data manipulation
- **Server-Side Verification**: Backend re-verifies all proof data

## Architecture

### Three-Pillar Security Approach

1. **Client-Side Verification** (React Native)
   - Detect mock locations on Android
   - Capture high-quality GPS data
   - Generate cryptographic integrity hash

2. **Cryptographic Hashing** (Anti-Tamper)
   - SHA-256 hash links: Location + Time + File + Secret
   - Tamper-proof cryptographic proof
   - Unique hash prevents duplicates

3. **Server-Side Validation** (Node.js)
   - Re-verify mock location status
   - Recalculate and compare hashes
   - Secure database persistence

## Installation

### Backend Setup

1. **Create Database Table**
```bash
cd server-backend
node scripts/create-proof-of-work-table.js
```

2. **Set Environment Variables**
Add to `.env`:
```env
PROOF_SECRET_SALT=your_super_secret_salt_change_in_production
```

3. **Restart Backend**
```bash
npm start
```

### Frontend Setup

1. **Install Dependencies** (Already done)
```bash
cd frontend/mobile
npx expo install react-native-geolocation-service expo-crypto expo-file-system
```

2. **Update Secret Salt**
Edit `frontend/mobile/src/services/integrityHashService.ts`:
```typescript
const SECRET_SALT = 'your_super_secret_salt_change_in_production';
```
⚠️ **IMPORTANT**: Must match backend's `PROOF_SECRET_SALT`

3. **Configure Permissions**

**iOS** - Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to verify proof of work</string>
<key>NSCameraUsageDescription</key>
<string>We need camera access to capture proof photos</string>
```

**Android** - Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Usage

### Example Screen

See `ProofOfWorkCaptureScreen.tsx` for complete implementation.

### Basic Flow

```typescript
import secureGeolocation from '../../services/secureGeolocationService';
import integrityHash from '../../services/integrityHashService';

// 1. Capture photo (using expo-image-picker or camera)
const photoUri = '...';

// 2. Get verified location (with mock detection)
const locationResult = await secureGeolocation.getCurrentLocation();
if (!locationResult.success) {
  // Handle error - might be mock location
  return;
}

// 3. Generate integrity hash
const payload = await integrityHash.createProofPayload(
  locationResult.data,
  photoUri
);

// 4. Upload to backend
const formData = new FormData();
formData.append('photo', {
  uri: photoUri,
  type: 'image/jpeg',
  name: 'proof.jpg',
});
formData.append('latitude', payload.latitude.toString());
formData.append('longitude', payload.longitude.toString());
formData.append('timestamp', payload.timestamp.toString());
formData.append('accuracy', payload.accuracy.toString());
formData.append('isMocked', payload.isMocked.toString());
formData.append('clientHash', payload.clientHash);

const response = await api.post('/proof-of-work/upload', formData);
```

## API Endpoints

### POST /api/proof-of-work/upload
Upload proof with verification.

**Request (multipart/form-data):**
- `photo` (file): Image file
- `latitude` (string): Latitude coordinate
- `longitude` (string): Longitude coordinate
- `timestamp` (string): Unix timestamp from GPS
- `accuracy` (string): Location accuracy in meters
- `isMocked` (string): "true" or "false"
- `clientHash` (string): SHA-256 integrity hash

**Response (201):**
```json
{
  "success": true,
  "message": "Proof of work verified and stored successfully",
  "proof": {
    "id": 123,
    "photoUrl": "/uploads/proof-of-work/proof-xxx.jpg",
    "verifiedTimestamp": "2025-11-06T09:30:00Z",
    "latitude": 17.385044,
    "longitude": 78.486671,
    "accuracy": 5.0,
    "integrityHash": "abc123..."
  }
}
```

**Error Responses:**
- `400`: Missing required fields
- `403`: Mock location detected OR integrity verification failed
- `409`: Duplicate proof (same hash already exists)

### GET /api/proof-of-work/history
Get user's proof history.

**Query Parameters:**
- `limit` (default: 50): Number of records
- `offset` (default: 0): Pagination offset

### GET /api/proof-of-work/:id
Get specific proof details.

## Security Details

### Anti-Fake GPS Detection

**Android:**
- Checks `position.mocked` flag from GPS API
- Detects if Developer Options > Mock Location is enabled
- Immediately rejects any mocked locations

**iOS:**
- Basic detection via native API
- For advanced detection, consider:
  - Jailbreak detection
  - Simulator detection
  - Third-party security services

### Cryptographic Integrity Hash

**Formula:**
```
SHA-256(Latitude:Longitude:Timestamp:SecretSalt:FileHash)
```

**Example:**
```
Input: "17.385044:78.486671:1699267800000:secret_salt:abc123def456..."
Output: "7d8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e"
```

**Security Features:**
1. **File Binding**: FileHash links specific photo
2. **Location Binding**: Lat/Lon prevents coordinate tampering
3. **Time Binding**: Timestamp prevents time manipulation
4. **Secret Salt**: Prevents hash recreation without secret
5. **Immutable**: Any change breaks the hash

### Server-Side Verification Process

1. **Receive Upload**: File + metadata + clientHash
2. **Mock Check**: Reject if `isMocked === true`
3. **Recalculate File Hash**: SHA-256 of uploaded file
4. **Recalculate Server Hash**: Using same formula as client
5. **Compare Hashes**: clientHash === serverHash
   - **Match**: Data is authentic ✓
   - **Mismatch**: Data was tampered with ✗
6. **Store**: Save to PostgreSQL with UNIQUE constraint on hash

## Database Schema

```sql
CREATE TABLE proof_of_work (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  verified_timestamp TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC(8, 2) DEFAULT 0,
  integrity_hash CHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- `TIMESTAMPTZ`: Preserves timezone for accurate time
- `UNIQUE` on `integrity_hash`: Prevents duplicate proofs
- `NUMERIC(10,8)`: High-precision coordinates

## Testing

### Test Mock Location Detection

**Android:**
1. Enable Developer Options
2. Enable "Mock Location" or install fake GPS app
3. Try to capture proof
4. Should see error: "Mock location detected"

### Test Integrity Verification

1. Capture valid proof (uploads successfully)
2. Try to modify the photo after hash generation
3. Upload should fail with: "Integrity verification failed"

### Test Duplicate Prevention

1. Capture and upload proof
2. Try to upload same proof again
3. Should fail with: "Duplicate proof"

## Production Considerations

1. **Secret Salt**
   - Use strong random string (64+ characters)
   - Store in environment variables
   - MUST be same on client and server
   - Rotate periodically for security

2. **File Storage**
   - Current: Local filesystem
   - Production: Use AWS S3, Google Cloud Storage, etc.
   - Update `photo_url` to store cloud URLs

3. **iOS Mock Detection**
   - Consider advanced security libraries
   - Check for jailbreak/simulator
   - Use device attestation services

4. **Performance**
   - File hash calculation is CPU-intensive
   - Consider background processing for large files
   - Use image compression (quality: 0.8)

5. **Privacy**
   - Inform users about location tracking
   - Comply with GDPR/privacy regulations
   - Provide opt-out mechanisms

## Troubleshooting

### "Mock location detected" on real device
- Disable Developer Options
- Uninstall fake GPS apps
- Restart device

### "Integrity verification failed"
- Check SECRET_SALT matches on client and server
- Ensure file is not modified between hash and upload
- Check network didn't corrupt file during upload

### "Location permission denied"
- Check app permissions in device settings
- Verify Info.plist (iOS) or AndroidManifest.xml (Android)
- Request permissions at runtime

### Hash mismatch
- Verify hash formula is identical on client and server
- Check data types (string vs number concatenation)
- Ensure SECRET_SALT is exactly the same

## Files Created

### Backend
- `server-backend/database/proof-of-work-schema.sql` - Database schema
- `server-backend/src/routes/proofOfWork.js` - API routes
- `server-backend/scripts/create-proof-of-work-table.js` - Setup script

### Frontend
- `frontend/mobile/src/services/secureGeolocationService.ts` - Location service
- `frontend/mobile/src/services/integrityHashService.ts` - Hashing service
- `frontend/mobile/src/screens/proofOfWork/ProofOfWorkCaptureScreen.tsx` - Demo screen

## Next Steps

1. Run database setup script
2. Configure environment variables
3. Test the demo screen
4. Integrate into your app's workflow
5. Customize UI/UX as needed

## Support

For issues or questions, check:
- Server logs for detailed error messages
- Console logs in React Native for client-side errors
- Database logs for SQL errors
