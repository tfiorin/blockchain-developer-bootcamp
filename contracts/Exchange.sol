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
    mapping(uint256 => bool) public orderCancelled;
    mapping(uint256 => bool) public orderFilled;

    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    event Order(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event Cancel(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, uint256 timestamp);
    event Trade(uint256 id, address user, address tokenGet, uint256 amountGet, address tokenGive, uint256 amountGive, address creator, uint256 timestamp);

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
        console.log("Order: ", orderCount);
        console.log("User: ", msg.sender);
        console.log("TokenGet: ", _tokenGet);
        console.log("AmountGet: ", _amountGet);
        console.log("TokenGive: ", _tokenGive);
        console.log("AmountGive: ", _amountGive);
        console.log("Timestamp: ", block.timestamp);
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    }

    function cancelOrder(uint256 _id) public {
        _Order storage _order = _validateOrder(_id);

        // Ensure the caller of the function is the owner of the order
        require(address(_order.user) == msg.sender);

        orderCancelled[_id] = true;

        // emit event
        emit Cancel(_id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);
    }

    // -----------------------------------------
    // EXECUTE ORDERS
    // -----------------------------------------

    function fillOrder(uint256 _id) public {
        // fetch order
        _Order storage _order = _validateOrder(_id);

        // order can't be filled
        require(!orderFilled[_id], "Order already filled");        
        
        _trade(_order);

        orderFilled[_id] = true;
    }

    // -----------------------------------------
    // INTERNAL FUNCTIONS
    // -----------------------------------------

    function _validateOrder(uint256 _id) internal view returns (_Order storage) {
        // fetch order
        _Order storage _order = orders[_id];

        // order must exists
        require(_order.id != 0, "Invalid order");
        // order must not be cancelled
        require(!orderCancelled[_order.id], "Order already cancelled");

        return _order;
    }

    function _trade(_Order storage _order) internal {
        // fee paid by the user that fills the order
        uint256 _feeAmount = (_order.amountGet * feePercent) / 100;

        //msg.sender -> user who filled the order
        //_order.user -> user who created the order
        tokens[_order.tokenGet][msg.sender] -= (_order.amountGet + _feeAmount);
        tokens[_order.tokenGet][_order.user] += _order.amountGet;
        
        tokens[_order.tokenGive][_order.user] -= _order.amountGive;
        tokens[_order.tokenGive][msg.sender] += _order.amountGive;

        // pay fees
        tokens[_order.tokenGet][feeAccount] += _feeAmount;

        // emit event
        emit Trade(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, _order.user, block.timestamp);
    }
}
