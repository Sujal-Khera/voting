import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  console.log("Deploying CommitRevealElection contract...");

  // Get the contract factory
  const CommitRevealElection = await ethers.getContractFactory("CommitRevealElection");

  // Deploy the contract
  const election = await CommitRevealElection.deploy();

  // Wait for deployment to finish
  await election.waitForDeployment();

  const contractAddress = await election.getAddress();
  
  console.log("CommitRevealElection deployed to:", contractAddress);
  console.log("Contract address:", contractAddress);
  
  // Save the contract address for frontend use
  const contractInfo = {
    address: contractAddress,
    network: "localhost"
  };
  
  fs.writeFileSync(
    'contract-address.json', 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("Contract info saved to contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
