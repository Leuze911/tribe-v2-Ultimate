import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';

// Generate unique test user for this test run
const testEmail = `e2e_${Date.now()}@tribe.sn`;
const testPassword = 'testpass123';
const testName = 'E2E Test User';

test.describe('Auth API Tests', () => {
  // Setup: Create test user before login tests
  test.beforeAll(async ({ request }) => {
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail,
        password: testPassword,
        fullName: testName,
      },
    });
  });

  test('should login with test user', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    console.log('✅ Login successful');
    console.log('   User:', body.user.email);
    console.log('   Name:', body.user.fullName);
    console.log('   Role:', body.user.role);
    console.log('   Points:', body.user.points);
    console.log('   Level:', body.user.level);

    expect(body.accessToken).toBeDefined();
    expect(body.tokenType).toBe('Bearer');
    expect(body.user.email).toBe(testEmail);
    expect(body.user.fullName).toBe(testName);
    expect(body.user.role).toBe('collector');
  });

  test('should get user profile with token', async ({ request }) => {
    // First login
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });
    const { accessToken } = await loginResponse.json();

    // Get profile
    const profileResponse = await request.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();

    console.log('✅ Profile retrieved');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);

    expect(profile.email).toBe(testEmail);
  });

  test('should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: testEmail,
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    console.log('✅ Invalid credentials rejected correctly');
  });

  test('should register new user', async ({ request }) => {
    const randomEmail = `new_${Date.now()}@tribe.sn`;

    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: randomEmail,
        password: 'password123',
        fullName: 'New Test User',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    console.log('✅ New user registered');
    console.log('   Email:', body.user.email);
    console.log('   Name:', body.user.fullName);

    expect(body.accessToken).toBeDefined();
    expect(body.user.email).toBe(randomEmail);
  });

  test('should reject duplicate email registration', async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/register`, {
      data: {
        email: testEmail, // Already registered in beforeAll
        password: 'password123',
        fullName: 'Duplicate User',
      },
    });

    expect(response.status()).toBe(409);
    console.log('✅ Duplicate email registration rejected correctly');
  });
});

test.describe('Locations API Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Register and login to get token
    const userEmail = `loc_${Date.now()}@tribe.sn`;
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email: userEmail,
        password: 'password123',
        fullName: 'Location Tester',
      },
    });
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: userEmail, password: 'password123' },
    });
    const { accessToken } = await loginRes.json();
    authToken = accessToken;
  });

  test('should get locations list', async ({ request }) => {
    const response = await request.get(`${API_URL}/locations`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    console.log('✅ Locations retrieved');
    console.log('   Total:', body.total || 0, 'locations');
    console.log('   Page:', body.page);
  });

  test('should create a new location', async ({ request }) => {
    const response = await request.post(`${API_URL}/locations`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'E2E Test Restaurant',
        category: 'restaurant',
        latitude: 14.6937,
        longitude: -17.4441,
        description: 'Created by E2E test',
        city: 'Dakar',
      },
    });

    expect(response.ok()).toBeTruthy();
    const location = await response.json();

    console.log('✅ Location created');
    console.log('   ID:', location.id);
    console.log('   Name:', location.name);
    console.log('   Status:', location.status);

    expect(location.name).toBe('E2E Test Restaurant');
    expect(location.status).toBe('pending');
  });

  test('should get location by ID', async ({ request }) => {
    // First create a location
    const createRes = await request.post(`${API_URL}/locations`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        name: 'Get By ID Test',
        category: 'shop',
        latitude: 14.70,
        longitude: -17.45,
      },
    });
    const created = await createRes.json();

    // Then get it
    const response = await request.get(`${API_URL}/locations/${created.id}`);
    expect(response.ok()).toBeTruthy();

    const location = await response.json();
    console.log('✅ Location retrieved by ID');
    expect(location.id).toBe(created.id);
    expect(location.name).toBe('Get By ID Test');
  });

  test('should filter locations by status', async ({ request }) => {
    const response = await request.get(`${API_URL}/locations?status=pending`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log('✅ Filtered by status: pending');
    console.log('   Count:', body.total);

    // All returned should be pending
    for (const loc of body.data) {
      expect(loc.status).toBe('pending');
    }
  });

  test('should filter locations by category', async ({ request }) => {
    const response = await request.get(`${API_URL}/locations?category=restaurant`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log('✅ Filtered by category: restaurant');
    console.log('   Count:', body.total);

    for (const loc of body.data) {
      expect(loc.category).toBe('restaurant');
    }
  });
});

test.describe('Chat API Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const userEmail = `chat_${Date.now()}@tribe.sn`;
    await request.post(`${API_URL}/auth/register`, {
      data: {
        email: userEmail,
        password: 'password123',
        fullName: 'Chat Tester',
      },
    });
    const loginRes = await request.post(`${API_URL}/auth/login`, {
      data: { email: userEmail, password: 'password123' },
    });
    const { accessToken } = await loginRes.json();
    authToken = accessToken;
  });

  test('should respond to chat message', async ({ request }) => {
    const response = await request.post(`${API_URL}/chat/message`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        message: 'Bonjour!',
        history: [],
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    console.log('✅ Chat response received');
    console.log('   Message:', body.message?.substring(0, 50) + '...');

    expect(body.message).toBeDefined();
    expect(body.message.length).toBeGreaterThan(0);
  });

  test('should respond to POI question', async ({ request }) => {
    const response = await request.post(`${API_URL}/chat/message`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        message: 'Comment ajouter un POI?',
        history: [],
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();

    console.log('✅ POI help response received');
    expect(body.message).toContain('POI');
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.post(`${API_URL}/chat/message`, {
      data: {
        message: 'Test without auth',
        history: [],
      },
    });

    expect(response.status()).toBe(401);
    console.log('✅ Chat requires authentication');
  });
});

test.describe('Health Check', () => {
  test('should return health status', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log('✅ Health check passed');
    console.log('   Status:', body.status);
    console.log('   Database:', body.info?.database?.status);

    expect(body.status).toBe('ok');
  });
});
