#!/bin/bash

set -e

echo "🚀 FreeRADIUS UI - Permission Setup Script"
echo "=========================================="
echo ""

# Detect user
if [ "$EUID" -eq 0 ]; then
    APP_USER=${SUDO_USER:-root}
else
    APP_USER=$(whoami)
fi

echo "👤 Setting up for user: $APP_USER"
echo ""

# -------------------------------------------------
# Ensure correct FreeRADIUS group
# -------------------------------------------------
echo "🔧 Checking FreeRADIUS group..."

if getent group freerad >/dev/null; then
    RADIUS_GROUP="freerad"
elif getent group freeradius >/dev/null; then
    RADIUS_GROUP="freeradius"
else
    echo "❌ FreeRADIUS group not found. Please install FreeRADIUS first."
    exit 1
fi

echo "✅ Found FreeRADIUS group: $RADIUS_GROUP"

# Add app user to FreeRADIUS group
echo "👥 Adding $APP_USER to $RADIUS_GROUP group..."
sudo usermod -aG $RADIUS_GROUP $APP_USER

# -------------------------------------------------
# Group Permissions (Native Access - No sudo cp needed!)
# -------------------------------------------------
echo "🔐 Setting group permissions on FreeRADIUS directories..."

# Create CoA directory
sudo mkdir -p /etc/freeradius/3.0/coa
sudo chown freerad:$RADIUS_GROUP /etc/freeradius/3.0/coa

# Allow group to WRITE to all directories EXCEPT certs
sudo find /etc/freeradius/3.0 -type d -not -path "*/certs*" -exec chmod 775 {} +

# Allow group to WRITE to all files EXCEPT certs
sudo find /etc/freeradius/3.0 -type f -not -path "*/certs*" -exec chmod 664 {} +

# Allow group to read logs
sudo chown -R freerad:$RADIUS_GROUP /var/log/freeradius
sudo chmod -R 775 /var/log/freeradius

echo "✅ File permissions configured"

# -------------------------------------------------
# Sudoers (Minimal - Only for commands that need root)
# -------------------------------------------------
echo "🛡️  Configuring minimal sudo permissions..."

SUDOERS_FILE="/etc/sudoers.d/freeradius-ui"

cat <<EOF | sudo tee $SUDOERS_FILE >/dev/null
# FreeRADIUS UI Backend - Minimal sudo permissions
$APP_USER ALL=(ALL) NOPASSWD: /usr/sbin/freeradius -C -D *
$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/radclient
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
$APP_USER ALL=(ALL) NOPASSWD: /bin/systemctl status freeradius
$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload freeradius
$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart freeradius
$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl show freeradius
$APP_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl status freeradius
EOF

sudo chmod 0440 $SUDOERS_FILE

# Verify sudoers syntax
if sudo visudo -c -f $SUDOERS_FILE; then
    echo "✅ Sudoers configuration valid"
else
    echo "❌ Sudoers configuration invalid! Removing..."
    sudo rm $SUDOERS_FILE
    exit 1
fi

# -------------------------------------------------
# Test permissions
# -------------------------------------------------
echo ""
echo "🧪 Testing permissions..."

# Test file write
TEST_FILE="/etc/freeradius/3.0/test_write_$(date +%s).tmp"
if touch $TEST_FILE 2>/dev/null; then
    echo "✅ File write permission: OK"
    rm $TEST_FILE
else
    echo "⚠️  File write permission: FAILED (you may need to log out and back in for group changes to take effect)"
fi

# Test sudo validation
if sudo freeradius -C -D /etc/freeradius/3.0 2>&1 | grep -q "Configuration" || [ $? -eq 0 ]; then
    echo "✅ Sudo validation permission: OK"
else
    echo "⚠️  Sudo validation permission: FAILED"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: You may need to log out and back in for group changes to take effect!"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for group membership)"
echo "2. cd backend && npm install"
echo "3. cp .env.example .env"
echo "4. npm run dev"
echo ""
