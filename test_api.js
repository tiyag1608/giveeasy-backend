/**
 * Comprehensive Automated Test Suite for GiveEasy Backend API
 * Tests all requirements from Case Study 22
 */
const http = require('http');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5050';

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('🚀 Starting GiveEasy Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    console.log('📋 Test 1: Server Health Check');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.status === 'online', 'Health endpoint responds with online status');

    // 2. Auth: Login as Admin
    console.log('\n📋 Test 2: Admin Authentication');
    const adminLogin = await request('/api/auth/login', 'POST', {
      email: 'admin@giveeasy.org',
      password: 'admin123',
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login returns valid JWT token');
    const adminToken = adminLogin.data.token;

    // 3. Auth: Login as Donor
    console.log('\n📋 Test 3: Donor Authentication');
    const donorLogin = await request('/api/auth/login', 'POST', {
      email: 'priya@example.com',
      password: 'donor123',
    });
    assert(donorLogin.status === 200 && donorLogin.data.token, 'Donor login returns valid JWT token');
    const donorToken = donorLogin.data.token;
    const donorId = donorLogin.data.user.id;

    // 4. Auth: Register new test donor
    console.log('\n📋 Test 4: New User Registration');
    const randEmail = `donor_${Date.now()}@example.com`;
    const regRes = await request('/api/auth/register', 'POST', {
      name: 'Rohan Mehta',
      email: randEmail,
      password: 'password123',
      role: 'donor',
      panNumber: 'FGHIJ5678K',
    });
    assert(regRes.status === 201 && regRes.data.token, 'New donor registered with JWT token');

    // 5. Campaigns: Browse campaigns (GET /api/campaigns)
    console.log('\n📋 Test 5: Browse Campaigns');
    const campaignsRes = await request('/api/campaigns');
    assert(campaignsRes.status === 200 && campaignsRes.data.data.length > 0, `Retrieved ${campaignsRes.data.data.length} active campaigns`);
    const activeCampaign = campaignsRes.data.data[0];

    // 6. Causes: Browse Causes (GET /api/causes)
    console.log('\n📋 Test 6: Browse Causes');
    const causesRes = await request('/api/causes');
    assert(causesRes.status === 200 && causesRes.data.data.length > 0, `Retrieved ${causesRes.data.data.length} verified causes`);

    // 7. Causes: Create Cause (POST /api/causes)
    console.log('\n📋 Test 7: Submit Cause');
    const newCauseRes = await request('/api/causes', 'POST', {
      title: 'Solar Lighting for Tribal Hamlets',
      description: 'Installing solar microgrids for un-electrified villages',
      category: 'Environment',
      ngoName: 'Surya Jyoti Trust',
      ngoRegistrationNumber: '12A/80G/MH/2022/SURYA88',
      contactEmail: 'contact@suryajyoti.org',
    }, donorToken);
    assert(newCauseRes.status === 201 && newCauseRes.data.data.status === 'pending', 'Cause submitted with pending status');
    const newCauseId = newCauseRes.data.data._id;

    // 8. Causes: Admin Verify Cause (PUT /api/causes/:id)
    console.log('\n📋 Test 8: Admin Verify Cause');
    const verifyRes = await request(`/api/causes/${newCauseId}`, 'PUT', {
      status: 'verified',
      verificationNotes: 'Physical verification and tax papers confirmed valid.',
    }, adminToken);
    assert(verifyRes.status === 200 && verifyRes.data.data.status === 'verified', 'Admin successfully verified cause');

    // 9. Campaigns: Admin Create Campaign (POST /api/campaigns)
    console.log('\n📋 Test 9: Create Campaign for Verified Cause');
    const newCampRes = await request('/api/campaigns', 'POST', {
      title: 'Solar Lamps for 100 Forest Dwellers',
      description: 'Distributed solar lighting kits for off-grid families',
      causeId: newCauseId,
      targetAmount: 150000,
      category: 'Environment',
    }, adminToken);
    assert(newCampRes.status === 201 && newCampRes.data.data.targetAmount === 150000, 'Campaign created successfully');
    const createdCampId = newCampRes.data.data._id;

    // 10. WebSockets + Donation: Connect Socket.io client and receive real-time update
    console.log('\n📋 Test 10: Real-time Socket.io & Donation Integration');
    const socket = io(BASE_URL, { reconnection: false, timeout: 5000 });

    await new Promise((resolve) => {
      socket.on('connect', () => {
        socket.emit('join_campaign', createdCampId);
        resolve();
      });
    });

    const socketReceivedPromise = new Promise((resolve) => {
      socket.on('campaign:progress_updated', (data) => {
        if (data.campaignId === createdCampId) {
          resolve(data);
        }
      });
    });

    // Make Donation
    const donateAmount = 2500;
    const donationRes = await request('/api/donations', 'POST', {
      campaignId: createdCampId,
      amount: donateAmount,
      donorName: 'Priya Verma',
      donorEmail: 'priya@example.com',
      paymentMethod: 'UPI',
      panNumber: 'ABCDE1234F',
    }, donorToken);

    assert(donationRes.status === 201, 'Donation processed successfully');
    const donationId = donationRes.data.data.donation._id;
    assert(donationRes.data.data.campaign.raisedAmount === donateAmount, `Campaign raised amount updated to ₹${donateAmount}`);

    // Wait for Socket.io event with timeout
    const socketTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Socket timeout')), 4000));
    try {
      const socketPayload = await Promise.race([socketReceivedPromise, socketTimeout]);
      assert(socketPayload && socketPayload.raisedAmount === donateAmount, `Real-time WebSocket event received: ${socketPayload.percentageRaised}% raised`);
    } catch (e) {
      assert(false, `Socket.io event not received: ${e.message}`);
    } finally {
      socket.disconnect();
    }

    // 11. Tax Receipt API (GET /api/donations/:id/receipt)
    console.log('\n📋 Test 11: 80G Tax Exemption Receipt Generation');
    const receiptRes = await request(`/api/donations/${donationId}/receipt`);
    assert(receiptRes.status === 200 && receiptRes.data.receipt.receiptDetails.receiptNumber, `80G Tax receipt generated #${receiptRes.data.receipt.receiptDetails.receiptNumber}`);

    // 12. User Donations (GET /api/donations/user/:id)
    console.log('\n📋 Test 12: User Donation History');
    const userDonationsRes = await request(`/api/donations/user/${donorId}`, 'GET', null, donorToken);
    assert(userDonationsRes.status === 200 && Array.isArray(userDonationsRes.data.data), 'User donation history fetched successfully');

    // 13. Admin Endpoints: GET /api/admin/campaigns & GET /api/admin/donations
    console.log('\n📋 Test 13: Admin Analytics & Financial Overview');
    const adminCamps = await request('/api/admin/campaigns', 'GET', null, adminToken);
    const adminDonations = await request('/api/admin/donations', 'GET', null, adminToken);
    assert(adminCamps.status === 200 && adminCamps.data.summary, 'Admin campaigns endpoint returns aggregate summary metrics');
    assert(adminDonations.status === 200 && adminDonations.data.analytics, 'Admin donations endpoint returns financial analytics breakdown');

    // 14. Notifications API: POST /api/notifications/send & GET /api/notifications
    console.log('\n📋 Test 14: Push Notifications & Retrieval');
    const notifSend = await request('/api/notifications/send', 'POST', {
      title: 'Target Approaching',
      body: 'Campaign has crossed 50% of its goal!',
      type: 'campaign_update',
    });
    assert(notifSend.status === 201 && notifSend.data.fcmMessageId, `Push notification dispatched via ${notifSend.data.provider}`);

    const notifList = await request('/api/notifications');
    assert(notifList.status === 200 && notifList.data.count > 0, `Fetched ${notifList.data.count} notifications from inbox`);

    console.log('\n=============================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test Runner Exception:', error);
    process.exit(1);
  }
}

// Allow time for server to start if running independently
setTimeout(runTests, 1000);
