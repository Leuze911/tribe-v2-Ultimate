import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:4000/api/v1';

test.describe('TRIBE API Tests', () => {
  test('should login with valid credentials', async ({ request }) => {
    console.log('📱 Testing login API...');

    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@tribe.sn',
        password: 'password123',
      },
    });

    console.log(`📍 Response status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log(`✅ Login successful for: ${body.user?.email}`);

    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('user');
    expect(body.user.email).toBe('test@tribe.sn');
    expect(body.tokenType).toBe('Bearer');
  });

  test('should reject invalid credentials', async ({ request }) => {
    console.log('📱 Testing invalid login...');

    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@tribe.sn',
        password: 'wrongpassword',
      },
    });

    console.log(`📍 Response status: ${response.status()}`);
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.message).toContain('incorrect');
  });

  test('should fetch locations', async ({ request }) => {
    console.log('📱 Testing locations API...');

    const response = await request.get(`${API_URL}/locations`);

    console.log(`📍 Response status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log(`✅ Found ${body.data?.length || 0} locations`);

    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('should fetch nearby locations', async ({ request }) => {
    console.log('📱 Testing nearby locations...');

    // Dakar coordinates
    const response = await request.get(`${API_URL}/locations/nearby?lat=14.6937&lng=-17.4441&radius=10`);

    console.log(`📍 Response status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    console.log(`✅ Found ${body.length || 0} nearby locations`);
  });

  test('should create location with authentication', async ({ request }) => {
    console.log('📱 Testing authenticated location creation...');

    // First login
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@tribe.sn',
        password: 'password123',
      },
    });

    const { accessToken } = await loginResponse.json();
    console.log('✅ Got access token');

    // Create location
    const createResponse = await request.post(`${API_URL}/locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: 'Test Location Playwright',
        category: 'restaurant',
        latitude: 14.6937,
        longitude: -17.4441,
        description: 'Created by Playwright test',
      },
    });

    console.log(`📍 Create response status: ${createResponse.status()}`);
    expect(createResponse.status()).toBe(201);

    const location = await createResponse.json();
    console.log(`✅ Created location: ${location.name} (ID: ${location.id})`);

    expect(location.name).toBe('Test Location Playwright');
    expect(location.category).toBe('restaurant');
  });
});
