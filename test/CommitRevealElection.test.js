const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommitRevealElection", function () {
    let election;
    let admin, voter1, voter2, voter3, nonVoter;
    
    beforeEach(async function () {
        [admin, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
        
        const CommitRevealElection = await ethers.getContractFactory("CommitRevealElection");
        election = await CommitRevealElection.deploy();
        await election.waitForDeployment();
    });
    
    describe("Setup Stage", function () {
        it("Should set the admin correctly", async function () {
            expect(await election.admin()).to.equal(admin.address);
        });
        
        it("Should start in Setup stage", async function () {
            expect(await election.currentStage()).to.equal(0); // Stage.Setup
        });
        
        it("Should allow admin to add candidates", async function () {
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            
            const candidate1 = await election.getCandidate(1);
            const candidate2 = await election.getCandidate(2);
            
            expect(candidate1[1]).to.equal("Alice");
            expect(candidate2[1]).to.equal("Bob");
            expect(await election.candidateCount()).to.equal(2);
        });
        
        it("Should allow admin to register voters", async function () {
            await election.registerVoter(voter1.address);
            await election.registerVoter(voter2.address);
            
            expect(await election.registeredVoters(voter1.address)).to.be.true;
            expect(await election.registeredVoters(voter2.address)).to.be.true;
            expect(await election.voterCount()).to.equal(2);
        });
        
        it("Should allow admin to register multiple voters at once", async function () {
            await election.registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
            
            expect(await election.registeredVoters(voter1.address)).to.be.true;
            expect(await election.registeredVoters(voter2.address)).to.be.true;
            expect(await election.registeredVoters(voter3.address)).to.be.true;
            expect(await election.voterCount()).to.equal(3);
        });
        
        it("Should not allow non-admin to add candidates", async function () {
            await expect(
                election.connect(voter1).addCandidate("Charlie")
            ).to.be.revertedWith("Only admin can call this function");
        });
        
        it("Should not allow non-admin to register voters", async function () {
            await expect(
                election.connect(voter1).registerVoter(voter2.address)
            ).to.be.revertedWith("Only admin can call this function");
        });
        
        it("Should not advance stage without candidates and voters", async function () {
            await expect(election.advanceStage()).to.be.revertedWith("At least one candidate must be added");
            
            await election.addCandidate("Alice");
            await expect(election.advanceStage()).to.be.revertedWith("At least one voter must be registered");
        });
    });
    
    describe("Commit Stage", function () {
        beforeEach(async function () {
            // Setup election
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
            await election.advanceStage(); // Move to Commit stage
        });
        
        it("Should be in Commit stage", async function () {
            expect(await election.currentStage()).to.equal(1); // Stage.Commit
        });
        
        it("Should allow registered voters to commit votes", async function () {
            const secret = 12345;
            const candidateId = 1;
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            await election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            const commit = await election.getVoterCommit(voter1.address);
            expect(commit[0]).to.equal(commitHash);
            expect(commit[1]).to.be.false; // not revealed yet
            expect(await election.totalCommits()).to.equal(1);
        });
        
        it("Should not allow non-registered voters to commit", async function () {
            const secret = 12345;
            const candidateId = 1;
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            await expect(
                election.connect(nonVoter).commitVote(commitHash)
            ).to.be.revertedWith("You are not registered to vote");
        });
        
        it("Should not allow double commits", async function () {
            const secret = 12345;
            const candidateId = 1;
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            await election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            await expect(
                election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") })
            ).to.be.revertedWith("You have already committed your vote");
        });
        
        it("Should not allow reveals during commit stage", async function () {
            const secret = 12345;
            const candidateId = 1;
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            await election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            await expect(
                election.connect(voter1).revealVote(candidateId, secret)
            ).to.be.revertedWith("Function cannot be called at this stage");
        });
        
        it("Should reject commits with insufficient deposit", async function () {
            const secret = 12345;
            const candidateId = 1;
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            await expect(
                election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.0005") })
            ).to.be.revertedWith("Insufficient deposit for voting");
        });
    });
    
    describe("Reveal Stage", function () {
        beforeEach(async function () {
            // Setup election and move to reveal stage
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
            await election.advanceStage(); // Move to Commit
            
            // Commit some votes
            const secret1 = 12345;
            const secret2 = 67890;
            const secret3 = 11111;
            
            const commitHash1 = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [1, secret1]) // Vote for Alice
            );
            const commitHash2 = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [2, secret2]) // Vote for Bob
            );
            const commitHash3 = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [1, secret3]) // Vote for Alice
            );
            
            await election.connect(voter1).commitVote(commitHash1, { value: ethers.parseEther("0.001") });
            await election.connect(voter2).commitVote(commitHash2, { value: ethers.parseEther("0.001") });
            await election.connect(voter3).commitVote(commitHash3, { value: ethers.parseEther("0.001") });
            
            await election.advanceStage(); // Move to Reveal
        });
        
        it("Should be in Reveal stage", async function () {
            expect(await election.currentStage()).to.equal(2); // Stage.Reveal
        });
        
        it("Should allow voters to reveal their votes correctly", async function () {
            const secret1 = 12345;
            const candidateId = 1;
            
            await election.connect(voter1).revealVote(candidateId, secret1);
            
            const commit = await election.getVoterCommit(voter1.address);
            expect(commit[1]).to.be.true; // revealed
            expect(commit[2]).to.equal(candidateId);
            
            const candidate = await election.getCandidate(1);
            expect(candidate[2]).to.equal(1); // vote count
            expect(await election.totalRevealed()).to.equal(1);
        });
        
        it("Should reject reveals with wrong secret", async function () {
            const wrongSecret = 99999;
            const candidateId = 1;
            
            await expect(
                election.connect(voter1).revealVote(candidateId, wrongSecret)
            ).to.be.revertedWith("Invalid reveal - hash mismatch");
        });
        
        it("Should reject reveals with wrong candidate", async function () {
            const secret1 = 12345;
            const wrongCandidateId = 2; // voter1 committed for candidate 1
            
            await expect(
                election.connect(voter1).revealVote(wrongCandidateId, secret1)
            ).to.be.revertedWith("Invalid reveal - hash mismatch");
        });
        
        it("Should not allow double reveals", async function () {
            const secret1 = 12345;
            const candidateId = 1;
            
            await election.connect(voter1).revealVote(candidateId, secret1);
            
            await expect(
                election.connect(voter1).revealVote(candidateId, secret1)
            ).to.be.revertedWith("You have already revealed your vote");
        });
        
        it("Should count votes correctly", async function () {
            // Reveal all votes
            await election.connect(voter1).revealVote(1, 12345); // Alice
            await election.connect(voter2).revealVote(2, 67890); // Bob
            await election.connect(voter3).revealVote(1, 11111); // Alice
            
            const alice = await election.getCandidate(1);
            const bob = await election.getCandidate(2);
            
            expect(alice[2]).to.equal(2); // Alice gets 2 votes
            expect(bob[2]).to.equal(1);   // Bob gets 1 vote
            expect(await election.totalRevealed()).to.equal(3);
        });
    });
    
    describe("Finished Stage", function () {
        beforeEach(async function () {
            // Complete a full election
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
            await election.advanceStage(); // Commit
            
            // Commit votes
            const commitHash1 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 12345]));
            const commitHash2 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [2, 67890]));
            const commitHash3 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 11111]));
            
            await election.connect(voter1).commitVote(commitHash1, { value: ethers.parseEther("0.001") });
            await election.connect(voter2).commitVote(commitHash2, { value: ethers.parseEther("0.001") });
            await election.connect(voter3).commitVote(commitHash3, { value: ethers.parseEther("0.001") });
            
            await election.advanceStage(); // Reveal
            
            // Reveal votes
            await election.connect(voter1).revealVote(1, 12345);
            await election.connect(voter2).revealVote(2, 67890);
            await election.connect(voter3).revealVote(1, 11111);
            
            await election.advanceStage(); // Finished
        });
        
        it("Should be in Finished stage", async function () {
            expect(await election.currentStage()).to.equal(3); // Stage.Finished
        });
        
        it("Should determine the winner correctly", async function () {
            const winner = await election.getWinner();
            
            expect(winner[0]).to.equal(1); // Alice's ID
            expect(winner[1]).to.equal("Alice");
            expect(winner[2]).to.equal(2); // 2 votes
        });
        
        it("Should not advance beyond Finished stage", async function () {
            await expect(election.advanceStage()).to.be.revertedWith("Election is already finished");
        });
    });
    
    describe("Utility Functions", function () {
        beforeEach(async function () {
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerVoter(voter1.address);
        });
        
        it("Should return all candidates", async function () {
            const candidates = await election.getAllCandidates();
            
            expect(candidates.length).to.equal(2);
            expect(candidates[0].name).to.equal("Alice");
            expect(candidates[1].name).to.equal("Bob");
        });
        
        it("Should return election stats", async function () {
            const stats = await election.getElectionStats();
            
            expect(stats[0]).to.equal(2); // candidateCount
            expect(stats[1]).to.equal(1); // voterCount
            expect(stats[2]).to.equal(0); // totalCommits
            expect(stats[3]).to.equal(0); // totalRevealed
            expect(stats[4]).to.equal(0); // Stage.Setup
        });
        
        it("Should generate commit hash correctly", async function () {
            const candidateId = 1;
            const secret = 12345;
            
            const contractHash = await election.generateCommitHash(candidateId, secret);
            const expectedHash = ethers.keccak256(
                ethers.solidityPacked(["uint256", "uint256"], [candidateId, secret])
            );
            
            expect(contractHash).to.equal(expectedHash);
        });
    });
    
    describe("Events", function () {
        it("Should emit CandidateAdded event", async function () {
            await expect(election.addCandidate("Alice"))
                .to.emit(election, "CandidateAdded")
                .withArgs(1, "Alice");
        });
        
        it("Should emit VoterRegistered event", async function () {
            await expect(election.registerVoter(voter1.address))
                .to.emit(election, "VoterRegistered")
                .withArgs(voter1.address);
        });
        
        it("Should emit StageChanged event", async function () {
            await election.addCandidate("Alice");
            await election.registerVoter(voter1.address);
            
            await expect(election.advanceStage())
                .to.emit(election, "StageChanged")
                .withArgs(1); // Stage.Commit
        });
        
        it("Should emit VoteCommitted event", async function () {
            await election.addCandidate("Alice");
            await election.registerVoter(voter1.address);
            await election.advanceStage(); // Commit stage
            
            const commitHash = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 12345]));
            
            await expect(election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") }))
                .to.emit(election, "VoteCommitted")
                .withArgs(voter1.address, commitHash, ethers.parseEther("0.001"));
        });
        
        it("Should emit VoteRevealed event", async function () {
            await election.addCandidate("Alice");
            await election.registerVoter(voter1.address);
            await election.advanceStage(); // Commit stage
            
            const commitHash = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 12345]));
            await election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            await election.advanceStage(); // Reveal stage
            
            await expect(election.connect(voter1).revealVote(1, 12345))
                .to.emit(election, "VoteRevealed")
                .withArgs(voter1.address, 1, ethers.parseEther("0.001"));
        });
    });
    
    describe("Election Reset and History", function () {
        beforeEach(async function () {
            // Complete a full election
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerMultipleVoters([voter1.address, voter2.address, voter3.address]);
            await election.advanceStage(); // Commit
            
            // Commit votes
            const commitHash1 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 12345]));
            const commitHash2 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [2, 67890]));
            const commitHash3 = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 11111]));
            
            await election.connect(voter1).commitVote(commitHash1, { value: ethers.parseEther("0.001") });
            await election.connect(voter2).commitVote(commitHash2, { value: ethers.parseEther("0.001") });
            await election.connect(voter3).commitVote(commitHash3, { value: ethers.parseEther("0.001") });
            
            await election.advanceStage(); // Reveal
            
            // Reveal votes
            await election.connect(voter1).revealVote(1, 12345);
            await election.connect(voter2).revealVote(2, 67890);
            await election.connect(voter3).revealVote(1, 11111);
            
            await election.advanceStage(); // Finished
        });
        
        it("Should store election in history after reset", async function () {
            // Request and execute reset
            await election.requestElectionReset();
            
            // Fast forward time to bypass cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");
            
            await election.executeElectionReset();
            
            // Check history length
            const historyLength = await election.getElectionHistoryLength();
            expect(historyLength).to.equal(1);
            
            // Get election from history
            const storedElection = await election.getElectionFromHistory(0);
            expect(storedElection.electionId).to.equal(1);
            expect(storedElection.candidateCount).to.equal(2);
            expect(storedElection.voterCount).to.equal(3);
            expect(storedElection.totalCommits).to.equal(3);
            expect(storedElection.totalRevealed).to.equal(3);
            expect(storedElection.winnerId).to.equal(1); // Alice
            expect(storedElection.winnerName).to.equal("Alice");
            expect(storedElection.winnerVotes).to.equal(2);
        });
        
        it("Should clear all state after reset", async function () {
            // Request and execute reset
            await election.requestElectionReset();
            
            // Fast forward time to bypass cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");
            
            await election.executeElectionReset();
            
            // Check all counters are reset
            const stats = await election.getElectionStats();
            expect(stats[0]).to.equal(0); // candidateCount
            expect(stats[1]).to.equal(0); // voterCount
            expect(stats[2]).to.equal(0); // totalCommits
            expect(stats[3]).to.equal(0); // totalRevealed
            expect(stats[4]).to.equal(0); // Stage.Setup
            
            // Check voters are cleared
            expect(await election.registeredVoters(voter1.address)).to.be.false;
            expect(await election.registeredVoters(voter2.address)).to.be.false;
            expect(await election.registeredVoters(voter3.address)).to.be.false;
            
            // Check election ID incremented
            expect(await election.electionId()).to.equal(2);
        });
        
        it("Should allow new election after reset", async function () {
            // Request and execute reset
            await election.requestElectionReset();
            
            // Fast forward time to bypass cooldown
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");
            
            await election.executeElectionReset();
            
            // Start new election
            await election.addCandidate("Charlie");
            await election.addCandidate("Dave");
            await election.registerVoter(voter1.address);
            
            const stats = await election.getElectionStats();
            expect(stats[0]).to.equal(2); // candidateCount
            expect(stats[1]).to.equal(1); // voterCount
            
            const candidate1 = await election.getCandidate(1);
            expect(candidate1[1]).to.equal("Charlie");
            expect(candidate1[2]).to.equal(0); // vote count should be 0
        });
        
        it("Should get all election history", async function () {
            // Complete first election and reset
            await election.requestElectionReset();
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");
            await election.executeElectionReset();
            
            // Complete second election
            await election.addCandidate("Charlie");
            await election.registerVoter(voter1.address);
            await election.advanceStage(); // Commit
            
            const commitHash = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 54321]));
            await election.connect(voter1).commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            await election.advanceStage(); // Reveal
            await election.connect(voter1).revealVote(1, 54321);
            await election.advanceStage(); // Finished
            
            // Reset second election
            await election.requestElectionReset();
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine");
            await election.executeElectionReset();
            
            // Check history has 2 elections
            const historyLength = await election.getElectionHistoryLength();
            expect(historyLength).to.equal(2);
            
            const allHistory = await election.getAllElectionHistory();
            expect(allHistory.length).to.equal(2);
            
            // First election should be at index 0
            expect(allHistory[0].electionId).to.equal(1);
            expect(allHistory[0].winnerName).to.equal("Alice");
            
            // Second election should be at index 1
            expect(allHistory[1].electionId).to.equal(2);
            expect(allHistory[1].winnerName).to.equal("Charlie");
        });
    });
    
    describe("Admin Voter Registration", function () {
        it("Should allow admin to register as voter", async function () {
            await election.addCandidate("Alice");
            
            // Admin should not be registered initially
            expect(await election.isAdminRegisteredAsVoter()).to.be.false;
            
            // Admin registers as voter
            await election.registerAdminAsVoter();
            
            // Check admin is now registered
            expect(await election.isAdminRegisteredAsVoter()).to.be.true;
            expect(await election.registeredVoters(admin.address)).to.be.true;
            expect(await election.voterCount()).to.equal(1);
        });
        
        it("Should not allow admin to register twice", async function () {
            await election.registerAdminAsVoter();
            
            await expect(election.registerAdminAsVoter())
                .to.be.revertedWith("Admin already registered as voter");
        });
        
        it("Should allow registered admin to vote", async function () {
            await election.addCandidate("Alice");
            await election.addCandidate("Bob");
            await election.registerAdminAsVoter();
            await election.advanceStage(); // Commit stage
            
            const commitHash = ethers.keccak256(ethers.solidityPacked(["uint256", "uint256"], [1, 12345]));
            
            // Admin should be able to commit a vote
            await election.commitVote(commitHash, { value: ethers.parseEther("0.001") });
            
            const commit = await election.getVoterCommit(admin.address);
            expect(commit[0]).to.equal(commitHash);
            expect(await election.totalCommits()).to.equal(1);
            
            // Move to reveal stage
            await election.advanceStage();
            
            // Admin should be able to reveal vote
            await election.revealVote(1, 12345);
            
            const candidate = await election.getCandidate(1);
            expect(candidate[2]).to.equal(1); // Alice should have 1 vote
            expect(await election.totalRevealed()).to.equal(1);
        });
        
        it("Should check if address is admin", async function () {
            expect(await election.isAdmin(admin.address)).to.be.true;
            expect(await election.isAdmin(voter1.address)).to.be.false;
            expect(await election.isAdmin(voter2.address)).to.be.false;
        });
    });
});
