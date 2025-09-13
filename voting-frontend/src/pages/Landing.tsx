import React, { useState, useEffect } from 'react';
import { useWeb3Context } from '../contexts/Web3Context';
import { Stage, ElectionStats } from '../types';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Landing: React.FC = () => {
  const { account, isConnected, contract, connectWallet } = useWeb3Context();
  const [stats, setStats] = useState<ElectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (contract) {
        try {
          const [candidateCount, voterCount, totalCommits, totalRevealed, currentStage] = await contract.getElectionStats();
          setStats({
            candidateCount: Number(candidateCount),
            voterCount: Number(voterCount),
            totalCommits: Number(totalCommits),
            totalRevealed: Number(totalRevealed),
            currentStage: Number(currentStage) as Stage,
          });
        } catch (error) {
          console.error('Error fetching stats:', error);
          toast.error('Failed to fetch election statistics');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchStats();
  }, [contract]);

  const getStageText = (stage: Stage) => {
    switch (stage) {
      case Stage.Setup:
        return 'Setup Phase';
      case Stage.Commit:
        return 'Commit Phase';
      case Stage.Reveal:
        return 'Reveal Phase';
      case Stage.Finished:
        return 'Election Finished';
      default:
        return 'Unknown';
    }
  };

  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case Stage.Setup:
        return 'text-blue-400';
      case Stage.Commit:
        return 'text-yellow-400';
      case Stage.Reveal:
        return 'text-purple-400';
      case Stage.Finished:
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Decentralized Voting System
          </h1>
          <p className="text-2xl text-gray-300 mb-8">
            Transparent. Secure. Tamper-Proof.
          </p>
          
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 inline-block">
              <p className="text-white text-lg mb-2">Connected as:</p>
              <p className="text-blue-400 font-mono text-sm">{account}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {stats.candidateCount}
              </div>
              <div className="text-gray-300">Candidates</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {stats.voterCount}
              </div>
              <div className="text-gray-300">Registered Voters</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {stats.totalCommits}
              </div>
              <div className="text-gray-300">Votes Committed</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {stats.totalRevealed}
              </div>
              <div className="text-gray-300">Votes Revealed</div>
            </div>
          </div>
        ) : null}

        {/* Current Phase */}
        {stats && (
          <div className="text-center mb-16">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 inline-block">
              <h2 className="text-2xl font-bold text-white mb-4">Current Phase</h2>
              <div className={`text-4xl font-bold ${getStageColor(stats.currentStage)} mb-2`}>
                {getStageText(stats.currentStage)}
              </div>
              <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((stats.currentStage + 1) / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-4">Commit-Reveal</h3>
            <p className="text-gray-300">
              Votes are committed with cryptographic hashes, ensuring privacy during voting
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-4">Transparent</h3>
            <p className="text-gray-300">
              All voting data is stored on the blockchain, providing complete transparency
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-white mb-4">Tamper-Proof</h3>
            <p className="text-gray-300">
              Immutable blockchain technology prevents vote manipulation and fraud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
