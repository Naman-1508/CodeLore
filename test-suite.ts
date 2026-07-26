const BASE_URL = 'http://localhost:4000/v1';

async function runTests() {
  console.log('Starting API Tests...');
  let failed = 0;
  
  async function testEndpoint(name, method, path, body) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(data); } catch(e) {}
      
      if (!res.ok) {
        console.error(`❌ [FAIL] ${method} ${path} - Status: ${res.status}`);
        console.error(`Response: ${data}`);
        failed++;
      } else {
        console.log(`✅ [PASS] ${method} ${path}`);
      }
      return parsed;
    } catch (e) {
      console.error(`❌ [FAIL] ${method} ${path} - Network Error: ${e.message}`);
      failed++;
      return null;
    }
  }

  // 1. Create a workspace
  const ws = await testEndpoint('Create Workspace', 'POST', '/workspaces', { name: 'Test QA Workspace', userId: 'user_test123' });
  let workspaceId = ws?.id;

  // 2. Get workspaces
  await testEndpoint('Get Workspaces', 'GET', `/workspaces?userId=user_test123`);
  
  if (!workspaceId) {
     const workspacesList = await testEndpoint('Get Workspaces', 'GET', `/workspaces?userId=user_test123`);
     workspaceId = workspacesList?.[0]?.id || 1;
  }

  // 3. Create repository (we need one to test repository specific endpoints)
  const repo = await testEndpoint('Create Repository', 'POST', '/repositories', {
    workspaceId,
    name: 'test-express',
    remoteUrl: 'https://github.com/expressjs/express',
    branch: 'master'
  });
  
  const repoId = repo?.id || 1;

  await testEndpoint('Get Repositories', 'GET', `/repositories?workspaceId=${workspaceId}`);
  await testEndpoint('Get Repository', 'GET', `/repositories/${repoId}`);
  await testEndpoint('Get Repository Status', 'GET', `/repositories/${repoId}/status`);
  await testEndpoint('Get Functions', 'GET', `/repositories/${repoId}/functions`);
  await testEndpoint('Get Architect Findings', 'GET', `/repositories/${repoId}/architect-findings`);
  await testEndpoint('Get Health', 'GET', `/repositories/${repoId}/health`);
  await testEndpoint('Get Ownership', 'GET', `/repositories/${repoId}/ownership`);
  await testEndpoint('Get Stories', 'GET', `/repositories/${repoId}/stories`);
  
  await testEndpoint('Search', 'POST', `/repositories/${repoId}/search`, { query: 'test' });

  if (failed === 0) {
    console.log('\n🎉 All API endpoints responded without crashing!');
  } else {
    console.log(`\n⚠️ ${failed} endpoint(s) failed.`);
  }
}

runTests();
