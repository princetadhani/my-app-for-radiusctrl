#!/bin/bash
# ============================================
# Create Complete Distribution Package
# ============================================
# This script creates a complete package for distribution
# that includes:
#   - Docker image (.tar.gz)
#   - All necessary scripts
#   - Documentation
#   - Setup files
# ============================================

set -e

echo "============================================"
echo "Creating Distribution Package"
echo "============================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Create distribution directory
DIST_DIR="dist/freeradius-control-docker"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "📦 Creating package directory: $DIST_DIR"
echo ""

# 1. Save Docker image
echo "1️⃣  Saving Docker image..."
if [ ! -f "dist/freeradius-control.tar.gz" ]; then
    echo "   Building and saving image..."
    ./docker/save-image.sh
else
    echo "   ✅ Image already exists: dist/freeradius-control.tar.gz"
fi

# Extract the .tar file from .tar.gz for the package
echo "   Extracting .tar from .tar.gz..."
gunzip -c dist/freeradius-control.tar.gz > "$DIST_DIR/freeradius-control.tar"
echo "   ✅ Image copied"
echo ""

# 2. Copy scripts and config
echo "2️⃣  Copying scripts and configuration..."
mkdir -p "$DIST_DIR/docker"
cp docker/run.sh "$DIST_DIR/docker/"
cp docker/load-image.sh "$DIST_DIR/docker/"
cp docker/one-click-install.sh "$DIST_DIR/docker/"
cp docker/QUICKSTART.md "$DIST_DIR/docker/"
cp docker/SCRIPTS_GUIDE.md "$DIST_DIR/docker/"

# Copy docker-compose.yml to root of package
cp docker-compose.yml "$DIST_DIR/"

mkdir -p "$DIST_DIR/scripts"
cp scripts/setup-permissions.sh "$DIST_DIR/scripts/"
echo "   ✅ Scripts and configuration copied"
echo ""

# 3. Copy documentation
echo "3️⃣  Copying documentation..."
cp DOCKER_DEPLOYMENT.md "$DIST_DIR/" 2>/dev/null || true
cp docker/QUICKSTART.md "$DIST_DIR/QUICKSTART.md"
cp README.md "$DIST_DIR/" 2>/dev/null || true
cp INSTALLATION_FOR_USERS.md "$DIST_DIR/" 2>/dev/null || true
echo "   ✅ Documentation copied"
echo ""

# 4. Create installation instructions
echo "4️⃣  Creating installation guide..."
cat > "$DIST_DIR/INSTALL.txt" << 'EOF'
╔════════════════════════════════════════════════════════════╗
║  FreeRADIUS Control Panel - Installation Instructions     ║
╚════════════════════════════════════════════════════════════╝

📦 WHAT'S INCLUDED:
  - Docker image (freeradius-control.tar.gz)
  - Setup scripts
  - Documentation

🎯 QUICK INSTALLATION:

1. Extract this package
2. Open terminal in this directory
3. Run: ./scripts/setup-permissions.sh
4. Log out and log back in
5. Run: ./docker/load-image.sh freeradius-control.tar.gz
6. Run: ./docker/run.sh
7. Access: http://<your-ip>:9000

📖 DETAILED INSTRUCTIONS:
  See QUICKSTART.md or DOCKER_DEPLOYMENT.md

⚠️  PREREQUISITES:
  - Docker installed
  - FreeRADIUS 3.0+ installed
  - Linux with systemd

❓ TROUBLESHOOTING:
  See DOCKER_DEPLOYMENT.md, section "Troubleshooting"

🆘 SUPPORT:
  - GitHub: [your-repo-url]
  - Documentation: README.md

═══════════════════════════════════════════════════════════
EOF

echo "   ✅ Installation guide created"
echo ""

# 5. Make scripts executable
echo "5️⃣  Making scripts executable..."
chmod +x "$DIST_DIR/docker/"*.sh
chmod +x "$DIST_DIR/scripts/"*.sh
echo "   ✅ Scripts made executable"
echo ""

# 6. Create archive
echo "6️⃣  Creating final archive..."
cd dist
tar -czf freeradius-control-docker.tar.gz freeradius-control-docker/
FINAL_SIZE=$(du -h freeradius-control-docker.tar.gz | cut -f1)
cd ..
echo "   ✅ Archive created"
echo ""

# 7. Cleanup
echo "7️⃣  Cleaning up temporary files..."
# Keep the package directory for reference
echo "   ✅ Done"
echo ""

echo "============================================"
echo "✅ Distribution Package Created!"
echo "============================================"
echo ""
echo "📦 Package: dist/freeradius-control-docker.tar.gz"
echo "📏 Size: $FINAL_SIZE"
echo ""
echo "📋 Contents:"
echo "   - Docker image"
echo "   - Setup scripts"
echo "   - Documentation"
echo "   - Quick start guide"
echo ""
echo "🚀 Upload to GitHub Releases:"
echo "   1. Go to: https://github.com/princetadhani/my-app-for-radiusctrl/releases"
echo "   2. Create new release"
echo "   3. Upload: dist/freeradius-control-docker.tar.gz"
echo "   4. File is already named correctly - no rename needed!"
echo ""
echo "📋 One-click install command for users:"
echo "   curl -sSL https://raw.githubusercontent.com/princetadhani/my-app-for-radiusctrl/main/docker/one-click-install.sh | sudo bash"
echo ""
