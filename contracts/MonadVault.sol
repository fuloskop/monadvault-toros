// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MonadVault
 * @notice Main treasury contract for the MonadVault casino
 * @dev Handles deposits, withdrawals, and balance management
 */
contract MonadVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    // User balances: user => token => balance
    mapping(address => mapping(address => uint256)) public balances;
    
    // Withdrawal limits per token
    mapping(address => uint256) public maxWithdrawalPerTx;
    mapping(address => uint256) public dailyWithdrawalLimit;
    mapping(address => mapping(uint256 => uint256)) public dailyWithdrawn; // token => day => amount
    
    // Native token address marker
    address public constant NATIVE_TOKEN = address(0);
    
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdrawal(address indexed user, address indexed token, uint256 amount);
    event WithdrawalRequested(address indexed user, address indexed token, uint256 amount);
    event BalanceAdjusted(address indexed user, address indexed token, int256 delta, string reason);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(WITHDRAWER_ROLE, msg.sender);
        
        // Add native MON token support
        supportedTokens[NATIVE_TOKEN] = true;
        tokenList.push(NATIVE_TOKEN);
        maxWithdrawalPerTx[NATIVE_TOKEN] = 1000 ether;
        dailyWithdrawalLimit[NATIVE_TOKEN] = 10000 ether;
    }
    
    /**
     * @notice Deposit native MON tokens
     */
    function depositNative() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender][NATIVE_TOKEN] += msg.value;
        emit Deposit(msg.sender, NATIVE_TOKEN, msg.value);
    }
    
    /**
     * @notice Deposit ERC20 tokens
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Zero deposit");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender][token] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }
    
    /**
     * @notice Request withdrawal (emits event for backend to process)
     * @param token Token address (address(0) for native)
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Zero withdrawal");
        require(balances[msg.sender][token] >= amount, "Insufficient balance");
        require(amount <= maxWithdrawalPerTx[token], "Exceeds max per tx");
        
        uint256 today = block.timestamp / 1 days;
        require(
            dailyWithdrawn[token][today] + amount <= dailyWithdrawalLimit[token],
            "Daily limit exceeded"
        );
        
        balances[msg.sender][token] -= amount;
        dailyWithdrawn[token][today] += amount;
        
        emit WithdrawalRequested(msg.sender, token, amount);
    }
    
    /**
     * @notice Process withdrawal (operator only)
     * @param user User address
     * @param token Token address
     * @param amount Amount to send
     */
    function processWithdrawal(
        address user,
        address token,
        uint256 amount
    ) external onlyRole(WITHDRAWER_ROLE) nonReentrant {
        if (token == NATIVE_TOKEN) {
            (bool success, ) = payable(user).call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(token).safeTransfer(user, amount);
        }
        
        emit Withdrawal(user, token, amount);
    }
    
    /**
     * @notice Adjust user balance (for wins/losses)
     * @param user User address
     * @param token Token address
     * @param delta Balance change (positive or negative)
     * @param reason Reason for adjustment
     */
    function adjustBalance(
        address user,
        address token,
        int256 delta,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        if (delta > 0) {
            balances[user][token] += uint256(delta);
        } else {
            uint256 decrease = uint256(-delta);
            require(balances[user][token] >= decrease, "Insufficient balance");
            balances[user][token] -= decrease;
        }
        
        emit BalanceAdjusted(user, token, delta, reason);
    }
    
    /**
     * @notice Batch adjust balances
     * @param users User addresses
     * @param token Token address
     * @param deltas Balance changes
     * @param reason Reason for adjustments
     */
    function batchAdjustBalance(
        address[] calldata users,
        address token,
        int256[] calldata deltas,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        require(users.length == deltas.length, "Length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            if (deltas[i] > 0) {
                balances[users[i]][token] += uint256(deltas[i]);
            } else if (deltas[i] < 0) {
                uint256 decrease = uint256(-deltas[i]);
                if (balances[users[i]][token] >= decrease) {
                    balances[users[i]][token] -= decrease;
                }
            }
            emit BalanceAdjusted(users[i], token, deltas[i], reason);
        }
    }
    
    /**
     * @notice Add supported token
     * @param token Token address
     * @param maxPerTx Max withdrawal per transaction
     * @param dailyLimit Daily withdrawal limit
     */
    function addToken(
        address token,
        uint256 maxPerTx,
        uint256 dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        tokenList.push(token);
        maxWithdrawalPerTx[token] = maxPerTx;
        dailyWithdrawalLimit[token] = dailyLimit;
        emit TokenAdded(token);
    }
    
    /**
     * @notice Remove supported token
     * @param token Token address
     */
    function removeToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(supportedTokens[token], "Token not supported");
        require(token != NATIVE_TOKEN, "Cannot remove native token");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Update withdrawal limits
     * @param token Token address
     * @param maxPerTx Max withdrawal per transaction
     * @param dailyLimit Daily withdrawal limit
     */
    function updateLimits(
        address token,
        uint256 maxPerTx,
        uint256 dailyLimit
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(supportedTokens[token], "Token not supported");
        maxWithdrawalPerTx[token] = maxPerTx;
        dailyWithdrawalLimit[token] = dailyLimit;
    }
    
    /**
     * @notice Get user balance
     * @param user User address
     * @param token Token address
     */
    function getBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }
    
    /**
     * @notice Get all supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @notice Emergency withdraw (admin only)
     * @param token Token address
     * @param amount Amount to withdraw
     * @param to Recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == NATIVE_TOKEN) {
            (bool success, ) = payable(to).call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
    
    /**
     * @notice Emergency pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @notice Receive native tokens
     */
    receive() external payable {
        balances[msg.sender][NATIVE_TOKEN] += msg.value;
        emit Deposit(msg.sender, NATIVE_TOKEN, msg.value);
    }
}

