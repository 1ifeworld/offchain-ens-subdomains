// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./SupportsInterface.sol";
import "./IExtendedResolver.sol";
import "./SignatureVerifier.sol";
import {Ownable} from "openzeppelin-contracts/utils/access/Ownable";

interface IResolverService {
    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        returns (bytes memory result, uint64 expires, bytes memory sig);
}

/**
 * Implements an ENS resolver that directs all queries to a CCIP read gateway.
 * Callers must implement EIP 3668 and ENSIP 10.
 */
contract OffchainResolver is IExtendedResolver, SupportsInterface, Ownable {

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Revert to indicate an offchain CCIP lookup. See: https://eips.ethereum.org/EIPS/eip-3668
     *
     * @param sender           Address of this contract.
     * @param urls             List of lookup gateway URLs.
     * @param callData         Data to call the gateway with.
     * @param callbackFunction 4 byte function selector of the callback function on this contract.
     * @param extraData        Additional data required by the callback function.
     */
    error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData);

    /// @dev Revert queries for unimplemented resolver functions.
    error ResolverFunctionNotSupported();

    /// @dev Revert if the recovered signer address is not an authorized signer.
    error InvalidSigner();    

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Emit an event when the contract owner authorizes a new signer.
     *
     * @param signer Address of the authorized signer.
     */
    event AddSigner(address indexed signer);

    /**
     * @dev Emit an event when the contract owner removes an authorized signer.
     *
     * @param signer Address of the removed signer.
     */
    event RemoveSigner(address indexed signer);

    /*//////////////////////////////////////////////////////////////
                              STORAGE
    //////////////////////////////////////////////////////////////*/    

    /**
     * @dev URL of the CCIP lookup gateway.
     */
    string public url;

    /**
     * @dev Mapping of signer address to authorized boolean.
     */    
    mapping(address => bool) public isAuthorized;

    /*//////////////////////////////////////////////////////////////
                               CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Set the lookup gateway URL and initial signer.
     *
     * @param _url          Lookup gateway URL. This value is set permanently.
     * @param _initialOwner Initial owner address.
     * @param _signer       Initial authorized signer address.     
     */
    constructor(string memory _url, address, _initialOwner, address _signer) {
        _transferOwnership(_initialOwner);
        url = _url;
        isAuthorized[_signer] = true;
        emit AddSigner(_signer);
    }

    /*//////////////////////////////////////////////////////////////
                               OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/    

    /**
     * Sets the URL for the resolver service. Only callable by owner.
     */
    function updateUrl(string calldata _url) onlyOwner external {
        url = _url;
    }

    /**
     * Sets the signers for the resolver service. Only callable by the signers.
     */
    function addSigners(address[] calldata _signers) onlyOwner external {
        for (uint256 i = 0; i < _signers.length; i++) {
            isAuthorized[_signers[i]] = true;
            emit AddSigner(_signers[i]);
        }
    }    

    /**
     * Sets the signers for the resolver service. Only callable by the signers.
     */
    function removeSigners(address[] calldata _signers) onlyOwner external {
        for (uint256 i = 0; i < _signers.length; i++) {
            isAuthorized[_signers[i]] = false;
            emit RemoveSigner(_signers[i]);
        }
    }        

    /*//////////////////////////////////////////////////////////////
                             RESOLVER VIEWS
    //////////////////////////////////////////////////////////////*/    

    function makeSignatureHash(address target, uint64 expires, bytes calldata request, bytes memory result)
        external
        pure
        returns (bytes32)
    {
        return SignatureVerifier.makeSignatureHash(target, expires, request, result);
    }

    /**
     * Resolves a name, as specified by ENSIP 10.
     * @param name The DNS-encoded name to resolve.
     * @param data The ABI encoded data for the underlying resolution function (Eg, addr(bytes32), text(bytes32,string), etc).
     * @return The return data, ABI encoded identically to the underlying function.
     */
    function resolve(bytes calldata name, bytes calldata data) external view override returns (bytes memory) {
        bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, name, data);
        string[] memory urls = new string[](1);
        urls[0] = url;
        revert OffchainLookup(address(this), urls, callData, OffchainResolver.resolveWithProof.selector, callData);
    }

    /**
     * Callback used by CCIP read compatible clients to verify and parse the response.
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns (bytes memory) {
        (address signer, bytes memory result) = SignatureVerifier.verify(extraData, response);
        if (!isAuthorized[signer]) revert InvalidSigner();
        return result;
    }

    function supportsInterface(bytes4 interfaceID) public pure override returns (bool) {
        return interfaceID == type(IExtendedResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
