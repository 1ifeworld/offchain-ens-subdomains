// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "forge-std/Script.sol";

import {OffchainResolver} from "../src/OffchainResolver.sol";

contract DeployCore is Script {

    OffchainResolver offchainResolver;
    string dbUrl = "example.river.ph";
    address operator = 0x004991c3bbcF3dd0596292C80351798965070D75;

    function run() public {
        // Setup deploy environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Setup signers
        address[] memory signers = new address[](1);
        signers[0] = operator;        

        // Deploy OffchainResolver
        offchainResolver = new OffchainResolver(dbUrl, signers);

        // Register on ENS
        
        vm.stopBroadcast();        
    }    
}

// Deploy steps
// 1. source .env
// 2. forge script script/OffchainResolver.s.sol:DeployCore -vvvv --rpc-url $RPC_URL --broadcast --verify --verifier-url https://api-goerli-optimistic.etherscan.io/api