import React, { useState } from 'react';
import { ethers } from 'ethers';
import contractABI from '../utils/contractABI.json';
import contractInfo from '../contract-address.json';

const ConnectionTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsConnecting(true);
    addLog('Starting connection test...');
    
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        addLog('❌ MetaMask is not installed');
        return;
      }
      addLog('✅ MetaMask is installed');

      // Try to connect to Hardhat node directly
      try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
        const blockNumber = await provider.getBlockNumber();
        addLog(`✅ Connected to Hardhat node. Block number: ${blockNumber}`);
      } catch (error: any) {
        addLog(`❌ Failed to connect to Hardhat node: ${error.message}`);
      }

      // Request account access
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        if (accounts.length === 0) {
          addLog('❌ No accounts found');
        } else {
          addLog(`✅ Connected to account: ${accounts[0]}`);
        }
      } catch (error: any) {
        addLog(`❌ Failed to connect account: ${error.message}`);
      }

      // Check network
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        addLog(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        
        // Check if we're on Hardhat network
        if (Number(network.chainId) !== 31337) {
          addLog(`❌ Wrong network. Expected Chain ID: 31337, Got: ${network.chainId}`);
          addLog('Try switching to Hardhat network in MetaMask');
        } else {
          addLog('✅ Connected to correct Hardhat network');
        }
      } catch (error: any) {
        addLog(`❌ Failed to get network: ${error.message}`);
      }

      // Try to connect to contract
      try {
        addLog(`Attempting to connect to contract at: ${contractInfo.address}`);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractInfo.address,
          contractABI,
          signer
        );
        
        // Test a simple view function
        try {
          const admin = await contract.admin();
          addLog(`✅ Contract connected! Admin address: ${admin}`);
        } catch (error: any) {
          addLog(`❌ Failed to call contract method: ${error.message}`);
        }
      } catch (error: any) {
        addLog(`❌ Failed to connect to contract: ${error.message}`);
      }

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsConnecting(false);
      addLog('Connection test completed');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Blockchain Connection Test</h1>
      
      <button
        onClick={testConnection}
        disabled={isConnecting}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-6 disabled:opacity-50"
      >
        {isConnecting ? 'Testing...' : 'Test Connection'}
      </button>
      
      <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm">
        <h2 className="text-xl font-bold mb-2 text-white">Connection Logs</h2>
        <div className="h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400">Click the button to start testing...</p>
          ) : (
            <ul className="space-y-1">
              {logs.map((log, index) => (
                <li key={index} className="text-gray-300">{log}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;