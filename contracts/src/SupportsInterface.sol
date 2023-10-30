// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

interface ISupportsInterface {
    function supportsInterface(bytes4 interfaceId) external pure returns (bool);
}

abstract contract SupportsInterface is ISupportsInterface {
    function supportsInterface(bytes4 interfaceID) virtual override public pure returns(bool) {
        return interfaceID == type(ISupportsInterface).interfaceId;    
    }
}
