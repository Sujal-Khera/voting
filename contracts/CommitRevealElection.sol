// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CommitRevealElection {
    address public admin;
    
    enum Stage { Setup, Commit, Reveal, Finished }
    Stage public currentStage;
    
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }
    
    struct Commit {
        bytes32 commitHash;
        bool revealed;
        uint256 candidateId;
    }
    
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => Commit) public commits;
    
    uint256 public candidateCount;
    uint256 public voterCount;
    uint256 public totalCommits;
    uint256 public totalRevealed;
    
    // Events for transparency and auditability
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCommitted(address indexed voter, bytes32 commitHash);
    event VoteRevealed(address indexed voter, uint256 candidateId);
    event StageChanged(Stage newStage);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(registeredVoters[msg.sender], "You are not registered to vote");
        _;
    }
    
    modifier atStage(Stage _stage) {
        require(currentStage == _stage, "Function cannot be called at this stage");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        currentStage = Stage.Setup;
    }
    
    // Admin Functions
    function addCandidate(string memory _name) external onlyAdmin atStage(Stage.Setup) {
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        emit CandidateAdded(candidateCount, _name);
    }
    
    function registerVoter(address _voter) external onlyAdmin atStage(Stage.Setup) {
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        voterCount++;
        emit VoterRegistered(_voter);
    }
    
    function registerMultipleVoters(address[] memory _voters) external onlyAdmin atStage(Stage.Setup) {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                voterCount++;
                emit VoterRegistered(_voters[i]);
            }
        }
    }
    
    function advanceStage() external onlyAdmin {
        require(currentStage != Stage.Finished, "Election is already finished");
        
        if (currentStage == Stage.Setup) {
            require(candidateCount > 0, "At least one candidate must be added");
            require(voterCount > 0, "At least one voter must be registered");
            currentStage = Stage.Commit;
        } else if (currentStage == Stage.Commit) {
            currentStage = Stage.Reveal;
        } else if (currentStage == Stage.Reveal) {
            currentStage = Stage.Finished;
        }
        
        emit StageChanged(currentStage);
    }
    
    // Voter Functions
    function commitVote(bytes32 _commitHash) external onlyRegisteredVoter atStage(Stage.Commit) {
        require(commits[msg.sender].commitHash == bytes32(0), "You have already committed your vote");
        
        commits[msg.sender].commitHash = _commitHash;
        totalCommits++;
        
        emit VoteCommitted(msg.sender, _commitHash);
    }
    
    function revealVote(uint256 _candidateId, uint256 _secret) external onlyRegisteredVoter atStage(Stage.Reveal) {
        require(commits[msg.sender].commitHash != bytes32(0), "You haven't committed a vote");
        require(!commits[msg.sender].revealed, "You have already revealed your vote");
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        
        // Verify the commit hash matches the reveal
        bytes32 computedHash = keccak256(abi.encodePacked(_candidateId, _secret));
        require(computedHash == commits[msg.sender].commitHash, "Invalid reveal - hash mismatch");
        
        // Mark as revealed and record the vote
        commits[msg.sender].revealed = true;
        commits[msg.sender].candidateId = _candidateId;
        candidates[_candidateId].voteCount++;
        totalRevealed++;
        
        emit VoteRevealed(msg.sender, _candidateId);
    }
    
    // View Functions
    function getCandidate(uint256 _candidateId) external view returns (uint256, string memory, uint256) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }
    
    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidateCount);
        for (uint256 i = 1; i <= candidateCount; i++) {
            allCandidates[i-1] = candidates[i];
        }
        return allCandidates;
    }
    
    function getVoterCommit(address _voter) external view returns (bytes32, bool, uint256) {
        Commit memory commit = commits[_voter];
        return (commit.commitHash, commit.revealed, commit.candidateId);
    }
    
    function getElectionStats() external view returns (uint256, uint256, uint256, uint256, Stage) {
        return (candidateCount, voterCount, totalCommits, totalRevealed, currentStage);
    }
    
    function generateCommitHash(uint256 _candidateId, uint256 _secret) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_candidateId, _secret));
    }
    
    function getWinner() external view atStage(Stage.Finished) returns (uint256, string memory, uint256) {
        require(candidateCount > 0, "No candidates available");
        
        uint256 winnerId = 1;
        uint256 maxVotes = candidates[1].voteCount;
        
        for (uint256 i = 2; i <= candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }
        
        return (winnerId, candidates[winnerId].name, maxVotes);
    }
    
    // Audit Functions - for transparency
    function isVoterRegistered(address _voter) external view returns (bool) {
        return registeredVoters[_voter];
    }
    
    function hasVoterCommitted(address _voter) external view returns (bool) {
        return commits[_voter].commitHash != bytes32(0);
    }
    
    function hasVoterRevealed(address _voter) external view returns (bool) {
        return commits[_voter].revealed;
    }
    
    // Reset election function - only admin can call
    function resetElection() external onlyAdmin {
        require(currentStage == Stage.Finished, "Can only reset after election is finished");
        
        // Reset all counters
        candidateCount = 0;
        voterCount = 0;
        totalCommits = 0;
        totalRevealed = 0;
        
        // Reset stage to Setup
        currentStage = Stage.Setup;
        
        // Clear all candidates (we can't delete mappings, but we reset the counter)
        // The old candidate data will be overwritten when new candidates are added
        
        // Note: We can't clear the commits and registeredVoters mappings efficiently
        // This is a limitation of Solidity - mappings can't be cleared in a single operation
        // In a production system, you might want to deploy a new contract for each election
        
        emit StageChanged(currentStage);
    }
}