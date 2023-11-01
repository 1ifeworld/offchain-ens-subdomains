import { SigningKey } from 'ethers/lib/utils';

import { database } from '../ccip-read/db'
import { makeApp } from '../ccip-read/server'
import { Env } from '../env';

export const getCcipRead = async (request: Request, env: Env) => {
  const privateKey = env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("Private key is not set in the environment.");
  }

  const signer = new SigningKey(privateKey);
  const ccipRouter = makeApp(signer, '/lookup/', database, env);

  return ccipRouter.handle(request);
};
