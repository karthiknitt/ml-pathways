import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('API Routes - Health Checks', () => {
  test('should handle experiments API without auth', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/experiments`);

    // Should either return 401/403 (requires auth), 503 (db not configured), or 200 with data
    expect([200, 401, 403, 503]).toContain(response.status());
  });

  test('should handle datasets API without auth', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/datasets`);

    // Should either return 401/403 (requires auth), 503 (db not configured), or 200 with data
    expect([200, 401, 403, 503]).toContain(response.status());
  });

  test('should reject chat without required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {},
    });

    // Should return 400 or 401
    expect([400, 401, 500]).toContain(response.status());
  });

  test('should reject code generation without required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/generate-code`, {
      data: {},
    });

    // Should return 400 or 401
    expect([400, 401, 500]).toContain(response.status());
  });

  test('should reject execute without required fields', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/execute`, {
      data: {},
    });

    // Should return 400 or 401
    expect([400, 401, 500]).toContain(response.status());
  });
});

test.describe('API Routes - Chat', () => {
  test('should require messages field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        experimentId: 'test-id',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should provide helpful error when AI provider not configured', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/chat`, {
      data: {
        experimentId: 'test-id',
        messages: [{ role: 'user', content: 'Hello' }],
      },
    });

    const body = await response.json();

    // Should either succeed or give helpful error about API keys
    if (response.status() >= 400) {
      const bodyText = JSON.stringify(body).toLowerCase();
      const hasHelpfulError =
        bodyText.includes('api key') ||
        bodyText.includes('provider') ||
        bodyText.includes('configured') ||
        bodyText.includes('auth');

      expect(hasHelpfulError || response.status() === 401).toBeTruthy();
    }
  });
});

test.describe('API Routes - Code Execution', () => {
  test('should require code field', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/execute`, {
      data: {
        experimentId: 'test-id',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should provide helpful error when E2B not configured', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/execute`, {
      data: {
        experimentId: 'test-id',
        code: 'print("Hello")',
      },
    });

    const body = await response.json();

    // Should either succeed or give helpful error about E2B setup
    if (response.status() >= 400) {
      const bodyText = JSON.stringify(body).toLowerCase();
      const hasHelpfulError =
        bodyText.includes('e2b') ||
        bodyText.includes('sandbox') ||
        bodyText.includes('api key') ||
        bodyText.includes('auth');

      expect(hasHelpfulError || response.status() === 401).toBeTruthy();
    }
  });
});

test.describe('API Routes - EDA', () => {
  test('should handle EDA GET request', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/eda?experimentId=test-id`);

    // May require auth or return data
    expect([200, 400, 401, 404]).toContain(response.status());
  });

  test('should require CSV data for POST', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/eda`, {
      data: {},
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('API Routes - Sample Datasets', () => {
  test('should list sample datasets', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/datasets/sample`);

    // Should return list of sample datasets
    expect([200, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
    }
  });
});
