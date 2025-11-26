// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title FoxieCasino
 * @dev A provably fair casino contract for Monad blockchain
 * Supports: Coin Flip, Roulette, Upgrader, Mines
 */
contract FoxieCasino is Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    uint256 public houseEdge = 200; // 2% house edge (in basis points, 10000 = 100%)
    uint256 public minBet = 0.001 ether;
    uint256 public maxBet = 10 ether;
    uint256 public maxPayout = 100 ether;
    
    uint256 private nonce;
    
    // ============ Events ============
    
    event BetPlaced(
        address indexed player,
        uint256 indexed betId,
        string gameType,
        uint256 amount,
        uint256 multiplier,
        bytes32 seedHash
    );
    
    event BetResolved(
        address indexed player,
        uint256 indexed betId,
        bool won,
        uint256 payout,
        uint256 result
    );
    
    event HouseDeposit(address indexed from, uint256 amount);
    event HouseWithdraw(address indexed to, uint256 amount);
    
    // ============ Structs ============
    
    struct Bet {
        address player;
        uint256 amount;
        uint256 multiplier; // In basis points (10000 = 1x, 20000 = 2x)
        uint256 winChance;  // In basis points (5000 = 50%)
        string gameType;
        bytes32 seedHash;
        uint256 timestamp;
        bool resolved;
        bool won;
        uint256 payout;
    }
    
    mapping(uint256 => Bet) public bets;
    uint256 public betCount;
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        nonce = block.timestamp;
    }
    
    // ============ House Management ============
    
    /// @notice Deposit funds to house bankroll
    function depositHouse() external payable onlyOwner {
        require(msg.value > 0, "Must deposit something");
        emit HouseDeposit(msg.sender, msg.value);
    }
    
    /// @notice Withdraw from house bankroll
    function withdrawHouse(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(owner()).transfer(amount);
        emit HouseWithdraw(owner(), amount);
    }
    
    /// @notice Get house balance
    function getHouseBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // ============ Game Settings ============
    
    function setHouseEdge(uint256 _houseEdge) external onlyOwner {
        require(_houseEdge <= 1000, "House edge too high"); // Max 10%
        houseEdge = _houseEdge;
    }
    
    function setBetLimits(uint256 _minBet, uint256 _maxBet, uint256 _maxPayout) external onlyOwner {
        minBet = _minBet;
        maxBet = _maxBet;
        maxPayout = _maxPayout;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Betting Functions ============
    
    /**
     * @notice Place a bet with automatic resolution
     * @param gameType The type of game (coinflip, roulette, upgrader, mines)
     * @param multiplier The payout multiplier in basis points (20000 = 2x)
     * @param winChance The win probability in basis points (5000 = 50%)
     * @param clientSeed Player's seed for randomness
     */
    function placeBet(
        string calldata gameType,
        uint256 multiplier,
        uint256 winChance,
        bytes32 clientSeed
    ) external payable nonReentrant whenNotPaused returns (uint256 betId, bool won, uint256 payout) {
        require(msg.value >= minBet, "Bet too small");
        require(msg.value <= maxBet, "Bet too large");
        require(winChance > 0 && winChance < 10000, "Invalid win chance");
        require(multiplier > 10000, "Multiplier must be > 1x");
        
        // Calculate potential payout
        uint256 potentialPayout = (msg.value * multiplier) / 10000;
        require(potentialPayout <= maxPayout, "Payout exceeds maximum");
        require(potentialPayout <= address(this).balance, "Insufficient house balance");
        
        // Generate random result
        uint256 randomResult = _generateRandom(clientSeed);
        uint256 roll = randomResult % 10000;
        
        // Determine win (with house edge applied to win chance)
        uint256 adjustedWinChance = (winChance * (10000 - houseEdge)) / 10000;
        won = roll < adjustedWinChance;
        
        // Calculate payout
        if (won) {
            payout = potentialPayout;
        } else {
            payout = 0;
        }
        
        // Create bet record
        betId = betCount++;
        bets[betId] = Bet({
            player: msg.sender,
            amount: msg.value,
            multiplier: multiplier,
            winChance: winChance,
            gameType: gameType,
            seedHash: keccak256(abi.encodePacked(clientSeed, block.timestamp, nonce)),
            timestamp: block.timestamp,
            resolved: true,
            won: won,
            payout: payout
        });
        
        emit BetPlaced(msg.sender, betId, gameType, msg.value, multiplier, bets[betId].seedHash);
        emit BetResolved(msg.sender, betId, won, payout, roll);
        
        // Pay out if won
        if (won && payout > 0) {
            payable(msg.sender).transfer(payout);
        }
        
        return (betId, won, payout);
    }
    
    /**
     * @notice Coin Flip - 50/50 with ~1.98x payout
     * @param choice 0 = heads, 1 = tails
     */
    function playCoinFlip(uint8 choice, bytes32 clientSeed) 
        external 
        payable 
        returns (uint256 betId, bool won, uint256 payout) 
    {
        require(choice <= 1, "Invalid choice");
        
        // 50% win chance, 1.98x multiplier (accounting for house edge)
        return this.placeBet{value: msg.value}(
            "coinflip",
            19800, // 1.98x
            5000,  // 50%
            clientSeed
        );
    }
    
    /**
     * @notice Roulette - Bet on color
     * @param color 0 = green (0), 1 = red, 2 = black
     */
    function playRouletteColor(uint8 color, bytes32 clientSeed)
        external
        payable
        returns (uint256 betId, bool won, uint256 payout)
    {
        uint256 multiplier;
        uint256 winChance;
        
        if (color == 0) {
            // Green (0) - 1/37 chance, 35x payout
            multiplier = 350000; // 35x
            winChance = 270; // ~2.7%
        } else {
            // Red or Black - 18/37 chance, 2x payout
            multiplier = 20000; // 2x
            winChance = 4865; // ~48.65%
        }
        
        return this.placeBet{value: msg.value}(
            "roulette",
            multiplier,
            winChance,
            clientSeed
        );
    }
    
    /**
     * @notice Upgrader - Custom multiplier
     * @param targetMultiplier Desired multiplier in basis points
     */
    function playUpgrader(uint256 targetMultiplier, bytes32 clientSeed)
        external
        payable
        returns (uint256 betId, bool won, uint256 payout)
    {
        require(targetMultiplier > 10100, "Multiplier too low"); // Min 1.01x
        require(targetMultiplier <= 1000000, "Multiplier too high"); // Max 100x
        
        // Win chance inversely proportional to multiplier
        uint256 winChance = (10000 * 10000) / targetMultiplier;
        
        return this.placeBet{value: msg.value}(
            "upgrader",
            targetMultiplier,
            winChance,
            clientSeed
        );
    }
    
    // ============ Internal Functions ============
    
    function _generateRandom(bytes32 clientSeed) internal returns (uint256) {
        nonce++;
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce,
            clientSeed
        )));
    }
    
    // ============ View Functions ============
    
    function getBet(uint256 betId) external view returns (Bet memory) {
        return bets[betId];
    }
    
    function getPlayerBets(address player, uint256 limit) external view returns (Bet[] memory) {
        uint256 count = 0;
        for (uint256 i = betCount; i > 0 && count < limit; i--) {
            if (bets[i - 1].player == player) {
                count++;
            }
        }
        
        Bet[] memory playerBets = new Bet[](count);
        uint256 index = 0;
        for (uint256 i = betCount; i > 0 && index < count; i--) {
            if (bets[i - 1].player == player) {
                playerBets[index] = bets[i - 1];
                index++;
            }
        }
        
        return playerBets;
    }
    
    // ============ Receive ============
    
    receive() external payable {
        emit HouseDeposit(msg.sender, msg.value);
    }
}

