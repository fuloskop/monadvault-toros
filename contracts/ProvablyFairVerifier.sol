// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ProvablyFairVerifier
 * @notice On-chain verification of provably fair game outcomes
 * @dev All verification functions are pure, allowing anyone to verify results
 */
contract ProvablyFairVerifier {
    
    /**
     * @notice Verify a general game roll
     * @param serverSeed Server seed (revealed after game)
     * @param serverSeedHash Hash of server seed (shown before game)
     * @param clientSeed Client seed chosen by player
     * @param nonce Game nonce
     * @return roll The random roll (0 to 1e18 - 1)
     */
    function verifyRoll(
        string calldata serverSeed,
        bytes32 serverSeedHash,
        string calldata clientSeed,
        uint256 nonce
    ) external pure returns (uint256 roll) {
        // Verify server seed matches hash
        require(
            keccak256(abi.encodePacked(serverSeed)) == serverSeedHash,
            "Server seed mismatch"
        );
        
        // Generate combined hash
        bytes32 combinedHash = keccak256(
            abi.encodePacked(serverSeed, ":", clientSeed, ":", nonce)
        );
        
        // Convert first 8 bytes to roll
        roll = uint256(combinedHash) % 1e18;
        
        return roll;
    }
    
    /**
     * @notice Verify crash game result
     * @param serverSeed Server seed
     * @param publicSeed Public seed (previous game hash for chain verification)
     * @param houseEdge House edge in basis points (e.g., 400 = 4%)
     * @return crashPoint The crash multiplier (scaled by 100, e.g., 150 = 1.50x)
     */
    function verifyCrashPoint(
        string calldata serverSeed,
        bytes32 publicSeed,
        uint256 houseEdge
    ) external pure returns (uint256 crashPoint) {
        bytes32 hash = keccak256(abi.encodePacked(serverSeed, ":", publicSeed));
        uint256 h = uint256(hash);
        
        // 1/33 chance of instant crash
        if (h % 33 == 0) {
            return 100; // 1.00x
        }
        
        // Calculate crash point using standard algorithm
        uint256 e = 2**52;
        uint256 hashMod = h % e;
        
        // Prevent division by zero
        if (hashMod == e) {
            return 100;
        }
        
        uint256 result = (100 * e - hashMod) / (e - hashMod);
        
        // Apply house edge
        result = (result * (10000 - houseEdge)) / 10000;
        
        // Minimum crash point is 1.00x
        if (result < 100) {
            result = 100;
        }
        
        return result;
    }
    
    /**
     * @notice Verify wheel spin result
     * @param serverSeed Server seed
     * @param serverSeedHash Hash of server seed
     * @param clientSeed Client seed
     * @param nonce Game nonce
     * @param totalSegments Total number of wheel segments
     * @return segment The landing segment (0 to totalSegments - 1)
     */
    function verifyWheelSpin(
        string calldata serverSeed,
        bytes32 serverSeedHash,
        string calldata clientSeed,
        uint256 nonce,
        uint256 totalSegments
    ) external pure returns (uint256 segment) {
        require(
            keccak256(abi.encodePacked(serverSeed)) == serverSeedHash,
            "Server seed mismatch"
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(serverSeed, ":", clientSeed, ":", nonce)
        );
        
        segment = uint256(hash) % totalSegments;
        return segment;
    }
    
    /**
     * @notice Verify mines game board
     * @param serverSeed Server seed
     * @param clientSeed Client seed
     * @param nonce Game nonce
     * @param mineCount Number of mines
     * @return minePositions Array of mine positions (0-24)
     */
    function verifyMines(
        string calldata serverSeed,
        string calldata clientSeed,
        uint256 nonce,
        uint256 mineCount
    ) external pure returns (uint256[] memory minePositions) {
        require(mineCount > 0 && mineCount < 25, "Invalid mine count");
        
        minePositions = new uint256[](mineCount);
        bool[25] memory used;
        uint256 minesPlaced = 0;
        uint256 iteration = 0;
        
        while (minesPlaced < mineCount && iteration < 1000) {
            bytes32 hash = keccak256(
                abi.encodePacked(serverSeed, ":", clientSeed, ":", nonce, ":mines:", iteration)
            );
            uint256 position = uint256(hash) % 25;
            
            if (!used[position]) {
                used[position] = true;
                minePositions[minesPlaced] = position;
                minesPlaced++;
            }
            iteration++;
        }
        
        return minePositions;
    }
    
    /**
     * @notice Verify upgrader result
     * @param serverSeed Server seed
     * @param serverSeedHash Hash of server seed
     * @param clientSeed Client seed
     * @param nonce Game nonce
     * @param winChanceBps Win chance in basis points (e.g., 5000 = 50%)
     * @return isWin Whether the upgrade was successful
     * @return roll The random roll
     */
    function verifyUpgrader(
        string calldata serverSeed,
        bytes32 serverSeedHash,
        string calldata clientSeed,
        uint256 nonce,
        uint256 winChanceBps
    ) external pure returns (bool isWin, uint256 roll) {
        require(
            keccak256(abi.encodePacked(serverSeed)) == serverSeedHash,
            "Server seed mismatch"
        );
        require(winChanceBps <= 10000, "Invalid win chance");
        
        bytes32 hash = keccak256(
            abi.encodePacked(serverSeed, ":", clientSeed, ":", nonce)
        );
        
        roll = uint256(hash) % 10000;
        isWin = roll < winChanceBps;
        
        return (isWin, roll);
    }
    
    /**
     * @notice Calculate hash of server seed
     * @param serverSeed Server seed to hash
     * @return hash SHA256 hash of the server seed
     */
    function hashServerSeed(string calldata serverSeed) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(serverSeed));
    }
    
    /**
     * @notice Generate a combined hash for verification
     * @param serverSeed Server seed
     * @param clientSeed Client seed
     * @param nonce Nonce
     * @return hash Combined hash
     */
    function getCombinedHash(
        string calldata serverSeed,
        string calldata clientSeed,
        uint256 nonce
    ) external pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(serverSeed, ":", clientSeed, ":", nonce)
        );
    }
}

