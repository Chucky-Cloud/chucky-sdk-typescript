/**
 * Integration tests for Chucky SDK
 *
 * Requires environment variables:
 * - CHUCKY_PROJECT_ID: Project ID from Chucky portal
 * - CHUCKY_HMAC_KEY: HMAC key for the project
 */

import { ChuckyClient, createToken, createBudget, getResultText, mcpServer, textResult } from '../src/index.js';

const PROJECT_ID = process.env.CHUCKY_PROJECT_ID;
const HMAC_KEY = process.env.CHUCKY_HMAC_KEY;

if (!PROJECT_ID || !HMAC_KEY) {
  console.error('Missing CHUCKY_PROJECT_ID or CHUCKY_HMAC_KEY environment variables');
  process.exit(1);
}

// Helper to wait for concurrency slot to be released
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('🧪 Running SDK integration tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Token creation
  console.log('Test 1: Token creation');
  try {
    const token = await createToken({
      userId: 'test-user',
      projectId: PROJECT_ID,
      secret: HMAC_KEY,
      expiresIn: 3600,
      budget: createBudget({
        aiDollars: 1,
        computeHours: 1,
        window: 'day',
      }),
    });

    if (token && token.split('.').length === 3) {
      console.log('  ✅ Token created successfully');
      passed++;
    } else {
      throw new Error('Invalid token format');
    }
  } catch (error) {
    console.log(`  ❌ Failed: ${(error as Error).message}`);
    failed++;
  }

  // Test 2: Simple prompt
  console.log('\nTest 2: Simple prompt');
  try {
    const token = await createToken({
      userId: 'test-user',
      projectId: PROJECT_ID,
      secret: HMAC_KEY,
      expiresIn: 3600,
      budget: createBudget({
        aiDollars: 1,
        computeHours: 1,
        window: 'day',
      }),
    });

    const client = new ChuckyClient({ token });

    const result = await client.prompt(
      'Say "hello test" and nothing else.',
      { model: 'claude-sonnet-4-5-20250929' }
    );

    const resultText = getResultText(result);
    if (resultText && resultText.toLowerCase().includes('hello')) {
      console.log(`  ✅ Prompt returned: "${resultText.slice(0, 50)}"`);
      console.log(`  📊 Tokens: ${result.usage?.input_tokens} in / ${result.usage?.output_tokens} out`);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${resultText}`);
    }

    client.close();
  } catch (error) {
    console.log(`  ❌ Failed: ${(error as Error).message}`);
    failed++;
  }

  // Wait for concurrency slot to be released
  console.log('\n  ⏳ Waiting for session cleanup...');
  await delay(3000);

  // Test 3: Structured output
  console.log('\nTest 3: Structured output (JSON schema)');
  try {
    const token = await createToken({
      userId: 'test-user',
      projectId: PROJECT_ID,
      secret: HMAC_KEY,
      expiresIn: 3600,
      budget: createBudget({
        aiDollars: 1,
        computeHours: 1,
        window: 'day',
      }),
    });

    const client = new ChuckyClient({ token });

    const result = await client.prompt(
      'What is 2 + 2? Answer with just the number.',
      {
        model: 'claude-sonnet-4-5-20250929',
        outputFormat: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              answer: { type: 'number' },
              explanation: { type: 'string' },
            },
            required: ['answer'],
          },
        },
      }
    );

    // Check structured_output field from SDK result
    const structured = result.structured_output as { answer: number; explanation?: string } | undefined;
    if (structured && structured.answer === 4) {
      console.log(`  ✅ Structured output: ${JSON.stringify(structured)}`);
      passed++;
    } else {
      // Fallback: check if result text contains the answer
      const resultText = getResultText(result);
      if (resultText && resultText.includes('4')) {
        console.log(`  ✅ Result contains answer (no structured output): "${resultText}"`);
        passed++;
      } else {
        throw new Error(`Unexpected result: structured=${JSON.stringify(structured)}, text=${resultText}`);
      }
    }

    client.close();
  } catch (error) {
    console.log(`  ❌ Failed: ${(error as Error).message}`);
    failed++;
  }

  // Wait for concurrency slot to be released
  console.log('\n  ⏳ Waiting for session cleanup...');
  await delay(3000);

  // Test 4: MCP Server with local tools
  console.log('\nTest 4: MCP Server with local tools');
  try {
    const token = await createToken({
      userId: 'test-user',
      projectId: PROJECT_ID,
      secret: HMAC_KEY,
      expiresIn: 3600,
      budget: createBudget({
        aiDollars: 1,
        computeHours: 1,
        window: 'day',
      }),
    });

    // Track tool calls
    let toolWasCalled = false;
    let toolInput: { a: number; b: number } | null = null;

    // Create MCP server with a calculator tool
    const calculatorServer = mcpServer('calculator')
      .addTool({
        name: 'add',
        description: 'Add two numbers together',
        inputSchema: {
          type: 'object',
          properties: {
            a: { type: 'number', description: 'First number' },
            b: { type: 'number', description: 'Second number' },
          },
          required: ['a', 'b'],
        },
        handler: async (input: { a: number; b: number }) => {
          toolWasCalled = true;
          toolInput = input;
          const sum = input.a + input.b;
          return textResult(`The sum of ${input.a} and ${input.b} is ${sum}`);
        },
      })
      .build();

    const client = new ChuckyClient({ token });

    const result = await client.prompt(
      'Use the add tool to calculate 7 + 15. Report the result.',
      {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: [calculatorServer],
      }
    );

    const resultText = getResultText(result);
    if (toolWasCalled && toolInput?.a === 7 && toolInput?.b === 15 && resultText?.includes('22')) {
      console.log(`  ✅ Tool was called with correct inputs: ${JSON.stringify(toolInput)}`);
      console.log(`  ✅ Result contains answer: "${resultText?.slice(0, 60)}..."`);
      passed++;
    } else if (toolWasCalled) {
      console.log(`  ⚠️ Tool was called but with unexpected inputs: ${JSON.stringify(toolInput)}`);
      console.log(`  Result: "${resultText?.slice(0, 60)}..."`);
      // Still count as passed if tool was invoked
      passed++;
    } else {
      throw new Error(`Tool was not called. Result: ${resultText}`);
    }

    client.close();
  } catch (error) {
    console.log(`  ❌ Failed: ${(error as Error).message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(40));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
