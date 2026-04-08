#!/bin/bash

# FreeRADIUS UI - Complete Permission Setup
# This is the ONLY script you need to run!
#
# What it does:
#  1. Adds user to freerad group
#  2. Sets group write permissions (GROUP = USER permissions)
#  3. Includes ALL files (configs, modules, certs)
#  4. Sets COA & users.d directory ownership to freerad:freerad
#  5. Fixes existing COA & users.d files ownership/permissions
#  6. Configures sudo for validation/service control

set -e

echo "==========================================="
echo "FreeRADIUS UI - Complete Permission Setup"
echo "==========================================="
echo ""
echo "This script will configure ALL permissions:"
echo "  • Group permissions (freerad GROUP = freerad USER)"
echo "  • Certificate access (RadSec support)"
echo "  • COA directory ownership (freerad:freerad)"
echo "  • users.d directory symlink, ownership, and inheritance"
echo "  • Existing files (auto-fix ownership)"
echo ""

# Get current user
if [ "$EUID" -eq 0 ]; then
    USER_NAME=${SUDO_USER:-root}
else
    USER_NAME=$(whoami)
fi

echo "👤 Current user: $USER_NAME"
echo ""

# Check FreeRADIUS installation
echo "Checking FreeRADIUS installation..."

if getent group freerad >/dev/null 2>&1; then
    RADIUS_GROUP="freerad"
elif getent group freeradius >/dev/null 2>&1; then
    RADIUS_GROUP="freeradius"
else
    echo "❌ ERROR: FreeRADIUS group not found!"
    echo "   Please install FreeRADIUS first."
    exit 1
fi

if [ ! -d /etc/freeradius/3.0 ]; then
    echo "❌ ERROR: Directory /etc/freeradius/3.0 not found!"
    echo "   Please install FreeRADIUS 3.0 first."
    exit 1
fi

echo "✅ Found FreeRADIUS group: $RADIUS_GROUP"
echo "✅ Found directory: /etc/freeradius/3.0"
echo ""

# Confirm
echo "Ready to proceed with user '$USER_NAME' in group '$RADIUS_GROUP'?"
echo ""

read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Step 1: Add user to group
echo "[1/5] Adding user to $RADIUS_GROUP group..."
sudo usermod -aG $RADIUS_GROUP $USER_NAME
echo "✅ Done"
echo ""

# Step 2: Set group permissions on ALL directories (including certs)
echo "[2/5] Adding group write permission to ALL directories (including /certs/)..."
sudo find /etc/freeradius/3.0 -type d -exec chmod g+rw {} \;
echo "✅ Done"
echo ""

# Step 3: Set group permissions on ALL files (including certs)
echo "[3/5] Adding group write permission to ALL files (including /certs/)..."
sudo find /etc/freeradius/3.0 -type f -exec chmod g+rw {} \;
echo "✅ Done"
echo ""

# Step 4: Create helper directories and fix existing files
echo "[4/6] Creating helper directories and symlinks..."

# COA directory - owned by freerad:freerad (not root!)
sudo mkdir -p /etc/freeradius/3.0/coa
sudo chown $RADIUS_GROUP:$RADIUS_GROUP /etc/freeradius/3.0/coa
sudo chmod 770 /etc/freeradius/3.0/coa
echo "  ✓ COA directory: $RADIUS_GROUP:$RADIUS_GROUP (770)"

