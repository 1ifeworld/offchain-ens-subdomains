export const OffchainLookupAbi = [
	{
		inputs: [
			{ internalType: 'string', name: '_url', type: 'string' },
			{ internalType: 'address', name: '_initialOwner', type: 'address' },
			{ internalType: 'address', name: '_signer', type: 'address' },
		],
		stateMutability: 'nonpayable',
		type: 'constructor',
	},
	{ inputs: [], name: 'ECDSAInvalidSignature', type: 'error' },
	{
		inputs: [{ internalType: 'uint256', name: 'length', type: 'uint256' }],
		name: 'ECDSAInvalidSignatureLength',
		type: 'error',
	},
	{ inputs: [{ internalType: 'bytes32', name: 's', type: 'bytes32' }], name: 'ECDSAInvalidSignatureS', type: 'error' },
	{ inputs: [], name: 'InvalidSigner', type: 'error' },
	{
		inputs: [
			{ internalType: 'address', name: 'sender', type: 'address' },
			{ internalType: 'string[]', name: 'urls', type: 'string[]' },
			{ internalType: 'bytes', name: 'callData', type: 'bytes' },
			{ internalType: 'bytes4', name: 'callbackFunction', type: 'bytes4' },
			{ internalType: 'bytes', name: 'extraData', type: 'bytes' },
		],
		name: 'OffchainLookup',
		type: 'error',
	},
	{ inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'OwnableInvalidOwner', type: 'error' },
	{
		inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
		name: 'OwnableUnauthorizedAccount',
		type: 'error',
	},
	{ inputs: [], name: 'ResolverFunctionNotSupported', type: 'error' },
	{ inputs: [{ internalType: 'uint64', name: 'deadline', type: 'uint64' }], name: 'SignatureExpired', type: 'error' },
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: 'address', name: 'signer', type: 'address' }],
		name: 'AddSigner',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
			{ indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
		],
		name: 'OwnershipTransferred',
		type: 'event',
	},
	{
		anonymous: false,
		inputs: [{ indexed: true, internalType: 'address', name: 'signer', type: 'address' }],
		name: 'RemoveSigner',
		type: 'event',
	},
	{
		inputs: [{ internalType: 'address[]', name: '_signers', type: 'address[]' }],
		name: 'addSigners',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'isAuthorized',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{ internalType: 'address', name: 'target', type: 'address' },
			{ internalType: 'uint64', name: 'expires', type: 'uint64' },
			{ internalType: 'bytes', name: 'request', type: 'bytes' },
			{ internalType: 'bytes', name: 'result', type: 'bytes' },
		],
		name: 'makeSignatureHash',
		outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
		stateMutability: 'pure',
		type: 'function',
	},
	{
		inputs: [],
		name: 'owner',
		outputs: [{ internalType: 'address', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address[]', name: '_signers', type: 'address[]' }],
		name: 'removeSigners',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{ inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
	{
		inputs: [
			{ internalType: 'bytes', name: 'name', type: 'bytes' },
			{ internalType: 'bytes', name: 'data', type: 'bytes' },
		],
		name: 'resolve',
		outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [
			{ internalType: 'bytes', name: 'response', type: 'bytes' },
			{ internalType: 'bytes', name: 'extraData', type: 'bytes' },
		],
		name: 'resolveWithProof',
		outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'string', name: '_url', type: 'string' }],
		name: 'setUrl',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'bytes4', name: 'interfaceID', type: 'bytes4' }],
		name: 'supportsInterface',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'pure',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
		name: 'transferOwnership',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [],
		name: 'url',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;