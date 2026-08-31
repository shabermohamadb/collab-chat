import prisma from '../models/prisma.js';
import * as authService from '../services/authService.js';
import { validateDatabaseSession } from '../utils/session.js';

async function runTestSuite() {
  console.log('🧪 Starting Clean Email + Password Authentication Test Suite...\n');

  const testEmail = `user_${Date.now()}@test.com`;
  const testPassword = 'Password123!';

  // 1. Sign up
  console.log(`[1/6] Testing Email Registration for ${testEmail}...`);
  const signupResult = await authService.registerUser({
    email: testEmail,
    password: testPassword,
  });
  if (!signupResult.sessionToken || !signupResult.user.id) {
    throw new Error('Registration failed to create session or user');
  }
  console.log('✅ [1/6] Email Signup successful. Password hashed and saved to JSON DB.');

  // 2. Duplicate rejection
  console.log('[2/6] Testing Duplicate Email Rejection...');
  try {
    await authService.registerUser({
      email: testEmail,
      password: 'anotherpassword',
    });
    throw new Error('Expected duplicate email error');
  } catch (err: any) {
    if (err.message.includes('already registered')) {
      console.log('✅ [2/6] Duplicate email rejected correctly.');
    } else {
      throw err;
    }
  }

  // 3. Invalid password
  console.log('[3/6] Testing Invalid Password Rejection...');
  try {
    await authService.loginUser({
      identifier: testEmail,
      password: 'wrongpassword',
    });
    throw new Error('Expected invalid password error');
  } catch (err: any) {
    if (err.message.includes('Invalid email or password')) {
      console.log('✅ [3/6] Wrong password rejected correctly.');
    } else {
      throw err;
    }
  }

  // 4. Valid login
  console.log('[4/6] Testing Valid Email + Password Login...');
  const loginResult = await authService.loginUser({
    identifier: testEmail,
    password: testPassword,
  });
  if (!loginResult.sessionToken || loginResult.user.email !== testEmail) {
    throw new Error('Login failed to authenticate credentials');
  }
  console.log(`✅ [4/6] Login successful. Session Token: ${loginResult.sessionToken.substring(0, 16)}...`);

  // 5. Session verification
  console.log('[5/6] Testing Session Verification in JSON Database...');
  const validatedUser = await validateDatabaseSession(loginResult.sessionToken);
  if (!validatedUser || validatedUser.id !== signupResult.user.id) {
    throw new Error('Database session validation failed');
  }
  console.log(`✅ [5/6] Database session recognized for User ID: ${validatedUser.id}`);

  // 6. Logout
  console.log('[6/6] Testing Logout & Session Invalidation...');
  await authService.logoutUser(loginResult.sessionToken, signupResult.user.id);
  const afterLogout = await validateDatabaseSession(loginResult.sessionToken);
  if (afterLogout) {
    throw new Error('Session should be destroyed after logout');
  }
  console.log('✅ [6/6] Session successfully invalidated.\n');

  console.log('🎉 ALL EMAIL + PASSWORD AUTHENTICATION TESTS PASSED WITH 100% SUCCESS RATE!');
}

runTestSuite().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
