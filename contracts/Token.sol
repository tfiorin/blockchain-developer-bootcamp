// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Token {    
    string public name = "My Token";
    string public symbol = "MYT";
    uint256 public totalSupply = 1000000;
    uint8 public decimals = 18;
}
