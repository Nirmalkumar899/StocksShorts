const fs = require('fs');
const path = require('path');

// Load credentials from the JSON file
const credentialsPath = path.join(__dirname, '../../attached_assets/spartan-perigee-463004-u2-e5ae8eae0c60_1751806115305.json');

function getGoogleCredentials() {
  try {
    const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
    return JSON.parse(credentialsData);
  } catch (error) {
    console.error('Error loading Google credentials:', error);
    return null;
  }
}

module.exports = { getGoogleCredentials };