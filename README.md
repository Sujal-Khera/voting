# 🗳️ Blockchain Voting System

A secure, transparent, and fully decentralized voting system built on Ethereum using the commit-reveal scheme to prevent vote buying and coercion.

## ✨ Features

- **🔐 Secure Voting**: Commit-reveal scheme prevents vote buying and coercion
- **👑 Admin Controls**: Add candidates, register voters, manage election stages
- **📊 Real-time Stats**: Live election statistics and progress tracking
- **🎨 Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **🔗 Blockchain Integration**: Full Web3 integration using ethers.js
- **✅ Comprehensive Testing**: 39 test cases covering all functionality
- **🛡️ Type Safety**: Full TypeScript implementation

## 🏗️ Architecture

### Smart Contract (`CommitRevealElection.sol`)
- **4-Stage Election Process**: Setup → Commit → Reveal → Finished
- **Access Controls**: Admin-only functions with proper validation
- **Cryptographic Security**: Keccak256 hashing for vote commitments
- **Event Logging**: Complete audit trail for transparency
- **Gas Optimized**: Efficient storage and computation

### Frontend (`React + TypeScript`)
- **Modern React 19**: Latest React features and hooks
- **TypeScript**: Full type safety and better development experience
- **Tailwind CSS**: Beautiful, responsive design system
- **ethers.js v6**: Modern Web3 library for blockchain interaction
- **Error Handling**: Comprehensive error management and user feedback

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockchain-voting
   ```

2. **Install dependencies**
   ```bash
   # Install smart contract dependencies
   npm install
   
   # Install frontend dependencies
   cd voting-frontend
   npm install
   ```

3. **Start the local blockchain**
   ```bash
   # In the root directory
   npx hardhat node
   ```

4. **Deploy the smart contract**
   ```bash
   # In a new terminal, root directory
   npx hardhat run scripts/deploy.ts --network localhost
   ```

5. **Start the frontend**
   ```bash
   # In a new terminal, voting-frontend directory
   cd voting-frontend
   npm start
   ```

6. **Configure MetaMask**
   - Open MetaMask
   - Add a new network:
     - **Network Name**: Hardhat Local
     - **RPC URL**: http://127.0.0.1:8545
     - **Chain ID**: 31337
     - **Currency Symbol**: ETH
   - Import a test account using this private key:
     ```
     0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
     ```

7. **Access the application**
   - Open http://localhost:3000
   - Click "Connect Wallet"
   - Start using the voting system!

## 🎯 How to Use

### For Administrators

1. **Setup Phase**
   - Add candidates to the election
   - Register voters (individual or bulk)
   - Advance to commit phase when ready

2. **Manage Election**
   - Monitor real-time statistics
   - Advance through election stages
   - View final results

### For Voters

1. **Commit Phase**
   - Select your preferred candidate
   - Enter a secret number (remember this!)
   - Commit your vote (cryptographically hashed)

2. **Reveal Phase**
   - Enter the same candidate ID and secret number
   - Reveal your vote to count it

3. **View Results**
   - See election results after the reveal phase
   - Verify your vote was counted correctly

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage
```

**Test Coverage**: 39 test cases covering:
- ✅ Contract deployment and initialization
- ✅ Admin functions and access controls
- ✅ Voter registration and management
- ✅ Commit-reveal voting mechanism
- ✅ Stage transitions and validations
- ✅ Event emissions and data integrity
- ✅ Error handling and edge cases

## 🔧 Development

### Project Structure
```
blockchain-voting/
├── contracts/           # Smart contracts
├── scripts/            # Deployment scripts
├── test/              # Test files
├── voting-frontend/   # React frontend
├── artifacts/         # Compiled contracts
├── typechain-types/   # TypeScript types
└── cache/            # Hardhat cache
```

### Available Scripts

```bash
# Smart Contract
npm run compile        # Compile contracts
npm run test          # Run tests
npm run deploy        # Deploy to localhost
npm run node          # Start local blockchain

# Frontend
cd voting-frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run frontend tests
```

## 🔒 Security Features

- **Commit-Reveal Scheme**: Prevents vote buying and coercion
- **Cryptographic Hashing**: Keccak256 for vote commitments
- **Access Controls**: Role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Event Logging**: Complete audit trail
- **Gas Optimization**: Efficient smart contract design

## 🌐 Network Configuration

### Local Development
- **Network**: Hardhat Local
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337
- **Currency**: ETH

### Test Accounts
The system provides 20 test accounts with 10,000 ETH each for testing.

## 📊 Smart Contract Details

### Contract Address
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Key Functions
- `addCandidate(string name)` - Add election candidate
- `registerVoter(address voter)` - Register voter
- `commitVote(bytes32 hash)` - Commit vote
- `revealVote(uint256 candidateId, uint256 secret)` - Reveal vote
- `advanceStage()` - Move to next election stage
- `getElectionStats()` - Get election statistics

## 🚀 Deployment

### Local Development
1. Start Hardhat node
2. Deploy contract
3. Update frontend with contract address
4. Start frontend application

### Production Deployment
1. Deploy to testnet (Goerli, Sepolia)
2. Update contract address in frontend
3. Configure MetaMask for testnet
4. Deploy frontend to hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for error messages
2. Ensure MetaMask is properly configured
3. Verify the local blockchain is running
4. Check that the contract is deployed correctly

## 🎉 Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Frontend powered by [React](https://reactjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Web3 integration via [ethers.js](https://docs.ethers.org/)

---

**Ready to vote securely on the blockchain! 🗳️✨**