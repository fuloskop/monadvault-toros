import { ethers } from 'ethers';

// Monad RPC configuration
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || 'https://testnet.monad.xyz/v1';
const MONAD_CHAIN_ID = parseInt(process.env.MONAD_CHAIN_ID || '10143');

// Provider
export const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL, {
  chainId: MONAD_CHAIN_ID,
  name: 'monad-testnet',
});

// Hot wallet for withdrawals
const HOT_WALLET_PRIVATE_KEY = process.env.HOT_WALLET_PRIVATE_KEY;

// Only create wallet if we have a valid private key (not placeholder zeros)
function createHotWallet() {
  if (!HOT_WALLET_PRIVATE_KEY) return null;
  // Check if it's a placeholder value (all zeros)
  if (/^0x0+$/.test(HOT_WALLET_PRIVATE_KEY)) {
    console.warn('⚠️  HOT_WALLET_PRIVATE_KEY is not configured - withdrawals disabled');
    return null;
  }
  try {
    return new ethers.Wallet(HOT_WALLET_PRIVATE_KEY, provider);
  } catch (error) {
    console.warn('⚠️  Invalid HOT_WALLET_PRIVATE_KEY - withdrawals disabled');
    return null;
  }
}

export const hotWallet = createHotWallet();

// Contract addresses
export const CONTRACTS = {
  VAULT: process.env.VAULT_CONTRACT_ADDRESS || '',
  VERIFIER: process.env.VERIFIER_CONTRACT_ADDRESS || '',
};

// Contract ABIs (simplified for key functions)
export const VAULT_ABI = [
  'function depositNative() external payable',
  'function depositToken(address token, uint256 amount) external',
  'function requestWithdrawal(address token, uint256 amount) external',
  'function getBalance(address user, address token) external view returns (uint256)',
  'event Deposit(address indexed user, address indexed token, uint256 amount)',
  'event Withdrawal(address indexed user, address indexed token, uint256 amount)',
];

export const VERIFIER_ABI = [
  'function verifyRoll(string serverSeed, bytes32 serverSeedHash, string clientSeed, uint256 nonce) external pure returns (uint256)',
  'function verifyCrashPoint(string serverSeed, bytes32 publicSeed, uint256 houseEdge) external pure returns (uint256)',
  'function hashServerSeed(string serverSeed) external pure returns (bytes32)',
];

// Get vault contract instance
export function getVaultContract(signer?: ethers.Signer) {
  if (!CONTRACTS.VAULT) {
    throw new Error('Vault contract address not configured');
  }
  return new ethers.Contract(
    CONTRACTS.VAULT,
    VAULT_ABI,
    signer || provider
  );
}

// Get verifier contract instance
export function getVerifierContract() {
  if (!CONTRACTS.VERIFIER) {
    throw new Error('Verifier contract address not configured');
  }
  return new ethers.Contract(
    CONTRACTS.VERIFIER,
    VERIFIER_ABI,
    provider
  );
}

// Native token address constant
export const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000';

// Supported currencies
export const SUPPORTED_CURRENCIES = ['MON', 'USDC'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Token addresses (MON is native, address(0))
export const TOKEN_ADDRESSES: Record<SupportedCurrency, string> = {
  MON: NATIVE_TOKEN,
  USDC: '0x0000000000000000000000000000000000000000', // Replace with actual USDC address on Monad
};

