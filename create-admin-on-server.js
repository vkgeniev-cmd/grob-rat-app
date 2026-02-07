const https = require('https');

const data = JSON.stringify({
  username: 'admin',
  password: 'kmrat123'
});

const options = {
  hostname: 'glistening-mindfulness.up.railway.app',
  path: '/api/auth/create-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
