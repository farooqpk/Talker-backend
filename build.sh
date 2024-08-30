#!/bin/bash

# Debugging: Print current directory and list files
echo "Current Directory: $(pwd)"
echo "Listing Files:"
ls -la

# Checkout frontend code
echo "Cloning the frontend repository..."
git clone https://github.com/farooqpk/chatApp-frontEnd.git chatApp-frontEnd

# Debugging: Check if the clone was successful
if [ ! -d "chatApp-frontEnd" ]; then
  echo "Error: Failed to clone the frontend repository."
  exit 1
fi

# Navigate to frontend directory
cd chatApp-frontEnd

# Debugging: Print current directory and list files
echo "Current Directory (Frontend): $(pwd)"
echo "Listing Files (Frontend):"
ls -la

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Debugging: Check if npm install was successful
if [ $? -ne 0 ]; then
  echo "Error: Failed to install frontend dependencies."
  exit 1
fi

# Verify @vitejs/plugin-react-swc is installed
if [ ! -d "node_modules/@vitejs/plugin-react-swc" ]; then
  echo "Error: @vitejs/plugin-react-swc is missing. Installing it..."
  npm install @vitejs/plugin-react-swc --save-dev
fi

# Build frontend
echo "Building the frontend..."
npm run build

# Debugging: Check if the build was successful
if [ $? -ne 0 ]; then
  echo "Error: Frontend build failed."
  exit 1
fi

# Debugging: Verify the build output directory
if [ ! -d "dist" ]; then
  echo "Error: Frontend build output directory 'dist' is missing."
  exit 1
fi

# Move frontend build to backend
cd ..
echo "Moving frontend build to the backend..."
rm -rf ./client
mv chatApp-frontEnd/dist ./client

# Debugging: Verify the move was successful
if [ ! -d "./client" ]; then
  echo "Error: Failed to move frontend build to backend."
  exit 1
fi

# Clean up
echo "Cleaning up..."
rm -rf chatApp-frontEnd

echo "Build process completed successfully!"
