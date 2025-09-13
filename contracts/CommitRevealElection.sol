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
        uint256 depositAmount;
    }
    
    struct Election {
        uint256 electionId;
        uint256 candidateCount;
        uint256 voterCount;
        uint256 totalCommits;
        uint256 totalRevealed;
        uint256 winnerId;
        string winnerName;
        uint256 winnerVotes;
        uint256 timestamp;
    }
    
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public registeredVoters;
    mapping(address => Commit) public commits;
    mapping(uint256 => Election) public elections;
    
    uint256 public candidateCount;
    uint256 public voterCount;
    uint256 public totalCommits;
    uint256 public totalRevealed;
    uint256 public electionId;
    uint256 public resetRequestTime;
    uint256 public constant RESET_COOLDOWN = 60; // 1 minute cooldown
    uint256 public constant MIN_DEPOSIT = 0.001 ether; // Minimum deposit for voting
    
    // Events for transparency and auditability
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterRegistered(address indexed voter);
    event VoteCommitted(address indexed voter, bytes32 commitHash, uint256 depositAmount);
    event VoteRevealed(address indexed voter, uint256 candidateId, uint256 refundAmount);
    event StageChanged(Stage newStage);
    event ElectionResetRequested(uint256 timestamp);
    event ElectionReset(uint256 indexed electionId, uint256 timestamp);
    event DepositRefunded(address indexed voter, uint256 amount);
    event DepositForfeited(address indexed voter, uint256 amount);
    
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
        admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Updated admin address
        currentStage = Stage.Setup;
        electionId = 1;
    }
    
    modifier requiresDeposit() {
        require(msg.value >= MIN_DEPOSIT, "Insufficient deposit for voting");
        _;
    }
    
    modifier resetCooldownPassed() {
        require(block.timestamp >= resetRequestTime + RESET_COOLDOWN, "Reset cooldown not passed");
        _;
    }
    
    // Admin Functions
    function addCandidate(string memory _name) external onlyAdmin atStage(Stage.Setup) {
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
        emit CandidateAdded(candidateCount, _name);
    }
    
    // Batch operations for gas optimization
    function addMultipleCandidates(string[] memory _names) external onlyAdmin atStage(Stage.Setup) {
        require(_names.length > 0, "No candidates provided");
        require(_names.length <= 50, "Too many candidates (max 50)");
        
        for (uint256 i = 0; i < _names.length; i++) {
            candidateCount++;
            candidates[candidateCount] = Candidate(candidateCount, _names[i], 0);
            emit CandidateAdded(candidateCount, _names[i]);
        }
    }
    
    function registerVoter(address _voter) external onlyAdmin atStage(Stage.Setup) {
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        voterCount++;
        emit VoterRegistered(_voter);
    }
    
    function registerMultipleVoters(address[] memory _voters) external onlyAdmin atStage(Stage.Setup) {
        require(_voters.length > 0, "No voters provided");
        require(_voters.length <= 100, "Too many voters (max 100)");
        
        for (uint256 i = 0; i < _voters.length; i++) {
            require(!registeredVoters[_voters[i]], "Voter already registered");
            registeredVoters[_voters[i]] = true;
            voterCount++;
            emit VoterRegistered(_voters[i]);
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
    function commitVote(bytes32 _commitHash) external payable onlyRegisteredVoter atStage(Stage.Commit) requiresDeposit {
        require(commits[msg.sender].commitHash == bytes32(0), "You have already committed your vote");
        
        commits[msg.sender].commitHash = _commitHash;
        commits[msg.sender].depositAmount = msg.value;
        totalCommits++;
        
        emit VoteCommitted(msg.sender, _commitHash, msg.value);
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
        
        // Refund the deposit
        uint256 refundAmount = commits[msg.sender].depositAmount;
        if (refundAmount > 0) {
            commits[msg.sender].depositAmount = 0;
            payable(msg.sender).transfer(refundAmount);
            emit DepositRefunded(msg.sender, refundAmount);
        }
        
        emit VoteRevealed(msg.sender, _candidateId, refundAmount);
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
    
    // Request election reset - starts cooldown timer
    function requestElectionReset() external onlyAdmin {
        require(currentStage == Stage.Finished, "Can only reset after election is finished");
        resetRequestTime = block.timestamp;
        emit ElectionResetRequested(block.timestamp);
    }
    
    // Execute election reset - only after cooldown
    function executeElectionReset() external onlyAdmin resetCooldownPassed {
        require(currentStage == Stage.Finished, "Can only reset after election is finished");
        
        // Store current election results in history before reset
        uint256 winnerId = 0;
        uint256 maxVotes = 0;
        string memory winnerName = "";
        
        if (candidateCount > 0) {
            for (uint256 i = 1; i <= candidateCount; i++) {
                if (candidates[i].voteCount > maxVotes) {
                    maxVotes = candidates[i].voteCount;
                    winnerId = i;
                    winnerName = candidates[i].name;
                }
            }
        }
        
        // Store election in history
        elections[electionId] = Election({
            electionId: electionId,
            candidateCount: candidateCount,
            voterCount: voterCount,
            totalCommits: totalCommits,
            totalRevealed: totalRevealed,
            winnerId: winnerId,
            winnerName: winnerName,
            winnerVotes: maxVotes,
            timestamp: block.timestamp
        });
        
        // Reset all counters
        candidateCount = 0;
        voterCount = 0;
        totalCommits = 0;
        totalRevealed = 0;
        
        // Reset stage to Setup
        currentStage = Stage.Setup;
        electionId++;
        
        emit ElectionReset(electionId - 1, block.timestamp);
        emit StageChanged(currentStage);
    }
    
    // Forfeit deposits for voters who didn't reveal
    function forfeitUnrevealedDeposits() external onlyAdmin {
        require(currentStage == Stage.Finished, "Can only forfeit after election is finished");
        
        // This would require iterating through all voters, which is gas-intensive
        // In a production system, you might want to implement a more efficient approach
        // For now, we'll leave this as a placeholder
    }
    
    // View functions for transparency
    function getElectionHistory(uint256 _electionId) external view returns (Election memory) {
        return elections[_electionId];
    }
    
    function getResetCooldownRemaining() external view returns (uint256) {
        if (resetRequestTime == 0) return 0;
        uint256 elapsed = block.timestamp - resetRequestTime;
        return elapsed >= RESET_COOLDOWN ? 0 : RESET_COOLDOWN - elapsed;
    }
    
    function getVoterDeposit(address _voter) external view returns (uint256) {
        return commits[_voter].depositAmount;
    }
    
    function getUnrevealedVoters() external view returns (address[] memory) {
        // This is a placeholder - in production, you'd need to track unrevealed voters
        // For now, return empty array
        address[] memory unrevealed = new address[](0);
        return unrevealed;
    }
    
    // Emergency function to withdraw contract balance (only admin)
    function withdrawBalance() external onlyAdmin {
        payable(admin).transfer(address(this).balance);
    }
}