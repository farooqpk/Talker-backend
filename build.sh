#!/bin/bash

# Checkout frontend code
git clone https://github.com/farooqpk/chatApp-frontEnd.git chatApp-frontEnd

# Install frontend dependencies
cd chatApp-frontEnd
npm install

# Build frontend
npm run build

# Move frontend build to backend
cd ..
rm -rf ./client
mv chatApp-frontEnd/dist ./client

# Clean up
rm -rf chatApp-frontEnd
