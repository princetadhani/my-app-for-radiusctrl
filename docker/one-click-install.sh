#!/bin/bash

##############################################################################
# FreeRADIUS Control Panel - One-Click Installation
# 
# This script:
#   1. Downloads the latest release from GitHub
#   2. Checks and installs prerequisites (Docker)
#   3. Configures host system permissions
#   4. Loads Docker image
#   5. Starts the application
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
#
# Or download and run:
#   wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh
#   chmod +x one-click-install.sh
#   sudo ./one-click-install.sh
##############################################################################

set -e

# Configuration - UPDATE THESE
GITHUB_USER="princetadhani"              # TODO: Update with your GitHub username
GITHUB_REPO="my-app-for-radiusctrl"                   # TODO: Update with your repository name
RELEASE_TAG="latest"                      # Or specific version like "v1.0.0"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run as root (use sudo)${NC}"
    exit 1
fi

echo "============================================"
echo "FreeRADIUS Control Panel - One-Click Install"
echo "============================================"
echo ""

##############################################################################
# Step 1: Check Prerequisites
##############################################################################
echo -e "${BLUE}[1/6] Checking prerequisites...${NC}"

# Check for required commands
for cmd in curl wget tar acl; do
    if ! command -v $cmd &> /dev/null; then
        echo "Installing $cmd..."
        apt-get update -qq && apt-get install -y $cmd
    fi
done

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

# Check for docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing docker-compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ docker-compose installed${NC}"
else
    echo -e "${GREEN}✓ docker-compose already installed${NC}"
fi

##############################################################################
# Step 2: Download Latest Release
##############################################################################
echo ""
echo -e "${BLUE}[2/6] Downloading latest release from GitHub...${NC}"

# Create temp directory
WORK_DIR="/tmp/freeradius-control-install-$$"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Get latest release URL
if [ "$RELEASE_TAG" = "latest" ]; then
    DOWNLOAD_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest/download/freeradius-control-docker.tar.gz"
else
    DOWNLOAD_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/download/${RELEASE_TAG}/freeradius-control-docker.tar.gz"
fi

echo "Downloading from: $DOWNLOAD_URL"
if wget -q --show-progress "$DOWNLOAD_URL"; then
    echo -e "${GREEN}✓ Download complete${NC}"
else
    echo -e "${RED}✗ Download failed. Please check:${NC}"
    echo "  1. GitHub repository: ${GITHUB_USER}/${GITHUB_REPO}"
    echo "  2. Release exists and contains: freeradius-control-docker.tar.gz"
    echo "  3. Release is public (not private)"
    exit 1
fi

# Extract
echo "Extracting..."
tar -xzf freeradius-control-docker.tar.gz
cd freeradius-control-docker

echo -e "${GREEN}✓ Extracted successfully${NC}"

##############################################################################
# Step 3: Setup Host Permissions & FreeRADIUS Installation
# Note: FreeRADIUS installation/service management is handled by setup-permissions.sh
##############################################################################
echo ""
echo -e "${BLUE}[3/5] Configuring host system permissions and FreeRADIUS...${NC}"

if [ -f "./scripts/setup-permissions.sh" ]; then
    chmod +x ./scripts/setup-permissions.sh
    AUTO_YES=1 ./scripts/setup-permissions.sh
    echo -e "${GREEN}✓ Permissions configured and FreeRADIUS setup complete${NC}"
else
    echo -e "${YELLOW}⚠ setup-permissions.sh not found, skipping...${NC}"
fi



##############################################################################
# Step 4: Load Docker Image
##############################################################################
echo ""
echo -e "${BLUE}[4/5] Loading Docker image...${NC}"

if [ -f "./freeradius-control.tar" ]; then
    docker load < ./freeradius-control.tar
    echo -e "${GREEN}✓ Docker image loaded${NC}"
else
    echo -e "${RED}✗ Docker image file not found: ./freeradius-control.tar${NC}"
    exit 1
fi

##############################################################################
# Step 5: Start Container
##############################################################################
echo ""
echo -e "${BLUE}[5/5] Starting FreeRADIUS Control Panel...${NC}"

# Stop and remove existing container if it exists
docker stop freeradius-control 2>/dev/null || true
docker rm freeradius-control 2>/dev/null || true

# Start with docker-compose
if [ -f "./docker-compose.yml" ]; then
    docker-compose up -d
    echo -e "${GREEN}✓ Container started${NC}"
else
    echo -e "${RED}✗ docker-compose.yml not found${NC}"
    exit 1
fi

# Wait for services to start
echo ""
echo "Waiting for services to start..."
sleep 5

# Check if container is running
if docker ps | grep -q freeradius-control; then
    echo -e "${GREEN}✓ Container is running${NC}"
else
    echo -e "${RED}✗ Container failed to start${NC}"
    echo "Check logs with: docker logs freeradius-control"
    exit 1
fi

##############################################################################
# Installation Complete
##############################################################################
echo ""
echo "============================================"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "============================================"
echo ""
echo "Access the application at:"
echo -e "${BLUE}  http://$(hostname -I | awk '{print $1}')${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f freeradius-control"
echo "  Stop:         docker-compose down"
echo "  Restart:      docker-compose restart"
echo "  Status:       docker ps | grep freeradius-control"
echo ""
echo "Installation files saved to: $WORK_DIR"
echo ""
