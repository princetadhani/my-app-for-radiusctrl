# FreeRADIUS Backend API

Node.js + Express backend with WebSocket support for FreeRADIUS UI management.

## Features

- **File Management**: Browse, read, edit FreeRADIUS configuration files
- **Shadow Buffer**: Detect concurrent file modifications (SSH vs UI)
- **Safe-Save with Validation**: Atomic copy, validate with `freeradius -C`, then deploy
- **File Watcher**: Real-time notifications via WebSocket when files change externally
- **Log Streaming**: Live log streaming with pause/resume functionality
- **COA Commands**: Create and execute COA/Disconnect commands via radclient
- **Service Management**: Get status, reload, restart FreeRADIUS service

## Installation

```bash
cd backend
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
FREERADIUS_BASE_DIR=/etc/freeradius/3.0
FREERADIUS_LOG_FILE=/var/log/freeradius/radius.log
FREERADIUS_COA_DIR=/etc/freeradius/3.0/coa
STAGING_DIR=/opt/radius-ui/staging
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Files
- `GET /api/files/tree` - Get file tree structure
- `POST /api/files/content` - Get file content
- `POST /api/files/save` - Save file with conflict detection
- `POST /api/files/save-and-validate` - Safe-save with validation
- `POST /api/files/validate` - Validate configuration

### Logs
- `GET /api/logs/read?lines=100` - Read log file

### COA
- `GET /api/coa/files` - List COA files
- `GET /api/coa/files/:fileName` - Get COA file content
- `POST /api/coa/create` - Create COA file
- `POST /api/coa/execute` - Execute COA/Disconnect command
- `DELETE /api/coa/files/:fileName` - Delete COA file

### Service
- `GET /api/service/status` - Get service status
- `POST /api/service/reload` - Reload service
- `POST /api/service/restart` - Restart service

## WebSocket Events

### Emitted by Server
- `file:changed` - File modified externally (SSH)
- `file:added` - New file created
- `file:deleted` - File deleted
- `log:newEntry` - New log entry

## Permissions

The backend requires sudo permissions for:
- `freeradius -C` (validation)
- `systemctl` commands
- `radclient` (COA)

Configure sudoers:
```bash
sudo visudo
```

Add:
```
www-data ALL=(ALL) NOPASSWD: /usr/sbin/freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
www-data ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
www-data ALL=(ALL) NOPASSWD: /usr/bin/radclient
```

## Architecture

### Shadow Buffer Logic
Files are monitored for external changes. When a user tries to save:
1. Compare client mtime with disk mtime
2. If different → conflict detected → return diff
3. If same → save normally

### Safe-Save Flow
1. **Atomic Copy**: Copy `/etc/freeradius/3.0/` to `/tmp/radius_test/`
2. **Apply Change**: Write edited file to test directory
3. **Validate**: Run `freeradius -C -d /tmp/radius_test/`
4. **Swap**: If validation passes, copy to production
5. **Reload**: Trigger service reload

### File Watcher (Inotify)
Uses chokidar to monitor `/etc/freeradius/3.0/`:
- Emits WebSocket events on file changes
- UI shows toast notification
- User can sync to get latest version
