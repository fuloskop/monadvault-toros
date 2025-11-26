import { parseEther, formatEther } from 'viem';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback } from 'react';

// Contract address - UPDATE THIS after deployment
export const CASINO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CASINO_CONTRACT as `0x${string}` || '0x0000000000000000000000000000000000000000';

// Contract ABI (simplified for the functions we need)
export const CASINO_ABI = [
  {
    name: 'placeBet',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'gameType', type: 'string' },
      { name: 'multiplier', type: 'uint256' },
      { name: 'winChance', type: 'uint256' },
      { name: 'clientSeed', type: 'bytes32' },
    ],
    outputs: [
      { name: 'betId', type: 'uint256' },
      { name: 'won', type: 'bool' },
      { name: 'payout', type: 'uint256' },
    ],
  },
  {
    name: 'playCoinFlip',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'choice', type: 'uint8' },
      { name: 'clientSeed', type: 'bytes32' },
    ],
    outputs: [
      { name: 'betId', type: 'uint256' },
      { name: 'won', type: 'bool' },
      { name: 'payout', type: 'uint256' },
    ],
  },
  {
    name: 'playRouletteColor',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'color', type: 'uint8' },
      { name: 'clientSeed', type: 'bytes32' },
    ],
    outputs: [
      { name: 'betId', type: 'uint256' },
      { name: 'won', type: 'bool' },
      { name: 'payout', type: 'uint256' },
    ],
  },
  {
    name: 'playUpgrader',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'targetMultiplier', type: 'uint256' },
      { name: 'clientSeed', type: 'bytes32' },
    ],
    outputs: [
      { name: 'betId', type: 'uint256' },
      { name: 'won', type: 'bool' },
      { name: 'payout', type: 'uint256' },
    ],
  },
  {
    name: 'getHouseBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'maxBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'houseEdge',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getBet',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'betId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'player', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'multiplier', type: 'uint256' },
          { name: 'winChance', type: 'uint256' },
          { name: 'gameType', type: 'string' },
          { name: 'seedHash', type: 'bytes32' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'won', type: 'bool' },
          { name: 'payout', type: 'uint256' },
        ],
      },
    ],
  },
  // Events
  {
    name: 'BetPlaced',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'betId', type: 'uint256', indexed: true },
      { name: 'gameType', type: 'string', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'multiplier', type: 'uint256', indexed: false },
      { name: 'seedHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    name: 'BetResolved',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'betId', type: 'uint256', indexed: true },
      { name: 'won', type: 'bool', indexed: false },
      { name: 'payout', type: 'uint256', indexed: false },
      { name: 'result', type: 'uint256', indexed: false },
    ],
  },
] as const;

// Generate a random client seed
export function generateClientSeed(): `0x${string}` {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `0x${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
}

// Hook for using the casino contract
export function useCasino() {
  const { writeContractAsync } = useWriteContract();
  
  const { data: houseBalance } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'getHouseBalance',
  });
  
  const { data: minBet } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'minBet',
  });
  
  const { data: maxBet } = useReadContract({
    address: CASINO_CONTRACT_ADDRESS,
    abi: CASINO_ABI,
    functionName: 'maxBet',
  });

  const playCoinFlip = useCallback(async (choice: 0 | 1, betAmount: string) => {
    const clientSeed = generateClientSeed();
    
    const hash = await writeContractAsync({
      address: CASINO_CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'playCoinFlip',
      args: [choice, clientSeed],
      value: parseEther(betAmount),
    });
    
    return hash;
  }, [writeContractAsync]);

  const playRoulette = useCallback(async (color: 0 | 1 | 2, betAmount: string) => {
    const clientSeed = generateClientSeed();
    
    const hash = await writeContractAsync({
      address: CASINO_CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'playRouletteColor',
      args: [color, clientSeed],
      value: parseEther(betAmount),
    });
    
    return hash;
  }, [writeContractAsync]);

  const playUpgrader = useCallback(async (multiplier: number, betAmount: string) => {
    const clientSeed = generateClientSeed();
    // Convert multiplier to basis points (2x = 20000)
    const multiplierBasisPoints = BigInt(Math.floor(multiplier * 10000));
    
    const hash = await writeContractAsync({
      address: CASINO_CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'playUpgrader',
      args: [multiplierBasisPoints, clientSeed],
      value: parseEther(betAmount),
    });
    
    return hash;
  }, [writeContractAsync]);

  const placeBet = useCallback(async (
    gameType: string,
    multiplier: number,
    winChance: number,
    betAmount: string
  ) => {
    const clientSeed = generateClientSeed();
    const multiplierBasisPoints = BigInt(Math.floor(multiplier * 10000));
    const winChanceBasisPoints = BigInt(Math.floor(winChance * 10000));
    
    const hash = await writeContractAsync({
      address: CASINO_CONTRACT_ADDRESS,
      abi: CASINO_ABI,
      functionName: 'placeBet',
      args: [gameType, multiplierBasisPoints, winChanceBasisPoints, clientSeed],
      value: parseEther(betAmount),
    });
    
    return hash;
  }, [writeContractAsync]);

  return {
    houseBalance: houseBalance ? formatEther(houseBalance) : '0',
    minBet: minBet ? formatEther(minBet) : '0.001',
    maxBet: maxBet ? formatEther(maxBet) : '10',
    playCoinFlip,
    playRoulette,
    playUpgrader,
    placeBet,
    contractAddress: CASINO_CONTRACT_ADDRESS,
  };
}

// Check if contract is deployed (address is not zero)
export function isContractDeployed(): boolean {
  return CASINO_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
}

