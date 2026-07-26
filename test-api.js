async function testAPI() {
  console.log('Testing POST /v1/repositories...');
  try {
    const res = await fetch('http://localhost:4000/v1/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remoteUrl: 'https://github.com/facebook/react' })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAPI();
