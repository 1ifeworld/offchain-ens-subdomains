
import { Router, IRequest } from 'itty-router';
import { Env } from '../src/env';
import { getName, getNames, setName } from './handlers';
import { getCcipRead } from './handlers/getCCIPRead';
import { Client } from 'pg';
import { createKysely } from './db/kysely';

const router = Router();

router
.all('*', async (request, env, ctx) => {
	console.log('Incoming Request:', request.method, request.url);

	// Create a Kysely instance
	const db = createKysely(env);

	// Store db in request for use in routes
	request.db = db;
})
.post('/set', (request, env) => {
	console.log('Handling /set with', request);
	return setName(request, env);
})
.get('/get/:name', (request, env) => {
	console.log('Handling /get/:name with', request.params.name);
	return getName(request, env);
})
.get('/names', (request: any, env) => {
	console.log('Handling /names');
	return getNames(env);
})
  .get('/*/*', (request, env) => {
    console.log('Handling /* with', request.url);
    return getCcipRead(request, env);
  })
  .all('*', () => {
    console.log('Route not found');
    return new Response('Not found', { status: 404 });
  });

// Helper function to set CORS headers
function getCORSHeaders() {
  return new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  });
}

// Separate function to handle OPTIONS method
function handleOptions(request: Request): Response {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCORSHeaders(),
    });
  }
  throw new Error('Not an OPTIONS request');
}


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Initialize CORS headers for the response
      const corsHeaders = getCORSHeaders();

      // Connect to the database
      const client = new Client({
        connectionString: env.DATABASE_URL,
      });
			console.log('Before connecting to the database');
			await client.connect();
			console.log('After connecting to the database');

      // Execute the route handler
      let response: Response | undefined = await router.handle(request, env, ctx);

      // Add database client cleanup to the waitUntil so it doesn't hold up the response
      ctx.waitUntil(client.end());

      // Apply the CORS headers to the response
      if (response) {
        const newHeaders = new Headers({
          ...Array.from(response.headers.entries()).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
          ...Array.from(corsHeaders.entries()).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        });
        response = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }


      return response || new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (e) {
      console.error('Error in fetch handler:', e);
      return new Response('An error occurred', {
        status: 500,
        headers: getCORSHeaders(),
      });
    }
  },
};
