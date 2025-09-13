import React, { useState, useEffect } from 'react';
import { useWeb3Context } from '../contexts/Web3Context';
import { Stage, Candidate, ContractEvent } from '../types';
import { ethers } from 'ethers';
import ResultsChart from '../components/ResultsChart';
import EventLog from '../components/EventLog';
import toast from 'react-hot-toast';

const Results: React.FC = () => {
  const { contract, provider } = useWeb3Context();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage>(Stage.Setup);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (contract) {
        try {
          const [candidateCount, voterCount, totalCommits, totalRevealed, stage] = await contract.getElectionStats();
          const allCandidates = await contract.getAllCandidates();
          
          setCurrentStage(Number(stage) as Stage);
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
  }, [contract]);

  useEffect(() => {
    if (!contract || !provider) return;

    const setupEventListeners = () => {
      // Listen for CandidateAdded events
      contract.on('CandidateAdded', (candidateId: any, name: any, event: any) => {
        const newEvent: ContractEvent = {
          event: 'CandidateAdded',
          args: { candidateId: Number(candidateId), name },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: new Date(),
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
      });

      // Listen for VoterRegistered events
      contract.on('VoterRegistered', (voter: any, event: any) => {
        const newEvent: ContractEvent = {
          event: 'VoterRegistered',
          args: { voter },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: new Date(),
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
      });

      // Listen for VoteCommitted events
      contract.on('VoteCommitted', (voter: any, commitHash: any, event: any) => {
        const newEvent: ContractEvent = {
          event: 'VoteCommitted',
          args: { voter, commitHash },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: new Date(),
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
      });

      // Listen for VoteRevealed events
      contract.on('VoteRevealed', (voter: any, candidateId: any, event: any) => {
        const newEvent: ContractEvent = {
          event: 'VoteRevealed',
          args: { voter, candidateId: Number(candidateId) },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: new Date(),
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        
        // Update candidate vote count
        setCandidates(prev => prev.map(c => 
          c.id === Number(candidateId) 
            ? { ...c, voteCount: c.voteCount + 1 }
            : c
        ));
      });

      // Listen for StageChanged events
      contract.on('StageChanged', (newStage: any, event: any) => {
        const newEvent: ContractEvent = {
          event: 'StageChanged',
          args: { newStage: Number(newStage) },
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: new Date(),
        };
        setEvents(prev => [newEvent, ...prev.slice(0, 49)]);
        setCurrentStage(Number(newStage) as Stage);
      });
    };

    setupEventListeners();

    // Listen for new blocks to refresh data
    const blockListener = (blockNumber: number) => {
      // Refresh candidates data
      contract.getAllCandidates().then((allCandidates: any[]) => {
        setCandidates(allCandidates.map((c: any) => ({
          id: Number(c.id),
          name: c.name,
          voteCount: Number(c.voteCount),
        })));
      }).catch(console.error);
    };

    provider.on('block', blockListener);

    return () => {
      contract.removeAllListeners();
      provider.removeListener('block', blockListener);
    };
  }, [contract, provider]);

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
          <h1 className="text-5xl font-bold text-white mb-4">Election Results</h1>
          <p className="text-xl text-gray-300">Live voting data and transparency</p>
        </div>

        {/* Current Status */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Current Status</h2>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getStageColor(currentStage)} mb-4`}>
              {getStageText(currentStage)}
            </div>
            <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStage + 1) / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Results Chart */}
          <div>
            <ResultsChart 
              candidates={candidates} 
              isRevealPhase={currentStage === Stage.Reveal || currentStage === Stage.Finished}
            />
          </div>

          {/* Event Log */}
          <div>
            <EventLog events={events} />
          </div>
        </div>

        {/* Candidates List */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Candidates</h2>
            {candidates.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No candidates available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {candidate.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-300">Votes:</span>
                          <span className="text-lg font-bold text-green-400">
                            {candidate.voteCount}
                          </span>
                        </div>
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

export default Results;
