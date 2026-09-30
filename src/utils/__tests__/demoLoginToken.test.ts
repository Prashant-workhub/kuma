import assert from 'node:assert/strict';
import { test } from 'node:test';

// Helper function modeling client demo token endpoint response evaluation
function evaluateDemoTokenResponse(status: number, data: any) {
  if (status === 404) {
    return {
      success: false,
      error: data?.error || 'Demo mode is disabled on this server.'
    };
  }

  if (status !== 200 || !data?.success || !data?.customToken) {
    return {
      success: false,
      error: data?.error || 'Failed to retrieve demo authentication token.'
    };
  }

  return {
    success: true,
    customToken: data.customToken,
    role: data.role || 'trainee'
  };
}

test('evaluateDemoTokenResponse handles 404 when DEMO_MODE is disabled', () => {
  const result = evaluateDemoTokenResponse(404, {
    success: false,
    error: 'Demo authentication is disabled.'
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Demo authentication is disabled.');
});

test('evaluateDemoTokenResponse handles successful token generation', () => {
  const result = evaluateDemoTokenResponse(200, {
    success: true,
    customToken: 'mock-custom-token-xyz',
    role: 'admin'
  });

  assert.equal(result.success, true);
  assert.equal(result.customToken, 'mock-custom-token-xyz');
  assert.equal(result.role, 'admin');
});

test('evaluateDemoTokenResponse rejects missing token payload', () => {
  const result = evaluateDemoTokenResponse(200, {
    success: true
  });

  assert.equal(result.success, false);
  assert.equal(result.error, 'Failed to retrieve demo authentication token.');
});
