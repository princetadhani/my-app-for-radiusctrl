#!/bin/bash
# ============================================
# Check Prerequisites for Docker Deployment
# ============================================
# This script verifies that all prerequisites are met
# before building/running the Docker container
# ============================================

set -e

echo "============================================"
echo "Checking Prerequisites"
echo "============================================"
echo ""

ERRORS=0

# Check Docker
echo "🔍 Checking Docker..."
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    echo "   ✅ Docker installed: $DOCKER_VERSION"
else
    echo "   ❌ Docker not installed"
    echo "      Install: https://docs.docker.com/get-docker/"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check FreeRADIUS
echo "🔍 Checking FreeRADIUS..."
if [ -d "/etc/freeradius/3.0" ]; then
    echo "   ✅ FreeRADIUS directory exists: /etc/freeradius/3.0"
else
    echo "   ❌ FreeRADIUS directory not found: /etc/freeradius/3.0"
    echo "      Install FreeRADIUS 3.0+"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check FreeRADIUS service
echo "🔍 Checking FreeRADIUS service..."
if systemctl status freeradius >/dev/null 2>&1; then
    echo "   ✅ FreeRADIUS service is running"
elif systemctl list-unit-files | grep -q freeradius; then
    echo "   ⚠️  FreeRADIUS service exists but not running"
    echo "      Start with: sudo systemctl start freeradius"
else
    echo "   ❌ FreeRADIUS service not found"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check user group membership
echo "🔍 Checking user permissions..."
if groups | grep -qE 'freerad|freeradius'; then
    echo "   ✅ User is in FreeRADIUS group"
else
    echo "   ⚠️  User NOT in FreeRADIUS group"
    echo "      Run: ./scripts/setup-permissions.sh"
    echo "      Then log out and log back in"
fi
echo ""

# Check sudo permissions
echo "🔍 Checking sudo access..."
if sudo -n systemctl status freeradius >/dev/null 2>&1; then
    echo "   ✅ Sudo access configured for FreeRADIUS"
else
    echo "   ⚠️  Sudo access not configured (or requires password)"
    echo "      Run: ./scripts/setup-permissions.sh"
fi
echo ""

# Check required directories
echo "🔍 Checking required directories..."
if [ -d "/var/log/freeradius" ]; then
    echo "   ✅ Log directory exists: /var/log/freeradius"
else
    echo "   ⚠️  Log directory not found: /var/log/freeradius"
    echo "      Create with: sudo mkdir -p /var/log/freeradius"
fi
echo ""

# Check systemd
echo "🔍 Checking systemd..."
if [ -d "/run/systemd" ]; then
    echo "   ✅ systemd is running"
else
    echo "   ❌ systemd not detected"
    echo "      This system may not support systemd service control"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "============================================"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All Prerequisites Met!"
    echo "============================================"
    echo ""
    echo "You can now:"
    echo "  1. Build: ./docker/build.sh"
    echo "  2. Run:   ./docker/run.sh"
    echo ""
else
    echo "❌ $ERRORS Critical Error(s) Found"
    echo "============================================"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo ""
    exit 1
fi
