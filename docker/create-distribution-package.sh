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
DIST_DIR="dist/freeradius-control-package"
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

cp dist/freeradius-control.tar.gz "$DIST_DIR/"
echo "   ✅ Image copied"
echo ""

# 2. Copy scripts
echo "2️⃣  Copying scripts..."
mkdir -p "$DIST_DIR/docker"
cp docker/run.sh "$DIST_DIR/docker/"
cp docker/load-image.sh "$DIST_DIR/docker/"
cp docker/one-click-install.sh "$DIST_DIR/docker/"
cp docker/QUICKSTART.md "$DIST_DIR/docker/"
cp docker/SCRIPTS_GUIDE.md "$DIST_DIR/docker/"

mkdir -p "$DIST_DIR/scripts"
cp scripts/setup-permissions.sh "$DIST_DIR/scripts/"
echo "   ✅ Scripts copied"
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
7. Access: http://<your-ip>

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
tar -czf freeradius-control-complete.tar.gz freeradius-control-package/
FINAL_SIZE=$(du -h freeradius-control-complete.tar.gz | cut -f1)
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
echo "📦 Package: dist/freeradius-control-complete.tar.gz"
echo "📏 Size: $FINAL_SIZE"
echo ""
echo "📋 Contents:"
echo "   - Docker image"
echo "   - Setup scripts"
echo "   - Documentation"
echo "   - Quick start guide"
echo ""
echo "🚀 To distribute:"
echo "   1. Share: dist/freeradius-control-complete.tar.gz"
echo "   2. Recipients extract: tar -xzf freeradius-control-complete.tar.gz"
echo "   3. Recipients follow: INSTALL.txt"
echo ""
