export interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

export interface Commit {
  commitHash: string;
  revealed: boolean;
  candidateId: number;
}

export enum Stage {
  Setup = 0,
  Commit = 1,
  Reveal = 2,
  Finished = 3
}

export interface ElectionStats {
  candidateCount: number;
  voterCount: number;
  totalCommits: number;
  totalRevealed: number;
  currentStage: Stage;
}

export interface VoterStatus {
  isRegistered: boolean;
  hasCommitted: boolean;
  hasRevealed: boolean;
}

export interface ContractEvent {
  event: string;
  args: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: Date;
}

export interface Web3ContextType {
  account: string | null;
  isAdmin: boolean;
  isConnected: boolean;
  contract: any;
  provider: any;
  signer: any;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}
