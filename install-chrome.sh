#!/bin/bash

# Install Chrome in WSL2
echo "Installing Google Chrome..."
sudo apt-get update
sudo apt-get install -y /tmp/chrome.deb

# Fix any dependency issues
sudo apt-get install -f -y

echo "Chrome installed successfully!"
google-chrome --version
