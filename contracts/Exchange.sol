// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console } from "hardhat/console.sol";
import { Token } from "./Token.sol";

contract Exchange { 
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    function deposit(address _token, uint256 _amount) public {
        // transfer token to exchange
        Token(_token).transferFrom(msg.sender, address(this), _amount);
        // update balance
        tokens[_token][msg.sender] += _amount;
        // emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function checkBalance(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }
}
