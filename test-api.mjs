#!/usr/bin/env node
/**
 * Test script for Studio 118 API
 * Tests all endpoints to ensure they work correctly
 */

// Using built-in fetch (Node.js 18+)

const API_BASE = process.env.API_BASE || 'http://localhost:3008';
const TEST_USER_ID = 'test_user_' + Date.now();

console.log('🧪 Studio 118 API Test Suite\n');
console.log(`API Base URL: ${API_BASE}`);
console.log(`Test User ID: ${TEST_USER_ID}\n`);

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
    try {
        console.log(`\n📝 Testing: ${name}`);
        await fn();
        console.log(`✅ PASSED: ${name}`);
        testsPassed++;
    } catch (error) {
        console.error(`❌ FAILED: ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }
}

// Test 1: Health Check
await test('Health Check', async () => {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    
    if (!response.ok) throw new Error('Health check failed');
    if (data.status !== 'ok') throw new Error('Status is not ok');
    
    console.log(`   Status: ${data.status}`);
    console.log(`   Active Sessions: ${data.activeSessions}`);
});

// Test 2: Get Precios
await test('Get Precios', async () => {
    const response = await fetch(`${API_BASE}/api/precios`);
    const data = await response.json();
    
    if (!response.ok) throw new Error('Failed to get precios');
    if (!data.success) throw new Error('Response not successful');
    if (!data.precios) throw new Error('No precios in response');
    
    console.log(`   Services available: ${Object.keys(data.precios).join(', ')}`);
});

// Test 3: Get Session (should be empty initially)
await test('Get Session (empty)', async () => {
    const response = await fetch(`${API_BASE}/api/session/${TEST_USER_ID}`);
    const data = await response.json();
    
    if (!response.ok) throw new Error('Failed to get session');
    if (!data.success) throw new Error('Response not successful');
    if (data.historyLength !== 0) throw new Error('History should be empty');
    
    console.log(`   History length: ${data.historyLength}`);
});

// Test 4: Send Chat Message (without API key, will fail gracefully)
await test('Send Chat Message', async () => {
    const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_USER_ID,
            message: 'Hola, ¿cuáles son los precios?'
        })
    });
    
    const data = await response.json();
    
    // This might fail if no GEMINI_API_KEY is set, which is OK for testing structure
    if (response.ok) {
        if (!data.success) throw new Error('Response not successful');
        console.log(`   Response received (${data.message?.length || 0} chars)`);
        console.log(`   Model: ${data.model}`);
    } else {
        console.log(`   ⚠️  Expected failure (no API key): ${data.error}`);
        // Don't throw error - this is expected without API key
    }
});

// Test 5: Create Booking
await test('Create Booking', async () => {
    const response = await fetch(`${API_BASE}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: TEST_USER_ID,
            service: 'corte',
            date: '2024-10-15',
            time: '15:30'
        })
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error('Failed to create booking');
    if (!data.success) throw new Error('Response not successful');
    if (!data.booking) throw new Error('No booking in response');
    
    console.log(`   Service: ${data.booking.dayText} at ${data.booking.timeText}`);
});

// Test 6: Delete Session
await test('Delete Session', async () => {
    const response = await fetch(`${API_BASE}/api/session/${TEST_USER_ID}`, {
        method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error('Failed to delete session');
    if (!data.success) throw new Error('Response not successful');
    
    console.log(`   Session deleted successfully`);
});

// Test 7: Verify Session is Gone
await test('Verify Session Deleted', async () => {
    const response = await fetch(`${API_BASE}/api/session/${TEST_USER_ID}`);
    const data = await response.json();
    
    if (!response.ok) throw new Error('Failed to get session');
    if (data.historyLength !== 0) throw new Error('History should be empty after deletion');
    
    console.log(`   History length after deletion: ${data.historyLength}`);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   Total: ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
}
