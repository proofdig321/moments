#!/bin/bash

echo "🧪 VERCEL DEPLOYMENT VALIDATION TEST"
echo "===================================="

# Test 1: Serverless function exists and is valid
echo -e "\n1. Testing serverless function structure..."
if [ -f "api/index.js" ]; then
    echo "✅ api/index.js exists"
    node -e "import('./api/index.js').then(() => console.log('✅ Serverless function imports successfully')).catch(e => { console.error('❌ Import failed:', e.message); process.exit(1); })"
else
    echo "❌ api/index.js missing"
    exit 1
fi

# Test 2: Vercel configuration is valid
echo -e "\n2. Testing Vercel configuration..."
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
    cat vercel.json | jq '.' > /dev/null && echo "✅ vercel.json is valid JSON" || { echo "❌ vercel.json invalid JSON"; exit 1; }
else
    echo "❌ vercel.json missing"
    exit 1
fi

# Test 3: Package.json has correct scripts
echo -e "\n3. Testing package.json scripts..."
if grep -q "vercel-build" package.json; then
    echo "✅ vercel-build script exists"
    npm run vercel-build > /dev/null && echo "✅ vercel-build script works" || { echo "❌ vercel-build script failed"; exit 1; }
else
    echo "❌ vercel-build script missing"
    exit 1
fi

# Test 4: No conflicting Express server in api/
echo -e "\n4. Testing for conflicting files..."
if [ ! -f "api/server.js" ]; then
    echo "✅ No conflicting Express server in api/"
else
    echo "❌ Conflicting api/server.js still exists"
    exit 1
fi

# Test 5: Environment variables setup
echo -e "\n5. Testing environment setup..."
if [ -f ".env.vercel" ]; then
    echo "✅ .env.vercel exists for Vercel deployment"
    if grep -q "SUPABASE_URL" .env.vercel; then
        echo "✅ Required environment variables present"
    else
        echo "⚠️  Some environment variables may be missing"
    fi
else
    echo "⚠️  .env.vercel not found (may need manual setup)"
fi

# Test 6: Functional testing of serverless function
echo -e "\n6. Testing serverless function responses..."
node -e "
import('./api/index.js').then(module => {
  const handler = module.default;
  let tests = 0;
  let passed = 0;
  
  // Test root path
  tests++;
  const mockReq1 = { url: '/', method: 'GET' };
  const mockRes1 = {
    writeHead: (code) => { if (code === 200) passed++; },
    end: () => {}
  };
  handler(mockReq1, mockRes1);
  
  // Test admin redirect
  tests++;
  const mockReq2 = { url: '/admin/test', method: 'GET' };
  const mockRes2 = {
    writeHead: (code) => { if (code === 302) passed++; },
    end: () => {}
  };
  handler(mockReq2, mockRes2);
  
  // Test 404
  tests++;
  const mockReq3 = { url: '/nonexistent', method: 'GET' };
  const mockRes3 = {
    writeHead: (code) => { if (code === 404) passed++; },
    end: () => {}
  };
  handler(mockReq3, mockRes3);
  
  setTimeout(() => {
    if (passed === tests) {
      console.log('✅ All functional tests passed (' + passed + '/' + tests + ')');
    } else {
      console.log('❌ Some functional tests failed (' + passed + '/' + tests + ')');
      process.exit(1);
    }
  }, 100);
}).catch(e => {
  console.error('❌ Functional test failed:', e.message);
  process.exit(1);
});
"

echo -e "\n🎉 VERCEL DEPLOYMENT VALIDATION COMPLETE"
echo "========================================"
echo "✅ Serverless function ready for deployment"
echo "✅ Configuration files valid"
echo "✅ No conflicting Express servers"
echo "✅ All routes properly configured"
echo ""
echo "🚀 Ready to deploy with: vercel --prod"
echo "🔗 Landing page will serve from Vercel"
echo "🔗 Admin/API requests will redirect to Railway"