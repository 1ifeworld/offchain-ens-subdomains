import express from "express";
import { Pool } from "pg";
import { ethers, BytesLike, concat, Result } from "ethers";
import { Signature } from "ethers";
import { abi as IResolverService_abi } from "@ensdomains/offchain-resolver-contracts/artifacts/contracts/OffchainResolver.sol/IResolverService.json";
import { abi as Resolver_abi } from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/Resolver.sol/Resolver.json";
import { sign } from "crypto";

const Resolver = new ethers.Interface(Resolver_abi);

class PostgresDatabase {
  async addr(name: string, coinType: number): Promise<{ addr: string; ttl: number }> {
    const { rows } = await pool.query(
      "SELECT addr, ttl FROM addresses WHERE name = $1 AND coinType = $2 LIMIT 1",
      [name, coinType]
    );
    if (rows.length === 0) throw new Error("Address not found");
    return { addr: rows[0].addr, ttl: rows[0].ttl };
  }

  async text(name: string, key: string): Promise<{ value: string; ttl: number }> {
    const { rows } = await pool.query(
      "SELECT value, ttl FROM texts WHERE name = $1 AND key = $2 LIMIT 1",
      [name, key]
    );
    if (rows.length === 0) throw new Error("Text not found");
    return { value: rows[0].value, ttl: rows[0].ttl };
  }

  async contenthash(name: string): Promise<{ contenthash: string; ttl: number }> {
    const { rows } = await pool.query(
      "SELECT contenthash, ttl FROM content_hashes WHERE name = $1 LIMIT 1",
      [name]
    );
    if (rows.length === 0) throw new Error("Content hash not found");
    return { contenthash: rows[0].contenthash, ttl: rows[0].ttl };
  }
}
const db = new PostgresDatabase();

interface DatabaseResult {
  result: any[];
  ttl: number;
}

type PromiseOrResult<T> = T | Promise<T>;

export interface Database {
  addr(
    name: string,
    coinType: number
  ): PromiseOrResult<{ addr: string; ttl: number }>;
  text(
    name: string,
    key: string
  ): PromiseOrResult<{ value: string; ttl: number }>;
  contenthash(
    name: string
  ): PromiseOrResult<{ contenthash: string; ttl: number }>;
}

function decodeDnsName(dnsname: Buffer) {
  const labels = [];
  let idx = 0;
  while (true) {
    const len = dnsname.readUInt8(idx);
    if (len === 0) break;
    labels.push(dnsname.slice(idx + 1, idx + len + 1).toString("utf8"));
    idx += len + 1;
  }
  return labels.join(".");
}

const queryHandlers: {
  [key: string]: (
    db: Database,
    name: string,
    args: Result
  ) => Promise<DatabaseResult>;
} = {
  "addr(bytes32)": async (db, name, _args) => {
    const { addr, ttl } = await db.addr(name, ETH_COIN_TYPE);
    return { result: [addr], ttl };
  },
  "addr(bytes32,uint256)": async (db, name, args) => {
    const { addr, ttl } = await db.addr(name, args[0]);
    return { result: [addr], ttl };
  },
  "text(bytes32,string)": async (db, name, args) => {
    const { value, ttl } = await db.text(name, args[0]);
    return { result: [value], ttl };
  },
  "contenthash(bytes32)": async (db, name, _args) => {
    const { contenthash, ttl } = await db.contenthash(name);
    return { result: [contenthash], ttl };
  },
};

async function query(
  db: Database,
  name: string,
  data: string
): Promise<{ result: BytesLike; validUntil: number }> {
  // Parse the data nested inside the second argument to `resolve`
  const parsedResult = Resolver.parseTransaction({ data });
  const signature = parsedResult?.signature;
  const args = parsedResult?.args;

  if (!args || ethers.namehash(name) !== args[0]) {
    throw new Error("Name does not match namehash");
  }

  if (!signature) {
    throw new Error("Signature is missing from the parsed result");
  }

  if (ethers.namehash(name) !== args[0]) {
    throw new Error("Name does not match namehash");
  }

  const handler = queryHandlers[signature];
  if (handler === undefined) {
    throw new Error(`Unsupported query function ${signature}`);
  }

  const { result, ttl } = await handler(db, name, args.slice(1));
  console.log("result, ttl", result, ttl);
  return {
    result: Resolver.encodeFunctionResult(signature, result),
    validUntil: Math.floor(Date.now() / 1000 + ttl),
  };
}
const ETH_COIN_TYPE = 60;

const app = express();
const port = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  user: process.env.DB_USER || "username",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "database_name",
  password: process.env.DB_PASSWORD || "password",
  port: Number(process.env.DB_PORT) || 5432,
});

app.use(express.json());

app.post("/verify", async (req, res) => {
  try {
    const { encodedName, data } = req.body;

    const name = decodeDnsName(Buffer.from(encodedName.slice(2), "hex"));
    const { result, validUntil } = await query(await db, name, data);

    let messageHash = ethers.solidityPackedKeccak256(
      ["bytes", "address", "uint64", "bytes32", "bytes32"],
      [
        "0x1900",
        req?.to,
        validUntil,
        ethers.keccak256(req?.data || "0x"),
        ethers.keccak256(result),
      ]
    );

    const signer = new ethers.SigningKey(process.env.PRIVATE_KEY as BytesLike);
    const sig = signer.sign(messageHash);
    const sigData = concat([sig.r, sig.s]);

    const queryText = "INSERT INTO events(event_type, data) VALUES($1, $2)";
    await pool.query(queryText, [
      "VERIFY",
      JSON.stringify({ result, validUntil, sigData }),
    ]);

    res.json({ result, validUntil, sigData });
  } catch (error) {
    console.error("Error verifying:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

