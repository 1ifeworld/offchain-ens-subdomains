/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import handleProxy from './proxy';
import handleRedirect from './redirect';
import apiRouter from './router';
import { Router, IRequest } from 'itty-router';
import { Env } from '../src/env'
import { getName, getNames, setName } from './handlers';
import { getCcipRead} from './ccip-read/getCCIPRead'

const router = Router();

router
  .all('*')
  .get('/lookup/*', (request: any, env) => getCcipRead(request as Request, env))
	.get('/get/:name', (request: IRequest, env) => getName(request, env))
  .get('/names', (request: any, env) => getNames(env))
	.post('/set', (request: IRequest, env) => setName(request, env))
  .all('*', () => new Response('Not found', { status: 404 }));


	export default {
		async fetch(request: any, env: Env, ctx: ExecutionContext): Promise<Response> {
			const response = await router.handle(request as Request, env);
			if (response.status !== 404) {
				return response;
			}

			const url = new URL(request.url);

			switch (url.pathname) {
				case '/redirect':
					return handleRedirect.fetch(request, env, ctx);

				case '/proxy':
					return handleProxy.fetch(request, env, ctx);
			}

			if (url.pathname.startsWith('/api/')) {
				return apiRouter.handle(request);
			}

			return new Response(
				`Try making requests to:
				<ul>
				<li><code><a href="/redirect?redirectUrl=https:server.talktomenice.workers.dev">/redirect?redirectUrl=https:server.talktomenice.workers.dev</a></code>,</li>
				<li><code><a href="/proxy?modify&proxyUrl=https://server.talktomenice.workers.dev">/proxy?modify&proxyUrl=server.talktomenice.workers.dev/</a></code>, or</li>
				<li><code><a href="/api/todos">/api/todos</a></code></li>`,
				{ headers: { 'Content-Type': 'text/html' } }
			);
		},
	};