# Fix ownership of existing COA files
if [ "$(sudo ls -A /etc/freeradius/3.0/coa 2>/dev/null)" ]; then
    echo "  ℹ  Found existing COA files - fixing ownership..."
    sudo chown $RADIUS_GROUP:$RADIUS_GROUP /etc/freeradius/3.0/coa/* 2>/dev/null || true
    sudo chmod 664 /etc/freeradius/3.0/coa/* 2>/dev/null || true
    FILE_COUNT=$(sudo ls /etc/freeradius/3.0/coa | wc -l)
    echo "  ✓ Fixed $FILE_COUNT existing COA file(s)"
fi

# --- NEW: users.d Directory & Symlink Setup ---
USERS_DIR="/etc/freeradius/3.0/mods-config/files/users.d"
USERS_LINK="/etc/freeradius/3.0/users.d"

sudo mkdir -p $USERS_DIR
sudo chown $RADIUS_GROUP:$RADIUS_GROUP $USERS_DIR
# 2770: 2 sets SetGID (forces freerad group inheritance), 770 sets owner=rwx, group=rwx
sudo chmod 2770 $USERS_DIR
echo "  ✓ users.d directory: $RADIUS_GROUP:$RADIUS_GROUP (2770 with SetGID)"

# Force 664 on newly created files via Default ACLs (so group can read AND write)
if command -v setfacl >/dev/null 2>&1; then
    sudo setfacl -d -m u::rw-,g::rw-,o::r-- $USERS_DIR
    echo "  ✓ users.d ACLs: Configured to force 660 on new files"
else
    echo "  ⚠️ setfacl not found. File group will be inherited, but strict 660 depends on your umask."
fi

# Create Symlink
sudo ln -sfn $USERS_DIR $USERS_LINK
sudo chown -h $RADIUS_GROUP:$RADIUS_GROUP $USERS_LINK
echo "  ✓ Created symlink: $USERS_LINK -> $USERS_DIR (owned by $RADIUS_GROUP)"

# Fix existing files in users.d
if [ "$(sudo ls -A $USERS_DIR 2>/dev/null)" ]; then
    echo "  ℹ  Found existing users.d files - fixing ownership..."
    sudo chown $RADIUS_GROUP:$RADIUS_GROUP $USERS_DIR/* 2>/dev/null || true
    sudo chmod 664 $USERS_DIR/* 2>/dev/null || true
    USER_FILE_COUNT=$(sudo ls $USERS_DIR | wc -l)
    echo "  ✓ Fixed $USER_FILE_COUNT existing users.d file(s)"
fi
# ----------------------------------------------

# Logs - add group write
if [ -d /var/log/freeradius ]; then
    sudo find /var/log/freeradius -type d -exec chmod g+w {} \; 2>/dev/null || true
    sudo find /var/log/freeradius -type f -exec chmod g+w {} \; 2>/dev/null || true
    echo "  ✓ Log directory: group write enabled"
fi

echo "✅ Done"
echo ""

# Step 5: Configure sudo
echo "[5/6] Configuring sudo permissions..."
SUDOERS_FILE="/etc/sudoers.d/freeradius-ui"

cat <<EOF | sudo tee $SUDOERS_FILE >/dev/null
# FreeRADIUS UI - Minimal sudo permissions
$USER_NAME ALL=(ALL) NOPASSWD: /usr/sbin/freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl * freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl * freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/radclient
EOF

sudo chmod 0440 $SUDOERS_FILE

if sudo visudo -c -f $SUDOERS_FILE >/dev/null 2>&1; then
    echo "✅ Done"
else
    echo "❌ Sudoers syntax error - removing file"
    sudo rm -f $SUDOERS_FILE
    exit 1
fi

# Step 6: Verify permissions
echo "[6/6] Verifying permissions..."
echo ""

EXAMPLE_FILE="/etc/freeradius/3.0/radiusd.conf"
if [ -f "$EXAMPLE_FILE" ]; then
    echo "Config file permissions:"
    ls -l "$EXAMPLE_FILE" | awk '{print "  " $1 " " $3 ":" $4 " " $9}'
fi

if [ -d /etc/freeradius/3.0/certs ]; then
    echo "Certificate directory permissions:"
    ls -ld /etc/freeradius/3.0/certs | awk '{print "  " $1 " " $3 ":" $4 " certs/"}'
fi

if [ -d /etc/freeradius/3.0/coa ]; then
    echo "COA directory permissions:"
    ls -ld /etc/freeradius/3.0/coa | awk '{print "  " $3 ":" $4 " " $1 " coa/"}'
fi

if [ -L /etc/freeradius/3.0/users.d ]; then
    echo "users.d symlink:"
    ls -l /etc/freeradius/3.0/users.d | awk '{print "  " $9 " " $10 " " $11}'
    echo "users.d target directory permissions:"
    ls -ld /etc/freeradius/3.0/mods-config/files/users.d | awk '{print "  " $3 ":" $4 " " $1 " users.d/"}'
fi

echo ""
echo "✅ Verification complete"
echo ""
echo "==========================================="
echo "🎉 Setup Complete!"
echo "==========================================="
echo ""
echo "✅ Group permissions set (GROUP = USER)"
echo "✅ Certificate access enabled (RadSec ready)"
echo "✅ COA directory owned by $RADIUS_GROUP:$RADIUS_GROUP"
echo "✅ users.d symlink created and owned by $RADIUS_GROUP:$RADIUS_GROUP (770)"
if [ "$(sudo ls -A /etc/freeradius/3.0/coa 2>/dev/null)" ] || [ "$(sudo ls -A /etc/freeradius/3.0/mods-config/files/users.d 2>/dev/null)" ]; then
    echo "✅ Existing files in helper directories fixed"
fi
echo "✅ Sudo configured"
echo ""
echo "⚠️  CRITICAL: You MUST log out and log back in now!"
echo ""
echo "Why? Group membership only takes effect in new login sessions."
echo ""
echo "After logging back in, verify:"
echo "  1. Group:      groups | grep $RADIUS_GROUP"
echo "  2. Write test: touch /etc/freeradius/3.0/test.tmp && rm /etc/freeradius/3.0/test.tmp"
echo "  3. Start app:  cd backend && npm run dev"
echo ""