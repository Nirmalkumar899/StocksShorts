// Test script to debug translation API
const testUrl = process.env.REPLIT_DEV_DOMAIN ? 
  `https://${process.env.REPLIT_DEV_DOMAIN}/api/translate-articles` : 
  'http://localhost:5000/api/translate-articles';

const testData = {
  articles: [
    {
      id: 72,
      title: "Test Article",
      content: "This is a test article for translation."
    }
  ]
};

console.log('Testing translation API at:', testUrl);

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  return response.text();
})
.then(text => {
  console.log('Response body:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed JSON:', json);
  } catch (e) {
    console.log('Failed to parse as JSON');
  }
})
.catch(error => {
  console.error('Fetch error:', error);
});