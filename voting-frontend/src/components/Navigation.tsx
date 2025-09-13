import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3Context } from '../contexts/Web3Context';

const Navigation: React.FC = () => {
  const { account, isConnected, isAdmin, disconnectWallet } = useWeb3Context();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-xl font-bold text-white">VoteChain</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                isActive('/') 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </Link>
            
            {isConnected && (
              <>
                <Link
                  to="/voter"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive('/voter') 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Vote
                </Link>
                
                <Link
                  to="/results"
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive('/results') 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Results
                </Link>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive('/admin') 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-300">Connected:</span>
                  <span className="text-sm text-blue-400 font-mono ml-2">
                    {account ? formatAddress(account) : ''}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/30"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                Connect your wallet to vote
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
