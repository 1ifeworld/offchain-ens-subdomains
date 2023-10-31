// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {Test, console2} from "forge-std/Test.sol";
import {OffchainResolver, IResolverService, IExtendedResolver} from "../src/OffchainResolver.sol";

contract OffchainResolverTest is Test {
    //////////////////////////////////////////////////
    // CONSTANTS
    //////////////////////////////////////////////////  

    string public constant DB_URL = "https://example.gateway/ccip/{sender}/{data}";  
    address public constant TEST_ADDRESS = address(0x123);
    
    /**
     * @dev DNS-encoding of "test.river.id"
     * NOTE: used chat gpt for this value
     */
    bytes public constant DNS_ENCODED_NAME = hex'047465737405726976657202696400';

    /**
     * @dev Encoded calldata for a call to addr(bytes32 node), where node is the ENS
     *      nameHash encoded value of "test.river.id"
     * NOTE: used chat gpt for this value
     */    
    bytes public constant ENS_NAMEHASH = hex'67cb9a5807316de61cf7d20da1a1b9d5ef24b1b7d3c46d791afc5e3dc6f694d3';

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
        owner = makeAccount("owner");
        maliciousOwner = makeAccount("malicious_owner");
        signer = makeAccount("signer");        
        maliciousSigner = makeAccount("malicious_signer");        
        offchainResolver = new OffchainResolver(DB_URL, owner.addr, signer.addr);        
    }

    //////////////////////////////////////////////////
    // CONSTRUCTOR TESTS
    //////////////////////////////////////////////////        

    function test_url() public {
        assertEq(offchainResolver.url(), DB_URL);
    }

    function test_owner() public {
        assertEq(offchainResolver.owner(), owner.addr);
    }

    function test_signer() public {
        assertEq(offchainResolver.isAuthorized(signer.addr), true);
    }    

    //////////////////////////////////////////////////
    // RESOLVE TESTS
    //////////////////////////////////////////////////

    function test_Revert_OffchainLookup_resolve() public {
        // Setup values
        string[] memory urls = new string[](1);
        urls[0] = DB_URL;
        bytes memory callData = abi.encodeCall(IResolverService.resolve, (DNS_ENCODED_NAME, DNS_ENCODED_NAME));
        bytes memory offchainLookup = abi.encodeWithSelector(
            OffchainResolver.OffchainLookup.selector,
            address(offchainResolver),
            urls,
            callData,
            OffchainResolver.resolveWithProof.selector,
            callData
        );
        // Call and expert revert
        vm.expectRevert(offchainLookup);
        offchainResolver.resolve(DNS_ENCODED_NAME, DNS_ENCODED_NAME);
    }

    //////////////////////////////////////////////////
    // RESOLVE WITH PROOF TESTS
    //////////////////////////////////////////////////          

    function test_resolveWithProof() public {
        // Setup values for call
        uint64 expiry = uint64(block.timestamp) + 1000000;
        // callData is passed in as the "extraData" input in the `resolveWithProof` function
        bytes memory callData = abi.encodeCall(IResolverService.resolve, (DNS_ENCODED_NAME, ENS_NAMEHASH));
        // resultData is used in the generation of the callDataHash which is used to generate the valid signature
        //      passed in as part of the encoded response input in `resolvewithProof`
        // It represents the address that is stored in the offchain db for the target username to resolve
        bytes memory resultData = abi.encode(TEST_ADDRESS);
        bytes32 callDataHash = offchainResolver.makeSignatureHash(
            address(offchainResolver), 
            expiry, 
            callData, 
            resultData
        );
        bytes memory signature = _sign(signer.key, callDataHash);
        // Make call and assert response
        bytes memory response = offchainResolver.resolveWithProof(abi.encode(resultData, expiry, signature), callData);
        assertEq(response, abi.encode(TEST_ADDRESS));
    }    

    //////////////////////////////////////////////////
    // HELPERS
    //////////////////////////////////////////////////    

    function _sign(uint256 privateKey, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }
}
