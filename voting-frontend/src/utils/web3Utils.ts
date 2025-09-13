import { ethers } from 'ethers';
import contractABI from './contractABI.json';
import contractAddress from '../contract-address.json';

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); // Fixed provider instantiation
const contract = new ethers.Contract(contractAddress.address, contractABI, provider);

export const getAdminAddress = async (): Promise<string> => {
  try {
    const adminAddress = await contract.admin();
    return adminAddress;
  } catch (error) {
    console.error('Error fetching admin address:', error);
    throw error;
  }
};