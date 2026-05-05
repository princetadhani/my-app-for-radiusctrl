#!/bin/bash
# ============================================
# Fix Docker Permissions
# ============================================
# This script adds the current user to the docker group
# so you don't need to use sudo for docker commands
# ============================================

set -e

echo "============================================"
echo "Fixing Docker Permissions"
echo "============================================"
echo ""

USER_NAME=$(whoami)

echo "Adding user '$USER_NAME' to docker group..."
sudo usermod -aG docker $USER_NAME

echo ""
echo "✅ Done!"
echo ""
echo "⚠️  IMPORTANT: You MUST log out and log back in for this to take effect!"
echo ""
echo "After logging back in, verify with:"
echo "  groups | grep docker"
echo ""
echo "Then you can run Docker commands without sudo:"
echo "  docker ps"
echo "  ./docker/build.sh"
echo ""
