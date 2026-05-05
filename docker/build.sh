#!/bin/bash
# ============================================
# Build FreeRADIUS Control Panel Docker Image
# ============================================
# This script builds the production Docker image
# Usage: ./docker/build.sh
# ============================================

set -e

echo "============================================"
echo "Building FreeRADIUS Control Panel Image"
echo "============================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Build the image
echo "🔨 Building Docker image..."
docker build -t freeradius-control:latest .

echo ""
echo "============================================"
echo "✅ Build Complete!"
echo "============================================"
echo ""
echo "Image created: freeradius-control:latest"
echo ""
echo "Next steps:"
echo "  1. Save image:     ./docker/save-image.sh"
echo "  2. Run container:  ./docker/run.sh"
echo "  3. Or use Docker Compose: docker-compose up -d"
echo ""
