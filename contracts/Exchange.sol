// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { console }  from "hardhat/console.sol";
import { Token }    from "./Token.sol";

contract Exchange { 
    address public feeAccount; // the account that receives exchange fees
    uint256 public feePercent; // the fee percentage
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    uint256 public orderCount;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);

    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }

    constructor(address _feeAccount, uint256 _feePercent) {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // -----------------------------------------
    // DEPOSIT & WITHDRAW TOKEN
    // -----------------------------------------

    function depositToken(address _token, uint256 _amount) public {
        // transfer token to exchange
        Token(_token).transferFrom(msg.sender, address(this), _amount);
        // update balance
        tokens[_token][msg.sender] += _amount;
        // emit event
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawToken(address _token, uint256 _amount) public {
        // check if user has enough token
        require(tokens[_token][msg.sender] >= _amount, "Insufficient balance");
        // transfer token to user
        tokens[_token][msg.sender] -= _amount;
        // update user balance
        Token(_token).transfer(msg.sender, _amount);
        // emit event
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token, address _user) public view returns (uint256) {
        return tokens[_token][_user];
    }

    // -----------------------------------------
    // MAKE & CANCEL ORDERS
    // -----------------------------------------

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive, "Insufficient balance");

        orderCount += 1;
        // instantiate a new order
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            block.timestamp
        );
        // emit event
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }
}
