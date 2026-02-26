// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LegacyChain {

    address public owner;
    address public authority;

    struct DigitalAsset {
        string assetHash;
        address beneficiary;
        bool released;
    }

    mapping(uint256 => DigitalAsset) public assets;
    uint256 public assetCount;

    modifier onlyOwner() {
        
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthority() {
        require(msg.sender == authority, "Not authority");
        _;
    }

    constructor(address _authority) {
        owner = msg.sender;
        authority = _authority;
    }

    function addAsset(string memory _hash, address _beneficiary) public onlyOwner {
        assets[assetCount] = DigitalAsset(_hash, _beneficiary, false);
        assetCount++;
    }

    function verifyDeathAndRelease(uint256 _id) public onlyAuthority {
        require(!assets[_id].released, "Already released");
        assets[_id].released = true;
    }

    function getAsset(uint256 _id) public view returns (string memory) {
        require(msg.sender == assets[_id].beneficiary, "Not beneficiary");
        require(assets[_id].released, "Access not released yet");
        return assets[_id].assetHash;
    }
}
