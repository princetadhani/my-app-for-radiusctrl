#!/bin/bash
# ============================================
# Save FreeRADIUS Control Panel Docker Image
# ============================================
# This script exports the Docker image to a .tar file for distribution
# Usage: ./docker/save-image.sh
# ============================================

set -e

echo "============================================"
echo "Saving Docker Image for Distribution"
echo "============================================"
echo ""

# Create output directory
mkdir -p dist

# Save image
echo "📦 Saving image to dist/freeradius-control.tar..."
docker save freeradius-control:latest | gzip > dist/freeradius-control.tar.gz

# Get file size
FILE_SIZE=$(du -h dist/freeradius-control.tar.gz | cut -f1)

echo ""
echo "============================================"
echo "✅ Image Saved Successfully!"
echo "============================================"
echo ""
echo "File: dist/freeradius-control.tar.gz"
echo "Size: $FILE_SIZE"
echo ""
echo "To distribute this image:"
echo "  1. Share the file: dist/freeradius-control.tar.gz"
echo "  2. Recipients load it: docker load < freeradius-control.tar.gz"
echo "  3. Recipients run: ./docker/run.sh"
echo ""
