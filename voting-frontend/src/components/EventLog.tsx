import React from 'react';
import { ContractEvent } from '../types';

interface EventLogProps {
  events: ContractEvent[];
}

const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case 'CandidateAdded':
        return '👤';
      case 'VoterRegistered':
        return '📝';
      case 'VoteCommitted':
        return '🔒';
      case 'VoteRevealed':
        return '🔓';
      case 'StageChanged':
        return '🔄';
      default:
        return '📄';
    }
  };

  const getEventColor = (eventName: string) => {
    switch (eventName) {
      case 'CandidateAdded':
        return 'text-blue-400';
      case 'VoterRegistered':
        return 'text-green-400';
      case 'VoteCommitted':
        return 'text-yellow-400';
      case 'VoteRevealed':
        return 'text-purple-400';
      case 'StageChanged':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Event Log</h3>
        <p className="text-gray-300">Real-time blockchain events</p>
      </div>
      
      <div className="h-80 overflow-y-auto space-y-3">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No events yet</p>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getEventIcon(event.event)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`font-semibold ${getEventColor(event.event)}`}>
                      {event.event}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {event.event === 'CandidateAdded' && (
                      <p className="text-white">
                        Added candidate: <span className="text-blue-400">{event.args.name}</span>
                      </p>
                    )}
                    
                    {event.event === 'VoterRegistered' && (
                      <p className="text-white">
                        Registered voter: <span className="text-green-400">{formatAddress(event.args.voter)}</span>
                      </p>
                    )}
                    
                    {event.event === 'VoteCommitted' && (
                      <p className="text-white">
                        Vote committed by: <span className="text-yellow-400">{formatAddress(event.args.voter)}</span>
                      </p>
                    )}
                    
                    {event.event === 'VoteRevealed' && (
                      <p className="text-white">
                        Vote revealed by: <span className="text-purple-400">{formatAddress(event.args.voter)}</span>
                        <span className="text-gray-400 ml-2">for candidate #{event.args.candidateId}</span>
                      </p>
                    )}
                    
                    {event.event === 'StageChanged' && (
                      <p className="text-white">
                        Stage changed to: <span className="text-orange-400">
                          {['Setup', 'Commit', 'Reveal', 'Finished'][event.args.newStage]}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Block: {event.blockNumber} | TX: {formatAddress(event.transactionHash)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventLog;
