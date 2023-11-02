import { SigningKey } from 'ethers/lib/utils';
import { database } from '../ccip-read/db'
import { makeApp } from '../ccip-read/server'
import { Env } from '../env';

export const getCcipRead = async (request: Request, env: Env) => {
    console.log('getCcipRead called with', request.url);
    try {
			const url = new URL(request.url);

			// Split the pathname into segments and filter out any empty strings
			const segments = url.pathname.split('/').filter(segment => segment);

			// Ensure there are exactly 2 segments
			if (segments.length !== 2) {
					console.error('Invalid URL format:', request.url);
					return new Response('Invalid URL format', { status: 400 });
			}

			// Extract the sender and data segments
			const sender = segments[0];
			const data = segments[1];
			const privateKey = '0x' + env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("Private key is not set in the environment.");
        }
        const signer = new SigningKey(privateKey);
        const ccipRouter = makeApp(signer, '/', database, env);

        return ccipRouter.handle(request);
    } catch (error) {
			if (error instanceof Error) {
					console.error('Error in getCcipRead:', error.message, error.stack);
					return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
			}
			console.error('Unknown error in getCcipRead:', error);
			return new Response('Internal Server Error', { status: 500 });
	}
};
