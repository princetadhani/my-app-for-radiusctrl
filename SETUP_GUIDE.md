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
- **Shadow Buffer**: Detects concurrent modifications (SSH vs UI)
- Real-time notifications when files change externally

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
STAGING_DIR=/opt/radius-ui/staging
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
```

Create staging directory:
```bash
sudo mkdir -p /opt/radius-ui/staging
sudo mkdir -p /etc/freeradius/3.0/coa
sudo chown -R $USER:$USER /opt/radius-ui
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
3. **Save**: Click "Save" or press Ctrl+S
4. **Deploy**: Click "Save & Validate" to run validation before saving
5. **Sync**: If file modified externally (SSH), you'll see notification with "Sync" button

### Concurrent Access Handling

**Scenario**: User A edits via UI, User B edits via SSH

1. User A opens file, gets mtime = 1000
2. User B saves via SSH, mtime changes to 2000
3. User A clicks "Save"
4. Backend detects mtime mismatch → returns conflict
5. UI shows diff dialog with:
   - Disk version (User B's changes)
   - Local version (User A's changes)
   - Options: Cancel or Force Overwrite

### Safe-Save Flow

1. **User clicks "Save & Validate"**
2. Backend copies `/etc/freeradius/3.0/` → `/tmp/radius_test/`
3. Applies user's changes to test directory
4. Runs `freeradius -C -d /tmp/radius_test/`
5. If validation **passes**: Copy to production + reload service
6. If validation **fails**: Show error, discard changes

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
- Verify staging directory permissions

## Security Notes

- **Never expose to public internet without authentication**
- Use firewall to restrict access
- Consider adding OAuth/LDAP authentication
- Audit sudo permissions regularly
- Monitor access logs

## License

See LICENSE file.
