// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.17;

contract Permissions {
    address owner;
    address payable authority;

    constructor() {
        owner = msg.sender;
        isAuthorised[owner] = true;
        authority = payable(owner);
    }

    mapping(address => bool) isAuthorised;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner of contract!");
        _;
    }

    modifier onlyAuthority() {
        require(authority == msg.sender, "User is not authority!");
        _;
    }

    function setAuthority(address authorityAddress) external onlyOwner {
        authority = payable(authorityAddress);
    }

    modifier costs(uint256 price) {
        if (msg.value >= price) {
            _;
        }
    }
}