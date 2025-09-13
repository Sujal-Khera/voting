import { ethers } from 'ethers';

/**
 * Safely calls a contract method and handles errors
 * @param contract The ethers.js contract instance
 * @param methodName The name of the contract method to call
 * @param args Optional arguments to pass to the contract method
 * @returns The result of the contract method call
 */
export declare function safeContractCall(
  contract: ethers.Contract,
  methodName: string,
  ...args: any[]
): Promise<any>;