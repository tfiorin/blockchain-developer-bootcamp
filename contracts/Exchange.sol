// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Exchange { 
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
}
