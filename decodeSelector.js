const ethers = require("ethers");

// Function selector to decode
const selector = "0xf851a440";

// ABI to decode against (replace with your contract's ABI if needed)
const abi = [
  "function resetRequestTime() view returns (uint256)",
  "function getResetCooldownRemaining() view returns (uint256)",
  "function executeElectionReset()"
];

// Decode the selector
const iface = new ethers.Interface(abi);
const decoded = iface.parseTransaction({ data: selector });

console.log("Decoded function:", decoded.name);