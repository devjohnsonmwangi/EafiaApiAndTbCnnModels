const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the JWT_SECRET from .env, or the placeholder if not available
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars';

console.log('\n🔐 JWT Token Generator\n');
console.log(`Using JWT_SECRET (first 20 chars): ${JWT_SECRET.substring(0, 20)}...`);
console.log('Token expiration: 24h (access), 7h (refresh)\n');

// Admin user payload
const adminPayload = {
  sub: '4d0415d9-ab2e-4550-ae71-f1d3e0fa1523',
  email: 'admin@tbdetection.com',
  role: 'admin'
};

// Physician user payload
const physicianPayload = {
  sub: '250185cd-debf-4b82-8ec0-c79ff6e45ac6',
  email: 'physician@tbdetection.com',
  role: 'physician'
};

// Generate Admin tokens
const adminAccessToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });
const adminRefreshToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '7d' });

// Generate Physician tokens
const physicianAccessToken = jwt.sign(physicianPayload, JWT_SECRET, { expiresIn: '24h' });
const physicianRefreshToken = jwt.sign(physicianPayload, JWT_SECRET, { expiresIn: '7d' });

console.log('================================');
console.log('✅ ADMIN TOKENS (admin@tbdetection.com)');
console.log('================================\n');

console.log('📋 ACCESS TOKEN (24h):\n');
console.log(adminAccessToken);
console.log('\n📋 REFRESH TOKEN (7d):\n');
console.log(adminRefreshToken);

console.log('\n================================');
console.log('✅ PHYSICIAN TOKENS (physician@tbdetection.com)');
console.log('================================\n');

console.log('📋 ACCESS TOKEN (24h):\n');
console.log(physicianAccessToken);
console.log('\n📋 REFRESH TOKEN (7d):\n');
console.log(physicianRefreshToken);

console.log('\n================================');
console.log('📝 INSTRUCTIONS');
console.log('================================\n');

console.log('1. Copy the Admin Access Token above');
console.log('2. Go to api.http file');
console.log('3. Replace @adminToken value with the token above');
console.log('4. Replace @adminRefreshToken with the refresh token');
console.log('5. Do the same for PHYSICIAN tokens');
console.log('6. Save api.http');
console.log('7. Run REST requests\n');
