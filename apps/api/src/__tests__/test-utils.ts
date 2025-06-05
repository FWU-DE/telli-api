import Fastify, { FastifyInstance } from "fastify";

// Create a test Fastify instance
export function createTestApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
    ajv: { customOptions: { strict: false } },
  });

  // Disable validators for testing (we test validation separately)
  app.setValidatorCompiler(() => {
    return () => true;
  });

  app.setSerializerCompiler(() => {
    return (data) => JSON.stringify(data);
  });

  // Add minimal test routes
  app.get('/health', async () => {
    return { message: 'Ok' };
  });

  app.get('/error', async () => {
    throw new Error('Test Error');
  });

  return app;
}

// Helper to create mock request with authorization header
export function createMockRequest(body: any, headers: Record<string, string> = {}) {
  const defaultHeaders = headers.authorization === undefined && Object.keys(headers).length === 0 
    ? {} 
    : { authorization: "Bearer test-api-key" };
    
  return {
    body,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };
}

// Helper to create mock reply
export function createMockReply() {
  const reply = {
    send: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    raw: {
      writeHead: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    },
  };
  return reply;
}