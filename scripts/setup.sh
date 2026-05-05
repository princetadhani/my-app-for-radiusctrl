#!/bin/bash

# FreeRADIUS UI Setup Script
# This script sets up the development environment

set -e

echo "🚀 FreeRADIUS UI Setup"
echo "======================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 20+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Create directories
echo "📁 Creating required directories..."
sudo mkdir -p /etc/freeradius/3.0/coa
sudo mkdir -p /var/log/freeradius

echo "✅ Directories created"
echo ""

# Set permissions (development mode)
echo "🔐 Setting permissions..."
USER_NAME=$(whoami)
sudo chown -R $USER_NAME:$USER_NAME /etc/freeradius/3.0/coa 2>/dev/null || true

echo "✅ Permissions set for user: $USER_NAME"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created backend/.env from example"
fi
npm install
cd ..

echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created .env.local from example"
fi
npm install

echo "✅ Frontend dependencies installed"
echo ""

# Sudo configuration reminder
echo "⚠️  IMPORTANT: Sudo Configuration Required"
echo "============================================"
echo "Add the following lines to sudoers (run: sudo visudo):"
echo ""
echo "$USER_NAME ALL=(ALL) NOPASSWD: /usr/sbin/freeradius"
echo "$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius"
echo "$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius"
echo "$USER_NAME ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius"
echo "$USER_NAME ALL=(ALL) NOPASSWD: /usr/bin/radclient"
echo ""

# Check if FreeRADIUS is installed
if command -v freeradius &> /dev/null; then
    echo "✅ FreeRADIUS detected: $(freeradius -v | head -n1)"
else
    echo "⚠️  FreeRADIUS not found. Please install FreeRADIUS 3.0+"
fi

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Configure sudo permissions (see above)"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: npm run dev"
echo "4. Open http://localhost:3000"
echo ""
echo "📖 See SETUP_GUIDE.md for detailed instructions"
