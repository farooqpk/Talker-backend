#!/bin/bash

# Checkout frontend code
echo "Cloning the frontend repository..."
git clone https://github.com/farooqpk/chatApp-frontEnd.git chatApp-frontEnd

# Navigate to frontend directory
cd chatApp-frontEnd

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building the frontend..."
npm run build

# Move frontend build to backend
cd ..
echo "Moving frontend build to the backend..."
rm -rf ./client
mv chatApp-frontEnd/dist ./client

# Clean up
echo "Cleaning up..."
rm -rf chatApp-frontEnd

echo "Build process completed successfully!"
