import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3Context } from '../contexts/Web3Context';
import { Stage, Candidate, VoterStatus } from '../types';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import CandidateCard from '../components/CandidateCard';

const Voter: React.FC = () => {
  const { account, contract } = useWeb3Context();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voterStatus, setVoterStatus] = useState<VoterStatus | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage>(Stage.Setup);
  const [loading, setLoading] = useState(true);
  
  // Commit phase state
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  
  // Reveal phase state
  const [revealCandidateId, setRevealCandidateId] = useState('');
  const [revealSecretPhrase, setRevealSecretPhrase] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);

  const refreshAllData = useCallback(async () => {
    if (contract && account) {
      try {
        const [candidateCount, voterCount, totalCommits, totalRevealed, stage] = await contract.getElectionStats();
        const allCandidates = await contract.getAllCandidates();
        
        setCurrentStage(Number(stage) as Stage);
        setCandidates(allCandidates.map((c: any) => ({
          id: Number(c.id),
          name: c.name,
          voteCount: Number(c.voteCount),
        })));

        // Check voter status
        const [isRegistered, hasCommitted, hasRevealed] = await Promise.all([
          contract.isVoterRegistered(account),
          contract.hasVoterCommitted(account),
          contract.hasVoterRevealed(account),
        ]);

        setVoterStatus({
          isRegistered: isRegistered,
          hasCommitted: hasCommitted,
          hasRevealed: hasRevealed,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch election data');
      }
    }
  }, [contract, account]);

  useEffect(() => {
    const fetchData = async () => {
      if (contract && account) {
        try {
          await refreshAllData();
        } catch (error) {
          console.error('Error fetching data:', error);
          toast.error('Failed to fetch election data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [contract, account, refreshAllData]);

  // Refresh data every 10 seconds to keep it up to date
  useEffect(() => {
    if (contract && account) {
      const interval = setInterval(refreshAllData, 10000);
      return () => clearInterval(interval);
    }
  }, [contract, account, refreshAllData]);

  const generateCommitHash = async (candidateId: number, secret: string) => {
    if (!contract) return null;
    
    try {
      // Convert secret string to a number by hashing it
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secret));
      const secretNumber = BigInt(secretHash);
      
      const hash = await contract.generateCommitHash(BigInt(candidateId), secretNumber);
      return hash;
    } catch (error) {
      console.error('Error generating commit hash:', error);
      return null;
    }
  };

  const commitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !selectedCandidate || !secretPhrase.trim()) return;

    setIsCommitting(true);
    try {
      const hash = await generateCommitHash(selectedCandidate, secretPhrase.trim());
      if (!hash) {
        throw new Error('Failed to generate commit hash');
      }

      const tx = await contract.commitVote(hash);
      await tx.wait();
      
      toast.success('Vote committed successfully!');
      setSelectedCandidate(null);
      setSecretPhrase('');
      
      // Refresh voter status from blockchain
      if (account) {
        const [isRegistered, hasCommitted, hasRevealed] = await Promise.all([
          contract.isVoterRegistered(account),
          contract.hasVoterCommitted(account),
          contract.hasVoterRevealed(account),
        ]);

        setVoterStatus({
          isRegistered: isRegistered,
          hasCommitted: hasCommitted,
          hasRevealed: hasRevealed,
        });
      }
    } catch (error: any) {
      console.error('Error committing vote:', error);
      toast.error(error.message || 'Failed to commit vote');
    } finally {
      setIsCommitting(false);
    }
  };

  const revealVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !revealCandidateId || !revealSecretPhrase.trim()) return;

    setIsRevealing(true);
    try {
      // Convert secret string to a number by hashing it (same as commit)
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes(revealSecretPhrase.trim()));
      const secretNumber = BigInt(secretHash);
      
      const tx = await contract.revealVote(
        BigInt(parseInt(revealCandidateId)),
        secretNumber
      );
      await tx.wait();
      
      toast.success('Vote revealed successfully!');
      setRevealCandidateId('');
      setRevealSecretPhrase('');
      
      // Refresh voter status from blockchain
      if (account) {
        const [isRegistered, hasCommitted, hasRevealed] = await Promise.all([
          contract.isVoterRegistered(account),
          contract.hasVoterCommitted(account),
          contract.hasVoterRevealed(account),
        ]);

        setVoterStatus({
          isRegistered: isRegistered,
          hasCommitted: hasCommitted,
          hasRevealed: hasRevealed,
        });
      }
      
      // Refresh candidates to show updated vote counts
      const allCandidates = await contract.getAllCandidates();
      setCandidates(allCandidates.map((c: any) => ({
        id: Number(c.id),
        name: c.name,
        voteCount: Number(c.voteCount),
      })));
    } catch (error: any) {
      console.error('Error revealing vote:', error);
      toast.error(error.message || 'Failed to reveal vote');
    } finally {
      setIsRevealing(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!voterStatus?.isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Not Registered</h1>
          <p className="text-gray-300">You are not registered to vote in this election.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Voter Dashboard</h1>
          <p className="text-xl text-gray-300">Cast your vote securely</p>
        </div>

        {/* Current Status */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Status</h2>
            <button
              onClick={refreshAllData}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg transition-all duration-300 border border-blue-500/30"
            >
              🔄 Refresh Status
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${voterStatus.isRegistered ? 'text-green-400' : 'text-red-400'}`}>
                {voterStatus.isRegistered ? '✓' : '✗'}
              </div>
              <div className="text-gray-300">Registered</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${voterStatus.hasCommitted ? 'text-green-400' : 'text-yellow-400'}`}>
                {voterStatus.hasCommitted ? '✓' : '○'}
              </div>
              <div className="text-gray-300">Vote Committed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${voterStatus.hasRevealed ? 'text-green-400' : 'text-purple-400'}`}>
                {voterStatus.hasRevealed ? '✓' : '○'}
              </div>
              <div className="text-gray-300">Vote Revealed</div>
            </div>
          </div>
          <div className="mt-6 text-center">
            <div className="text-xl font-semibold text-white">
              Current Phase: <span className="text-blue-400">{getStageText(currentStage)}</span>
            </div>
          </div>
        </div>

        {/* Commit Phase */}
        {currentStage === Stage.Commit && !voterStatus.hasCommitted && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Commit Your Vote</h2>
            <p className="text-gray-300 mb-6">
              Select a candidate and enter a secret phrase. Your vote will be committed with a cryptographic hash.
            </p>
            
            <form onSubmit={commitVote} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-4">Select Candidate</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      isSelected={selectedCandidate === candidate.id}
                      onSelect={setSelectedCandidate}
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Secret Phrase</label>
                <input
                  type="text"
                  value={secretPhrase}
                  onChange={(e) => setSecretPhrase(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a secret phrase (remember this!)"
                  required
                />
                <p className="text-sm text-gray-400 mt-2">
                  Remember this phrase - you'll need it to reveal your vote later.
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isCommitting || !selectedCandidate}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isCommitting ? 'Committing...' : 'Commit Vote'}
              </button>
            </form>
          </div>
        )}

        {/* Reveal Phase */}
        {currentStage === Stage.Reveal && voterStatus.hasCommitted && !voterStatus.hasRevealed && (
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Reveal Your Vote</h2>
            <p className="text-gray-300 mb-6">
              Enter the candidate ID and secret phrase you used to commit your vote.
            </p>
            
            <form onSubmit={revealVote} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Candidate ID</label>
                <select
                  value={revealCandidateId}
                  onChange={(e) => setRevealCandidateId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select candidate ID</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.id} - {candidate.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Secret Phrase</label>
                <input
                  type="text"
                  value={revealSecretPhrase}
                  onChange={(e) => setRevealSecretPhrase(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the secret phrase you used"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isRevealing || !revealCandidateId}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-all duration-300"
              >
                {isRevealing ? 'Revealing...' : 'Reveal Vote'}
              </button>
            </form>
          </div>
        )}

        {/* Status Messages */}
        {currentStage === Stage.Commit && voterStatus.hasCommitted && (
          <div className="bg-green-500/20 backdrop-blur-lg border border-green-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">✓</div>
              <div>
                <h3 className="text-lg font-semibold text-green-400">Vote Committed</h3>
                <p className="text-gray-300">Your vote has been successfully committed. Wait for the reveal phase to begin.</p>
              </div>
            </div>
          </div>
        )}

        {currentStage === Stage.Reveal && voterStatus.hasRevealed && (
          <div className="bg-purple-500/20 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">✓</div>
              <div>
                <h3 className="text-lg font-semibold text-purple-400">Vote Revealed</h3>
                <p className="text-gray-300">Your vote has been successfully revealed and counted.</p>
              </div>
            </div>
          </div>
        )}

        {/* Candidates List */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Candidates</h2>
          {candidates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No candidates available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  showVoteCount={currentStage === Stage.Reveal || currentStage === Stage.Finished}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Voter;
