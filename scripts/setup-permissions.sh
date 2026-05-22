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

# Check FreeRADIUS installation and install if missing
echo "Checking FreeRADIUS installation..."

# Check if FreeRADIUS is installed
FREERADIUS_INSTALLED=false
if command -v freeradius >/dev/null 2>&1 || [ -d /etc/freeradius/3.0 ]; then
    FREERADIUS_INSTALLED=true
fi

if [ "$FREERADIUS_INSTALLED" = false ]; then
    echo "⚠️  FreeRADIUS not found. Installing FreeRADIUS and freeradius-utils..."

    # Detect package manager and install
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -qq
        sudo apt-get install -y freeradius freeradius-utils
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y freeradius freeradius-utils
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y freeradius freeradius-utils
    elif command -v zypper >/dev/null 2>&1; then
        sudo zypper install -y freeradius-server freeradius-server-utils
    else
        echo "❌ ERROR: Could not detect package manager!"
        echo "   Please install FreeRADIUS manually:"
        echo "   - Debian/Ubuntu: sudo apt-get install freeradius freeradius-utils"
        echo "   - RHEL/CentOS:   sudo yum install freeradius freeradius-utils"
        exit 1
    fi

    echo "✅ FreeRADIUS installed successfully"

    # After installation, enable and start the service
    echo "📦 Enabling and starting FreeRADIUS service..."
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl enable freeradius 2>/dev/null || true
        sudo systemctl start freeradius 2>/dev/null || true
        echo "✅ FreeRADIUS service enabled and started"
    else
        echo "⚠️  systemctl not found. Please start FreeRADIUS manually."
    fi
else
    echo "✅ FreeRADIUS is already installed"

    # FreeRADIUS is installed - manage the service
    if command -v systemctl >/dev/null 2>&1; then
        echo "🔧 Checking FreeRADIUS service status..."

        # Check if service is enabled
        if ! sudo systemctl is-enabled freeradius >/dev/null 2>&1; then
            echo "⚠️  FreeRADIUS service is disabled. Enabling..."
            sudo systemctl enable freeradius 2>/dev/null || true
            echo "✅ FreeRADIUS service enabled"
        else
            echo "✅ FreeRADIUS service is already enabled"
        fi

        # Check if service is running
        if ! sudo systemctl is-active freeradius >/dev/null 2>&1; then
            echo "⚠️  FreeRADIUS service is stopped. Starting..."
            sudo systemctl start freeradius 2>/dev/null || true
            echo "✅ FreeRADIUS service started"
        else
            echo "🔄 FreeRADIUS service is running. Restarting for better experience..."
            sudo systemctl restart freeradius 2>/dev/null || true
            echo "✅ FreeRADIUS service restarted"
        fi
    else
        echo "⚠️  systemctl not found. Please manage FreeRADIUS service manually."
    fi
fi

# Determine FreeRADIUS group
if getent group freerad >/dev/null 2>&1; then
    RADIUS_GROUP="freerad"
elif getent group freeradius >/dev/null 2>&1; then
    RADIUS_GROUP="freeradius"
else
    echo "❌ ERROR: FreeRADIUS group not found even after installation!"
    echo "   This is unusual. Please check your FreeRADIUS installation."
    exit 1
fi

if [ ! -d /etc/freeradius/3.0 ]; then
    echo "❌ ERROR: Directory /etc/freeradius/3.0 not found!"
    echo "   FreeRADIUS may not be installed correctly."
    exit 1
fi

echo "✅ Found FreeRADIUS group: $RADIUS_GROUP"
echo "✅ Found directory: /etc/freeradius/3.0"
echo ""

# Auto-proceed (no more prompts)
echo "Proceeding with user '$USER_NAME' in group '$RADIUS_GROUP'..."

echo ""

# Step 1: Add user to group
echo "[1/6] Adding user to $RADIUS_GROUP group..."
sudo usermod -aG $RADIUS_GROUP $USER_NAME
echo "✅ Done"
echo ""

# Step 2: Set group permissions on ALL directories (including certs)
echo "[2/6] Adding group write permission to ALL directories (including /certs/)..."
sudo find /etc/freeradius/3.0 -type d -exec chmod g+rw {} \;
echo "✅ Done"
echo ""

# Step 3: Set group permissions on ALL files (including certs)
echo "[3/6] Adding group write permission to ALL files (including /certs/)..."
sudo find /etc/freeradius/3.0 -type f -exec chmod g+rw {} \;
echo "✅ Done"
echo ""

