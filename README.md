# 🎨 RADIUSCTRL - FreeRADIUS Management Console

A modern, production-ready web interface for managing FreeRADIUS configuration with real-time collaboration support.

![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Express](https://img.shields.io/badge/Express-4.19-lightgrey)

## ✨ Features

### 🎯 Core Functionality

- **📂 Real-Time File Management**: Browse and edit `/etc/freeradius/3.0/` configuration files
- **🔄 Live Monitoring**: Real-time notifications when files are modified via SSH
- **✅ Validation-Based Saves**: Auto-validate with `freeradius -C`, rollback on errors
- **📊 Live Log Streaming**: Real-time log monitoring with pause/resume
- **📡 COA Commands**: Execute Change-of-Authorization and Disconnect requests
- **⚙️ Service Management**: Monitor status, reload, restart FreeRADIUS service

### 🎨 Modern UI

- **Dark Glassmorphism Theme** with neon accents
- **Monaco Editor** with syntax highlighting
- **Framer Motion** animations
- **WebSocket** real-time updates
- **Responsive Design** for desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- FreeRADIUS 3.0+
- Linux with systemd
- sudo access

### Installation

```bash
# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Running

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access the UI at: **http://localhost:3000**

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete installation guide
- **[backend/README.md](./backend/README.md)** - Backend API documentation

## 🏗️ Architecture

Frontend: Next.js + React + WebSocket → Backend: Node.js + Express → FreeRADIUS

## 📞 Support

For issues or questions, please open an issue on GitHub.

Built with ❤️ for network administrators
