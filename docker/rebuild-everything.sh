#!/bin/bash

##############################################################################
# Complete Rebuild Script
# Use this after making code changes/bug fixes
# This ensures a completely clean rebuild with no cached artifacts
##############################################################################

set -e

echo "============================================"
echo "Complete Rebuild - FreeRADIUS Control Panel"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  This will remove all cached files and rebuild everything${NC}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Step 1/7: Stopping and removing old container..."
sudo docker stop freeradius-control 2>/dev/null || true
sudo docker rm freeradius-control 2>/dev/null || true

echo ""
echo "Step 2/7: Removing old Docker image..."
sudo docker rmi freeradius-control:latest 2>/dev/null || true

echo ""
echo "Step 3/7: Cleaning frontend build..."
rm -rf .next
rm -rf node_modules

echo ""
echo "Step 4/7: Rebuilding frontend..."
npm install
npm run build

echo ""
echo "Step 5/7: Cleaning backend build..."
cd backend
rm -rf dist
rm -rf node_modules/

echo ""
echo "Step 6/7: Rebuilding backend..."
npm install
npm run build
cd ..

echo ""
echo "Step 7/7: Building Docker image..."
sudo ./docker/build.sh

echo ""
echo -e "${GREEN}✅ Complete rebuild finished!${NC}"
echo ""
echo "Next steps:"
echo "  1. Test it:    sudo ./docker/run.sh"
echo "  2. Verify:     sudo ./docker/test-deployment.sh"
echo "  3. Distribute: sudo ./docker/create-distribution-package.sh"
