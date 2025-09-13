const { ethers } = require("hardhat");

async function main() {
  console.log("Testing contract at address: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  try {
    // Get the contract factory
    const CommitRevealElection = await ethers.getContractFactory("CommitRevealElection");
    
    // Attach to the deployed contract
    const contract = CommitRevealElection.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    
    console.log("Contract attached successfully");
    
    // Call getElectionStats
    console.log("Calling getElectionStats...");
    const stats = await contract.getElectionStats();
    
    console.log("Election stats:", {
      candidateCount: stats[0].toString(),
      voterCount: stats[1].toString(),
      totalCommits: stats[2].toString(),
      totalRevealed: stats[3].toString(),
      currentStage: stats[4].toString()
    });
    
    // Test accessing the admin state variable
    console.log("Calling admin state variable...");
    const adminAddress = await contract.admin();
    console.log("Admin address:", adminAddress);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });