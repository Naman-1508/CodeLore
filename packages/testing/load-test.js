// A simple simulated load-testing script to hit the CodeLore API at scale
// Execute with: node load-test.js

const http = require('http');

const API_BASE = 'http://localhost:4000/v1';
const CONCURRENT_REQUESTS = 100; // Simulated concurrent users
const DURATION_SEC = 10; 

console.log(`Starting load test against CodeLore API Gateway: ${API_BASE}`);
console.log(`Target: ${CONCURRENT_REQUESTS} concurrent users for ${DURATION_SEC} seconds.`);

let successCount = 0;
let errorCount = 0;
let startTime = Date.now();

function makeRequest() {
  return new Promise((resolve) => {
    http.get(`${API_BASE}/workspaces`, (res) => {
      if (res.statusCode === 200) {
        successCount++;
      } else {
        errorCount++;
      }
      res.on('data', () => {}); // Consume stream
      res.on('end', resolve);
    }).on('error', () => {
      errorCount++;
      resolve();
    });
  });
}

async function runTest() {
  const promises = [];
  while ((Date.now() - startTime) < (DURATION_SEC * 1000)) {
    if (promises.length < CONCURRENT_REQUESTS) {
      promises.push(makeRequest().then(() => {
        promises.splice(promises.indexOf(this), 1);
      }));
    }
    await new Promise(r => setTimeout(r, 10)); // tiny throttle
  }
  
  await Promise.all(promises);
  
  console.log(`\n=== Load Test Complete ===`);
  console.log(`Total Successful Requests: ${successCount}`);
  console.log(`Total Failed Requests: ${errorCount}`);
  console.log(`RPS (Req/Sec): ${(successCount + errorCount) / DURATION_SEC}`);
  
  if (errorCount === 0) {
    console.log('\n✅ PASS: System remained stable under simulated load (M6.4 met).');
  } else {
    console.log('\n❌ FAIL: High error rate detected under load.');
  }
}

runTest();
