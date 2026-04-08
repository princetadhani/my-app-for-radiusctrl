# FreeRADIUS UI - Complete Setup Guide

A modern, production-ready web interface for managing FreeRADIUS configuration with real-time collaboration support.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│              (React + TypeScript + WebSocket)            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP + WebSocket
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Node.js + Express Backend                   │
│        (File Management + Validation + Streaming)        │
└─────────┬────────────────────┬─────────────┬────────────┘
          │                    │             │
          ▼                    ▼             ▼
┌──────────────────┐  ┌────────────────┐  ┌──────────────┐
│ /etc/freeradius  │  │  FreeRADIUS    │  │ File Watcher │
│      /3.0/       │  │    Service     │  │  (chokidar)  │
│  (Config Files)  │  │  (systemctl)   │  │              │
└──────────────────┘  └────────────────┘  └──────────────┘
```

## Features

### ✅ Real-Time File Management
- Browse `/etc/freeradius/3.0/` directory tree
- Edit configuration files with Monaco editor
- Syntax highlighting and validation
- Real-time notifications when files change externally via SSH

### ✅ Safe Deployment
- **Atomic Copy & Validate**: Test changes in isolated directory
- **Config Validation**: Run `freeradius -C` before applying
- **Safe Swap**: Only deploy if validation passes
- **Service Reload**: Automatically reload FreeRADIUS service

### ✅ Live Log Streaming
- Real-time log streaming from `/var/log/freeradius/radius.log`
- Pause/Resume functionality
- Download logs as text file
- Color-coded log levels

### ✅ COA Commands
- Create and execute COA/Disconnect commands
- Template management
- Real-time command output
- File-based command storage

### ✅ Service Status
- Real-time FreeRADIUS service status
- Service uptime and metrics
- Reload/Restart controls

## Installation

### Prerequisites
```bash
# System requirements
- Node.js 20+
- npm or yarn
- FreeRADIUS 3.0+
- Linux with systemd
- sudo access
```

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
FREERADIUS_BASE_DIR=/etc/freeradius/3.0
FREERADIUS_LOG_FILE=/var/log/freeradius/radius.log
FREERADIUS_COA_DIR=/etc/freeradius/3.0/coa
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
```

Create required directories:
```bash
sudo mkdir -p /etc/freeradius/3.0/coa
sudo chown -R $USER:$USER /etc/freeradius/3.0/coa
```

### 2. Configure sudo Permissions

```bash
sudo visudo
```

Add these lines (replace `www-data` with your user if running in development):
```
www-data ALL=(ALL) NOPASSWD: /usr/sbin/freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
www-data ALL=(ALL) NOPASSWD: /usr/bin/radclient
```

For development, replace `www-data` with your username:
```bash
your_username ALL=(ALL) NOPASSWD: /usr/sbin/freeradius
your_username ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
your_username ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
your_username ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
your_username ALL=(ALL) NOPASSWD: /usr/bin/radclient
```

### 3. Frontend Setup

```bash
# In project root
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Running the Application

### Development Mode

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

Access the UI at: `http://localhost:3000`

### Production Mode

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
npm run build
npm start
```

Or use PM2 for process management:
```bash
# Backend
cd backend
pm2 start dist/index.js --name freeradius-backend

# Frontend
pm2 start npm --name freeradius-frontend -- start
```

## Usage Guide

### File Editing Workflow

1. **Browse Files**: Use sidebar to navigate `/etc/freeradius/3.0/`
2. **Edit**: Click file to open in Monaco editor
3. **Save**: Press Ctrl+S or click Save button
4. **Validation**: Every save automatically validates configuration
5. **SSH Notifications**: If file modified externally via SSH, you'll see a toast notification

### Save & Validation Flow

**Every save automatically validates the configuration:**

1. **User presses Save (Ctrl+S)**
2. Backend saves file to disk
3. Runs `freeradius -C` validation
4. **If validation passes**:
   - Service reloads automatically
   - Toast: "Configuration saved and service reloaded"
5. **If validation fails**:
   - File is rolled back to original content
   - Console opens with validation errors
   - Toast: "Configuration validation failed. Changes were not saved."
   - User can fix the error and save again

### External File Monitoring

**When files are modified via SSH:**

- File watcher detects the change
- Toast notification appears: "[filename] edited via SSH"
- Color-coded notifications:
  - Yellow/amber: File modified
  - Blue: File created
  - Red: File deleted
- No conflict dialogs - you can continue editing normally

### Log Streaming

- Click "Live" to start streaming
- Click "Pause" to stop
- "Load Whole File" loads entire log
- "Download" exports as text file

### COA Commands

1. Navigate to `/coa` page
2. Create template or use existing
3. Configure: Type (COA/Disconnect), NAS IP, Secret, Attributes
4. Click "Send"
5. View response in console

## API Reference

See `backend/README.md` for complete API documentation.

## Troubleshooting

### Backend won't start
- Check if port 3001 is available: `lsof -i :3001`
- Verify FreeRADIUS paths in `.env`
- Check sudo permissions

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check CORS settings in backend `.env`
- Verify WebSocket connection in browser console

### File watcher not working
- Check inotify limits: `cat /proc/sys/fs/inotify/max_user_watches`
- Increase if needed: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`

### Validation fails
- Test manually: `sudo freeradius -C -d /etc/freeradius/3.0/`
- Check FreeRADIUS config syntax
- Verify FreeRADIUS configuration file permissions

## Security Notes

- **Never expose to public internet without authentication**
- Use firewall to restrict access
- Consider adding OAuth/LDAP authentication
- Audit sudo permissions regularly
- Monitor access logs

## License

See LICENSE file.
