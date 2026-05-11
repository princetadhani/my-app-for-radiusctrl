#!/bin/sh
# ============================================
# FreeRADIUS Control Panel - Container Entrypoint
# ============================================
# This script:
#   1. Validates mounted volumes
#   2. Sets up proper permissions
#   3. Configures systemd access (if needed)
#   4. Starts supervisord to manage all services
# ============================================

set -e

echo "============================================"
echo "FreeRADIUS Control Panel - Starting..."
echo "============================================"
echo ""

# ============================================
# Validate Required Mounts
# ============================================
echo "🔍 Validating mounted volumes..."

if [ ! -d "/etc/freeradius/3.0" ]; then
    echo "❌ ERROR: /etc/freeradius/3.0 is not mounted!"
    echo "   Please run with: -v /etc/freeradius/3.0:/etc/freeradius/3.0"
    exit 1
fi

if [ ! -d "/var/log/freeradius" ]; then
    echo "⚠️  WARNING: /var/log/freeradius is not mounted!"
    echo "   Log streaming may not work properly."
fi

echo "✅ Required volumes mounted"
echo ""

# ============================================
# Check FreeRADIUS Service (Host)
# ============================================
echo "🔍 Checking host FreeRADIUS service..."

if ! sudo systemctl status freeradius >/dev/null 2>&1; then
    echo "⚠️  WARNING: Cannot access FreeRADIUS service on host"
    echo "   Service control features may not work."
    echo "   Make sure the container has proper privileges."
else
    echo "✅ FreeRADIUS service accessible"
fi
echo ""

# ============================================
# Set Permissions for Mounted Directories
# ============================================
echo "🔧 Setting up permissions..."

# Get the GID of the FreeRADIUS directory
if [ -d "/etc/freeradius/3.0" ]; then
    FREERAD_GID=$(stat -c '%g' /etc/freeradius/3.0)
    FREERAD_GROUP=$(stat -c '%G' /etc/freeradius/3.0)

    echo "📂 FreeRADIUS directory GID: $FREERAD_GID ($FREERAD_GROUP)"

    # Create the group if it doesn't exist
    if ! getent group $FREERAD_GID >/dev/null 2>&1; then
        echo "📝 Creating group with GID $FREERAD_GID..."
        addgroup -g $FREERAD_GID freerad 2>/dev/null || true
    fi

    # Add node user to the FreeRADIUS group
    EXISTING_GROUP=$(getent group $FREERAD_GID | cut -d: -f1)
    if [ -n "$EXISTING_GROUP" ]; then
        echo "➕ Adding node user to group: $EXISTING_GROUP"
        addgroup node $EXISTING_GROUP 2>/dev/null || true
    fi
fi

# Create COA directory if it doesn't exist
if [ ! -d "/etc/freeradius/3.0/coa" ]; then
    echo "📁 Creating COA directory..."
    sudo mkdir -p /etc/freeradius/3.0/coa || true
fi

echo "✅ Permissions configured"
echo ""

# ============================================
# Display Configuration
# ============================================
echo "📋 Configuration:"
echo "   FreeRADIUS Base: ${FREERADIUS_BASE_DIR}"
echo "   Log File: ${FREERADIUS_LOG_FILE}"
echo "   COA Directory: ${FREERADIUS_COA_DIR}"
echo "   Service Name: ${FREERADIUS_SERVICE_NAME}"
echo "   Backend Port: ${PORT}"
echo "   CORS Origin: ${WEBSOCKET_CORS_ORIGIN}"
echo ""

# ============================================
# Display Access Information
# ============================================
echo "============================================"
echo "🚀 Starting Services..."
echo "============================================"
echo ""
echo "Access the application at:"
echo "   http://<your-host-ip>:9000"
echo ""
echo "Services starting:"
echo "   - nginx (port 80 internal, mapped to 9000 on host)"
echo "   - Next.js frontend (port 3000)"
echo "   - Backend API (port 3001)"
echo ""

# ============================================
# Start Supervisord
# ============================================
exec /usr/bin/supervisord -c /etc/supervisord.conf
