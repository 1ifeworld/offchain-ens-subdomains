// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import {OffchainResolver} from "../src/OffchainResolver.sol";

contract OffchainResolverTest is Test {
    OffchainResolver public offchainResolver;
    // add addreses

    function setUp() public {
        offchainResolver = new OffchainResolver();
        
    }
}
