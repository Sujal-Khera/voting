import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3ContextType, Stage } from '../types';
import contractABI from '../utils/contractABI.json';

const CONTRACT_ADDRESS = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6';
const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';
const HARDHAT_CHAIN_ID = 31337;

export const useWeb3 = (): Web3ContextType => {
  const [account, setAccount] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [contract, setContract] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);

  const connectWallet = useCallback(async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });

        if (accounts.length > 0) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const web3Contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            contractABI,
            web3Signer
          );

          // Check if we're on the correct network
          const network = await web3Provider.getNetwork();
          if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
            // Switch to Hardhat network
            try {
              await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${HARDHAT_CHAIN_ID.toString(16)}` }],
              });
            } catch (switchError: any) {
              // If the network doesn't exist, add it
              if (switchError.code === 4902) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: `0x${HARDHAT_CHAIN_ID.toString(16)}`,
                      chainName: 'Hardhat Local',
                      rpcUrls: [HARDHAT_RPC_URL],
                      nativeCurrency: {
                        name: 'ETH',
                        symbol: 'ETH',
                        decimals: 18,
                      },
                    },
                  ],
                });
              } else {
                throw switchError;
              }
            }
          }

          // Get the admin address
          const adminAddress = await web3Contract.admin();
          const isUserAdmin = accounts[0].toLowerCase() === adminAddress.toLowerCase();

          setAccount(accounts[0]);
          setIsAdmin(isUserAdmin);
          setIsConnected(true);
          setProvider(web3Provider);
          setSigner(web3Signer);
          setContract(web3Contract);
        }
      } else {
        throw new Error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setIsAdmin(false);
    setIsConnected(false);
    setContract(null);
    setProvider(null);
    setSigner(null);
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });

          if (accounts.length > 0) {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const web3Contract = new ethers.Contract(
              CONTRACT_ADDRESS,
              contractABI,
              web3Signer
            );

            const adminAddress = await web3Contract.admin();
            const isUserAdmin = accounts[0].toLowerCase() === adminAddress.toLowerCase();

            setAccount(accounts[0]);
            setIsAdmin(isUserAdmin);
            setIsConnected(true);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setContract(web3Contract);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', () => {
          window.location.reload();
        });
      }
    };
  }, [connectWallet, disconnectWallet]);

  return {
    account,
    isAdmin,
    isConnected,
    contract,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
  };
};
