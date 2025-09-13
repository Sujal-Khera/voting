import React, { useState, useEffect } from 'react';
import { useWeb3Context } from '../contexts/Web3Context';
import { Stage, Candidate, ElectionStats } from '../types';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Admin: React.FC = () => {
  const { account, isAdmin, contract } = useWeb3Context();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<ElectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newVoterAddress, setNewVoterAddress] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isRegisteringVoter, setIsRegisteringVoter] = useState(false);
  const [isAdvancingStage, setIsAdvancingStage] = useState(false);
  const [isResettingElection, setIsResettingElection] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      if (contract) {
        try {
          const [candidateCount, voterCount, totalCommits, totalRevealed, currentStage] = await contract.getElectionStats();
          const allCandidates = await contract.getAllCandidates();
          
          setStats({
            candidateCount: Number(candidateCount),
            voterCount: Number(voterCount),
            totalCommits: Number(totalCommits),
            totalRevealed: Number(totalRevealed),
            currentStage: Number(currentStage) as Stage,
          });

          setCandidates(allCandidates.map((c: any) => ({
            id: Number(c.id),
            name: c.name,
            voteCount: Number(c.voteCount),
          })));
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to fetch election data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [contract, isAdmin]);

  const addCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newCandidateName.trim()) return;

    setIsAddingCandidate(true);
    try {
      const tx = await contract.addCandidate(newCandidateName.trim());
      await tx.wait();
      toast.success('Candidate added successfully!');
      setNewCandidateName('');
      
      // Refresh data
      const allCandidates = await contract.getAllCandidates();
      setCandidates(allCandidates.map((c: any) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
      })));
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      toast.error(error.message || 'Failed to add candidate');
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const registerVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !newVoterAddress.trim()) return;

    setIsRegisteringVoter(true);
    try {
      const tx = await contract.registerVoter(newVoterAddress.trim());
      await tx.wait();
      toast.success('Voter registered successfully!');
      setNewVoterAddress('');
      
      // Refresh stats
      const [candidateCount, voterCount, totalCommits, totalRevealed, currentStage] = await contract.getElectionStats();
      setStats({
        candidateCount: Number(candidateCount),
        voterCount: Number(voterCount),
        totalCommits: Number(totalCommits),
        totalRevealed: Number(totalRevealed),
        currentStage: Number(currentStage) as Stage,
      });
    } catch (error: any) {
      console.error('Error registering voter:', error);
      toast.error(error.message || 'Failed to register voter');
    } finally {
      setIsRegisteringVoter(false);
    }
  };

  const advanceStage = async () => {
    if (!contract) return;

    setIsAdvancingStage(true);
    try {
      const tx = await contract.advanceStage();
      await tx.wait();
      toast.success('Stage advanced successfully!');
      
      // Refresh stats
      const [candidateCount, voterCount, totalCommits, totalRevealed, currentStage] = await contract.getElectionStats();
      setStats({
        candidateCount: Number(candidateCount),
        voterCount: Number(voterCount),
        totalCommits: Number(totalCommits),
        totalRevealed: Number(totalRevealed),
        currentStage: Number(currentStage) as Stage,
      });
    } catch (error: any) {
      console.error('Error advancing stage:', error);
      toast.error(error.message || 'Failed to advance stage');
    } finally {
      setIsAdvancingStage(false);
    }
  };

  const resetElection = async () => {
    if (!contract) return;

    // Confirm before resetting
    const confirmed = window.confirm(
      'Are you sure you want to reset the election? This will:\n\n' +
      '• Clear all candidates\n' +
      '• Clear all voter registrations\n' +
      '• Reset all vote counts\n' +
      '• Start a new election from Setup phase\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    setIsResettingElection(true);
    try {
      const tx = await contract.resetElection();
      await tx.wait();
      toast.success('Election reset successfully! Starting new election...');
      
      // Refresh all data
      const [candidateCount, voterCount, totalCommits, totalRevealed, currentStage] = await contract.getElectionStats();
      const allCandidates = await contract.getAllCandidates();
      
      setStats({
        candidateCount: Number(candidateCount),
        voterCount: Number(voterCount),
        totalCommits: Number(totalCommits),
        totalRevealed: Number(totalRevealed),
        currentStage: Number(currentStage) as Stage,
      });

      setCandidates(allCandidates.map((c: any) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
      })));
    } catch (error: any) {
      console.error('Error resetting election:', error);
      toast.error(error.message || 'Failed to reset election');
    } finally {
      setIsResettingElection(false);
    }
  };

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

  const getNextStageText = (stage: Stage) => {
    switch (stage) {
      case Stage.Setup:
        return 'Start Commit Phase';
      case Stage.Commit:
        return 'Start Reveal Phase';
      case Stage.Reveal:
        return 'Finish Election';
      case Stage.Finished:
        return 'Election Complete';
      default:
        return 'Unknown';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Admin Panel</h1>
          <p className="text-xl text-gray-300">Manage the decentralized voting system</p>
        </div>

        {/* Current Status */}
        {stats && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Current Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{stats.candidateCount}</div>
                <div className="text-gray-300">Candidates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{stats.voterCount}</div>
                <div className="text-gray-300">Registered Voters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.totalCommits}</div>
                <div className="text-gray-300">Votes Committed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{stats.totalRevealed}</div>
                <div className="text-gray-300">Votes Revealed</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <div className="text-xl font-semibold text-white mb-4">
                Current Phase: <span className="text-blue-400">{getStageText(stats.currentStage)}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {stats.currentStage !== Stage.Finished && (
                  <button
                    onClick={advanceStage}
                    disabled={isAdvancingStage}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    {isAdvancingStage ? 'Advancing...' : getNextStageText(stats.currentStage)}
                  </button>
                )}
                {stats.currentStage === Stage.Finished && (
                  <button
                    onClick={resetElection}
                    disabled={isResettingElection}
                    className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    {isResettingElection ? 'Resetting...' : '🔄 Start New Election'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Candidate */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Add Candidate</h2>
            <form onSubmit={addCandidate} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Candidate Name</label>
                <input
                  type="text"
                  value={newCandidateName}
                  onChange={(e) => setNewCandidateName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter candidate name"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isAddingCandidate || stats?.currentStage !== Stage.Setup}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isAddingCandidate ? 'Adding...' : 'Add Candidate'}
              </button>
            </form>
          </div>

          {/* Register Voter */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Register Voter</h2>
            <form onSubmit={registerVoter} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Ethereum Address</label>
                <input
                  type="text"
                  value={newVoterAddress}
                  onChange={(e) => setNewVoterAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0x..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isRegisteringVoter || stats?.currentStage !== Stage.Setup}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isRegisteringVoter ? 'Registering...' : 'Register Voter'}
              </button>
            </form>
          </div>
        </div>

        {/* Winner Section - Only show when election is finished */}
        {stats && stats.currentStage === Stage.Finished && candidates.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">🏆 Election Results</h2>
              <div className="text-center">
                {(() => {
                  const winner = candidates.reduce((prev, current) => 
                    (current.voteCount > prev.voteCount) ? current : prev
                  );
                  return (
                    <div>
                      <div className="text-4xl font-bold text-yellow-400 mb-2">
                        {winner.name}
                      </div>
                      <div className="text-xl text-gray-300 mb-4">
                        Winner with {winner.voteCount} votes
                      </div>
                      <div className="text-sm text-gray-400">
                        Election completed successfully!
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Candidates List */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Candidates</h2>
            {candidates.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No candidates added yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
                        <p className="text-sm text-gray-400">ID: {candidate.id}</p>
                        <p className="text-sm text-green-400">Votes: {candidate.voteCount}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
