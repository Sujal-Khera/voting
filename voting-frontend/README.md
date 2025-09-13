# Decentralized Voting System Frontend

A modern, responsive React frontend for a blockchain-based commit-reveal voting system built with TypeScript, Tailwind CSS, and ethers.js v6.

## Features

### 🏠 Landing Page
- Hero section with project branding
- Connect Wallet button with MetaMask integration
- Real-time election statistics
- Current phase indicator with progress bar
- Feature highlights with glassmorphism design

### 🔑 Admin Panel
- Add candidates with name input
- Register voters by Ethereum address
- Election phase controller (Setup → Commit → Reveal → Finished)
- Real-time candidate list with vote counts
- Admin-only access control

### 🗳️ Voter Dashboard
- Candidate selection with interactive cards
- Commit vote flow with secret phrase input
- Reveal vote flow with candidate ID and secret phrase
- Real-time voter status tracking
- Responsive design for all devices

### 📊 Results & Transparency
- Live bar chart showing vote counts (Recharts.js)
- Real-time event log with blockchain events
- Election stage progress tracker
- Candidate list with live vote updates
- Glassmorphism UI with smooth animations

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **ethers.js v6** for blockchain interaction
- **React Router** for navigation
- **Recharts** for data visualization
- **React Hot Toast** for notifications
- **MetaMask** integration

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- MetaMask browser extension
- Hardhat local network running on http://127.0.0.1:8545

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Smart Contract Setup

Make sure your Hardhat network is running and the contract is deployed:

```bash
# In the root directory
npx hardhat node
# In another terminal
npx hardhat run scripts/deploy.ts --network localhost
```

The contract address should be `0x5FbDB2315678afecb367f032d93F642f64180aa3` for localhost.

## Usage

### For Admins

1. Connect your MetaMask wallet (must be the admin address)
2. Navigate to the Admin panel
3. Add candidates during the Setup phase
4. Register voters by their Ethereum addresses
5. Advance the election through phases:
   - Setup → Commit → Reveal → Finished

### For Voters

1. Connect your MetaMask wallet
2. Ensure you're registered by the admin
3. During Commit phase:
   - Select a candidate
   - Enter a secret phrase
   - Commit your vote
4. During Reveal phase:
   - Enter the candidate ID and secret phrase
   - Reveal your vote

### For Observers

1. Navigate to the Results page
2. View live vote counts and election progress
3. Monitor real-time blockchain events
4. Track election phase changes

## Design Features

### UI/UX
- **Glassmorphism** design with backdrop blur effects
- **Gradient backgrounds** and text effects
- **Smooth animations** and hover effects
- **Responsive grid layouts** for all screen sizes
- **Dark theme** with blue/purple color scheme

### Web3 Integration
- **MetaMask detection** and connection
- **Automatic network switching** to Hardhat localhost
- **Real-time event listening** for blockchain events
- **Transaction status** tracking and notifications
- **Error handling** with user-friendly messages

### Performance
- **Optimized re-renders** with React hooks
- **Efficient state management** with context API
- **Lazy loading** for better performance
- **Responsive images** and components

## File Structure

```
src/
├── components/
│   ├── CandidateCard.tsx      # Candidate display component
│   ├── EventLog.tsx          # Real-time event display
│   ├── Navigation.tsx        # Main navigation bar
│   └── ResultsChart.tsx      # Vote count visualization
├── contexts/
│   └── Web3Context.tsx       # Web3 provider and hooks
├── hooks/
│   └── useWeb3.ts           # Web3 connection logic
├── pages/
│   ├── Admin.tsx            # Admin panel page
│   ├── Landing.tsx          # Home page
│   ├── Results.tsx          # Results and transparency page
│   └── Voter.tsx            # Voter dashboard page
├── types/
│   ├── global.d.ts          # Global type declarations
│   └── index.ts             # TypeScript interfaces
├── utils/
│   └── contractABI.json     # Smart contract ABI
├── App.tsx                  # Main app component
├── App.css                  # Custom styles and utilities
└── index.tsx               # App entry point
```

## Smart Contract Integration

The frontend integrates with the `CommitRevealElection.sol` smart contract:

- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network**: Hardhat Local (Chain ID: 31337)
- **RPC URL**: http://127.0.0.1:8545

### Key Functions Used

- `getElectionStats()` - Get current election statistics
- `getAllCandidates()` - Fetch all candidates
- `addCandidate()` - Add new candidate (admin only)
- `registerVoter()` - Register voter (admin only)
- `advanceStage()` - Move to next phase (admin only)
- `commitVote()` - Commit vote with hash
- `revealVote()` - Reveal vote with secret
- `generateCommitHash()` - Generate commit hash

## Customization

### Styling
- Modify `App.css` for custom styles
- Update Tailwind classes in components
- Change color scheme in CSS variables

### Contract Integration
- Update contract address in `useWeb3.ts`
- Modify ABI in `contractABI.json`
- Add new event listeners in `Results.tsx`

### Features
- Add new pages in `pages/` directory
- Create new components in `components/`
- Extend types in `types/index.ts`

## Troubleshooting

### Common Issues

1. **MetaMask not detected**
   - Ensure MetaMask is installed and unlocked
   - Check if the site is allowed to access MetaMask

2. **Network mismatch**
   - The app automatically switches to Hardhat localhost
   - If it fails, manually add the network in MetaMask

3. **Contract not found**
   - Ensure Hardhat node is running
   - Verify contract deployment
   - Check contract address in `useWeb3.ts`

4. **Transaction failures**
   - Check if you have enough ETH for gas
   - Ensure you're the admin for admin functions
   - Verify you're registered as a voter

### Development Tips

- Use browser dev tools to inspect Web3 state
- Check console for error messages
- Monitor network requests in dev tools
- Use React DevTools for component debugging

## License

This project is part of a blockchain voting system demonstration. Use responsibly and ensure compliance with local regulations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the smart contract documentation
- Open an issue in the repository