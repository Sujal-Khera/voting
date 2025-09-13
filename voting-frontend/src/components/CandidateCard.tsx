import React from 'react';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  isSelected?: boolean;
  onSelect?: (candidateId: number) => void;
  showVoteCount?: boolean;
  disabled?: boolean;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected = false,
  onSelect,
  showVoteCount = false,
  disabled = false,
}) => {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(candidate.id);
    }
  };

  return (
    <div
      className={`
        relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 cursor-pointer
        transition-all duration-300 hover:scale-105 hover:bg-white/20
        ${isSelected ? 'ring-2 ring-blue-400 bg-blue-500/20' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {candidate.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {candidate.name}
          </h3>
          {showVoteCount && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">Votes:</span>
              <span className="text-lg font-bold text-green-400">
                {candidate.voteCount}
              </span>
            </div>
          )}
        </div>
        {isSelected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
