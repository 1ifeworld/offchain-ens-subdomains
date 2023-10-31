// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {OffchainResolver} from "../src/OffchainResolver.sol";

contract OffchainResolverTest is Test {
    //////////////////////////////////////////////////
    // CONSTANTS
    //////////////////////////////////////////////////  

    string public constant dbUrl = "example.river.ph";   

    //////////////////////////////////////////////////
    // VARIABLES
    //////////////////////////////////////////////////     

    OffchainResolver public offchainResolver;
    Account public owner;
    Account public maliciousOwner;
    Account public signer;
    Account public maliciousSigner;      

    //////////////////////////////////////////////////
    // SETUP (run before every test)
    //////////////////////////////////////////////////    

    function setUp() public {
        offchainResolver = new OffchainResolver(dbUrl, owner.addr, signer.addr);        
    }

    //////////////////////////////////////////////////
    // TESTS
    //////////////////////////////////////////////////        
}
