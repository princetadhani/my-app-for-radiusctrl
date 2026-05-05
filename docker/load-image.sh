#!/bin/bash
# ============================================
# Load FreeRADIUS Control Panel Docker Image
# ============================================
# This script loads a Docker image from a .tar.gz file
# Usage: ./docker/load-image.sh [path-to-image.tar.gz]
# ============================================

set -e

echo "============================================"
echo "Loading FreeRADIUS Control Panel Image"
echo "============================================"
echo ""

# Check if file is provided
if [ -z "$1" ]; then
    # Look for default location
    if [ -f "dist/freeradius-control.tar.gz" ]; then
        IMAGE_FILE="dist/freeradius-control.tar.gz"
    else
        echo "❌ Error: No image file specified"
        echo ""
        echo "Usage: $0 <image-file.tar.gz>"
        echo "Example: $0 freeradius-control.tar.gz"
        exit 1
    fi
else
    IMAGE_FILE="$1"
fi

# Check if file exists
if [ ! -f "$IMAGE_FILE" ]; then
    echo "❌ Error: File not found: $IMAGE_FILE"
    exit 1
fi

echo "📥 Loading image from: $IMAGE_FILE"
gunzip -c "$IMAGE_FILE" | docker load

echo ""
echo "============================================"
echo "✅ Image Loaded Successfully!"
echo "============================================"
echo ""
echo "Image: freeradius-control:latest"
echo ""
echo "Next step:"
echo "  Run: ./docker/run.sh"
echo ""
