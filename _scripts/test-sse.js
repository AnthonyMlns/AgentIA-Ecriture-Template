// Test SSE du endpoint OpenCode
const http = require('http');

const body = JSON.stringify({
  genre: 'textes-mobiles',
  titre: 'SSETest',
  synopsis: 'Test du flux SSE',
  registre: 'introspectif-retenu'
});

const req = http.request({
  hostname: 'localhost',
  port: 3737,
  path: '/api/opencode/run',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': 'Bearer test'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));

  let count = 0;
  let buffer = '';

  res.on('data', (chunk) => {
    buffer += chunk.toString();
    // Split by double newline
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // keep incomplete

    for (const part of parts) {
      if (part.trim().length === 0) continue;
      const lines = part.split('\n');
      let data = '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          data += line.slice(6);
        }
      }
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`Event #${++count}:`, parsed.type || '?', JSON.stringify(parsed).slice(0, 120));
          if (parsed.type === 'done' || parsed.type === 'error') {
            console.log('END OF SSE');
            process.exit(0);
          }
        } catch (e) {
          console.log('Parse error:', data.slice(0, 80));
        }
      }
    }
  });

  res.on('end', () => {
    console.log('Connection ended by server');
    process.exit(0);
  });

  res.on('error', (e) => {
    console.log('Error:', e.message);
    process.exit(1);
  });
});

req.on('error', (e) => {
  console.log('Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();

// Timeout après 10 secondes
setTimeout(() => {
  console.log('Timeout - 10s écoulées');
  process.exit(0);
}, 10000);
