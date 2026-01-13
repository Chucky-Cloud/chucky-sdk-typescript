import { ChuckyClient, createToken, createBudget, getResultText } from '../src/index.js';

const PROJECT_ID = process.env.CHUCKY_PROJECT_ID!;
const HMAC_KEY = process.env.CHUCKY_HMAC_KEY!;

async function main() {
  const token = await createToken({
    userId: 'test-user',
    projectId: PROJECT_ID,
    secret: HMAC_KEY,
    expiresIn: 3600,
    budget: createBudget({ aiDollars: 1, computeHours: 1, window: 'day' }),
  });

  console.log('Token created');

  const client = new ChuckyClient({ token, debug: false });

  try {
    // Test 1: Positional style
    console.log('\n📝 Test 1: Positional style - prompt(message, options)');
    const result1 = await client.prompt(
      'Say "hello positional" and nothing else.',
      { model: 'claude-sonnet-4-5-20250929' }
    );
    console.log('Result:', getResultText(result1));

    // Wait for concurrency slot to be released
    console.log('⏳ Waiting for session cleanup...');
    await new Promise(r => setTimeout(r, 4000));

    // Test 2: Object style
    console.log('\n📝 Test 2: Object style - prompt({ message, ...options })');
    const result2 = await client.prompt({
      message: 'Say "hello object" and nothing else.',
      model: 'claude-sonnet-4-5-20250929',
    });
    console.log('Result:', getResultText(result2));

    console.log('\n✅ Both styles work!');
  } catch (e) {
    console.error('Error:', (e as Error).message);
  } finally {
    client.close();
  }
}

main();
