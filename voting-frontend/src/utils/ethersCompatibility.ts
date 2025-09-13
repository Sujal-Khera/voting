import { ethers } from 'ethers';

/**
 * Safely calls a contract method and handles errors
 * @param contract The ethers.js contract instance
 * @param methodName The name of the contract method to call
 * @param args Optional arguments to pass to the contract method
 * @returns The result of the contract method call
 */
export const safeContractCall = async (
  contract: ethers.Contract,
  methodName: string,
  ...args: any[]
): Promise<any> => {
  try {
    if (!contract) {
      throw new Error('Contract is not initialized');
    }

    if (!contract[methodName]) {
      throw new Error(`Method ${methodName} does not exist on the contract`);
    }

    const result = await contract[methodName](...args);
    return result;
  } catch (error: any) {
    console.error(`Error calling ${methodName}:`, error);
    throw new Error(`Contract call to ${methodName} failed: ${error.message || 'Unknown error'}`);
  }
};