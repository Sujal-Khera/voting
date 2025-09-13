import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Candidate } from '../types';

interface ResultsChartProps {
  candidates: Candidate[];
  isRevealPhase?: boolean;
}

const ResultsChart: React.FC<ResultsChartProps> = ({ candidates, isRevealPhase = false }) => {
  const chartData = candidates.map(candidate => ({
    name: candidate.name,
    votes: candidate.voteCount,
    id: candidate.id,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 backdrop-blur-lg border border-white/20 rounded-lg p-3">
          <p className="text-white font-semibold">{`${label}`}</p>
          <p className="text-green-400">
            {`Votes: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">
          {isRevealPhase ? 'Live Results' : 'Vote Commitments'}
        </h3>
        <p className="text-gray-300">
          {isRevealPhase 
            ? 'Real-time vote counts as they are revealed'
            : 'Number of committed votes per candidate'
          }
        </p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="votes" 
              fill="url(#colorGradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResultsChart;
