import { ethers } from "ethers";
import contractABI from "../voting-frontend/src/utils/contractABI.json";
import contractAddress from "../voting-frontend/src/contract-address.json";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contract = new ethers.Contract(contractAddress.address, contractABI, provider);

async function checkAdminAndStage() {
  try {
    // Fetch the admin address from the contract
    const adminAddress = await contract.admin();
    console.log("Admin Address in Contract:", adminAddress);

    // Fetch the current stage of the election
    const currentStage = await contract.currentStage();
    const stageNames = ["Setup", "Commit", "Reveal", "Finished"];
    console.log("Current Election Stage:", stageNames[currentStage]);

    // Check the active account in MetaMask
    const accounts = await provider.listAccounts();
    if (accounts.length === 0) {
      console.log("No accounts found. Please unlock MetaMask.");
      return;
    }

    const activeAccount = await accounts[0].getAddress(); // Extract address from signer
    console.log("Active MetaMask Account:", activeAccount);

    // Compare the active account with the admin address
    if (activeAccount.toLowerCase() === adminAddress.toLowerCase()) {
      console.log("The active account is the admin.");
    } else {
      console.log("The active account is NOT the admin.");
    }
  } catch (error) {
    console.error("Error checking admin and stage:", error);
  }
}

checkAdminAndStage();