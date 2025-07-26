// generate-apple-jwt.js
// Run: node generate-apple-jwt.js

const fs = require('fs');
const jwt = require('jsonwebtoken');

// Your Apple credentials
const TEAM_ID = '5FU4TL42JS'; // 10 characters
const KEY_ID = '7SQMZY3862';   // 10 characters
const CLIENT_ID = 'com.poweredbydonation.web'; // Your Services ID
const PRIVATE_KEY_PATH = 'C:\\Users\\aaltundal\\Downloads\\AuthKey_7SQMZY3862.p8'; // Path to your .p8 file

try {
  // Read the private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  
  // Create JWT payload
  const payload = {
    iss: TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (6 * 30 * 24 * 60 * 60), // 6 months
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID
  };
  
  // Sign the JWT
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'ES256',
    header: {
      kid: KEY_ID
    }
  });
  
  console.log('Generated JWT for Supabase:');
  console.log(token);
  
} catch (error) {
  console.error('Error generating JWT:', error.message);
}

// To install dependencies:
// npm install jsonwebtoken