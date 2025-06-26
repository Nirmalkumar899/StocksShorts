const https = require('https');
const http = require('http');

function checkDomain(domain) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'StocksShorts-Domain-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✓ Domain ${domain} is accessible`);
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Headers:`, res.headers);
      resolve({
        status: res.statusCode,
        headers: res.headers,
        accessible: true
      });
    });

    req.on('error', (err) => {
      console.log(`✗ Domain ${domain} connection failed:`);
      console.log(`Error: ${err.message}`);
      resolve({
        error: err.message,
        accessible: false
      });
    });

    req.on('timeout', () => {
      console.log(`✗ Domain ${domain} timed out`);
      req.destroy();
      resolve({
        error: 'Connection timeout',
        accessible: false
      });
    });

    req.end();
  });
}

// Check both domains
async function checkBothDomains() {
  console.log('Checking domain connectivity...\n');
  
  console.log('1. Checking stocksshorts.com:');
  const customDomain = await checkDomain('stocksshorts.com');
  
  console.log('\n2. Checking Replit dev domain:');
  const replitDomain = await checkDomain('92852d50-ce53-4e40-b907-321e7c7bbf80-00-oondm46lxea1.riker.replit.dev');
  
  console.log('\n=== DOMAIN STATUS SUMMARY ===');
  console.log(`Custom Domain (stocksshorts.com): ${customDomain.accessible ? 'WORKING' : 'FAILED'}`);
  console.log(`Replit Domain: ${replitDomain.accessible ? 'WORKING' : 'FAILED'}`);
  
  if (!customDomain.accessible && customDomain.error) {
    console.log(`\nCustom domain issue: ${customDomain.error}`);
  }
}

checkBothDomains();