# Step 4: Create helper directories and fix existing files
echo "[4/6] Creating helper directories and symlinks..."

# Fix legacy users file - make it a symlink to authorize
if [ ! -L /etc/freeradius/3.0/users ]; then
    sudo mv /etc/freeradius/3.0/users /etc/freeradius/3.0/users-ui.bak 2>/dev/null || true
    sudo ln -s mods-config/files/authorize /etc/freeradius/3.0/users
    echo "  ✓ users file: backed up and symlinked to authorize"

    # Verify symlink was created
    if [ -L /etc/freeradius/3.0/users ]; then
        echo "  ✓ Verified: users is now a symlink"

        # Check if content is identical
        if diff -q /etc/freeradius/3.0/users /etc/freeradius/3.0/mods-config/files/authorize >/dev/null 2>&1; then
            echo "  ✓ Verified: users and authorize have identical content"
        else
            echo "  ❌ ERROR: users and authorize content differs!"
        fi
    else
        echo "  ❌ ERROR: Failed to create symlink!"
    fi
else
    echo "  ✓ users file: already a symlink (skipping)"
fi

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

# Dictionary directory - owned by freerad:freerad (not root!)
sudo mkdir -p /etc/freeradius/3.0/dictionary.d
sudo chown $RADIUS_GROUP:$RADIUS_GROUP /etc/freeradius/3.0/dictionary.d
sudo chmod 770 /etc/freeradius/3.0/dictionary.d
echo "  ✓ dictionary.d directory: $RADIUS_GROUP:$RADIUS_GROUP (770)"

# Fix ownership of existing custom dictionary files
if [ "$(sudo ls -A /etc/freeradius/3.0/dictionary.d 2>/dev/null)" ]; then
    echo "  ℹ  Found existing dictionary files - fixing ownership..."
    sudo chown $RADIUS_GROUP:$RADIUS_GROUP /etc/freeradius/3.0/dictionary.d/* 2>/dev/null || true
    sudo chmod 664 /etc/freeradius/3.0/dictionary.d/* 2>/dev/null || true
    DICT_FILE_COUNT=$(sudo ls /etc/freeradius/3.0/dictionary.d | wc -l)
    echo "  ✓ Fixed $DICT_FILE_COUNT existing dictionary file(s)"
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
    echo "  ⚠️ setfacl not found. Installing acl package..."
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -qq && sudo apt-get install -y acl >/dev/null 2>&1
        sudo setfacl -d -m u::rw-,g::rw-,o::r-- $USERS_DIR
        echo "  ✓ users.d ACLs: Configured to force 660 on new files"
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y acl >/dev/null 2>&1
        sudo setfacl -d -m u::rw-,g::rw-,o::r-- $USERS_DIR
        echo "  ✓ users.d ACLs: Configured to force 660 on new files"
    else
        echo "  ⚠️ Could not install acl. File group will be inherited, but strict 660 depends on your umask."
    fi
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
# Supports both: 'npm run dev' (recommended) and 'sudo npm run dev'
$USER_NAME ALL=(ALL) NOPASSWD: /usr/sbin/freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl * freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl status freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl * freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl show freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl status freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload freeradius
$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart freeradius
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

if [ -d /etc/freeradius/3.0/dictionary.d ]; then
    echo "dictionary.d directory permissions:"
    ls -ld /etc/freeradius/3.0/dictionary.d | awk '{print "  " $3 ":" $4 " " $1 " dictionary.d/"}'
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
echo "✅ dictionary.d directory owned by $RADIUS_GROUP:$RADIUS_GROUP"
echo "✅ users.d symlink created and owned by $RADIUS_GROUP:$RADIUS_GROUP (770)"
if [ "$(sudo ls -A /etc/freeradius/3.0/coa 2>/dev/null)" ] || [ "$(sudo ls -A /etc/freeradius/3.0/mods-config/files/users.d 2>/dev/null)" ] || [ "$(sudo ls -A /etc/freeradius/3.0/dictionary.d 2>/dev/null)" ]; then
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
echo ""
echo "Start backend (choose ONE):"
echo "  Option 1 (Recommended - More Secure):"
echo "    cd backend && npm run dev"
echo ""
echo "  Option 2 (Also works):"
echo "    cd backend && sudo npm run dev"
echo ""