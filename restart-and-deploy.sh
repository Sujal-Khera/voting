#!/bin/bash

echo "🔄 Restarting blockchain voting system..."

# Kill any existing hardhat processes
echo "Stopping existing Hardhat nodes..."
pkill -f "hardhat node" 2>/dev/null || true
sleep 2

# Start Hardhat node in background
echo "Starting new Hardhat node..."
npx hardhat node > hardhat-node.log 2>&1 &
NODE_PID=$!
echo "Hardhat node started with PID: $NODE_PID"

# Wait for node to start
echo "Waiting for node to be ready..."
sleep 5

# Deploy the updated contract
echo "Deploying updated contract..."
npx hardhat run scripts/deploy.ts --network localhost

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo "📋 Next steps:"
    echo "   1. The new contract address will be shown above"
    echo "   2. Update the frontend contract address if needed"
    echo "   3. Start/restart the frontend application"
    echo ""
    echo "🌐 Hardhat node is running in the background (PID: $NODE_PID)"
    echo "📜 Node logs are being written to: hardhat-node.log"
    echo ""
    echo "To stop the node later, run: kill $NODE_PID"
else
    echo "❌ Contract deployment failed!"
    kill $NODE_PID 2>/dev/null || true
    exit 1
fi