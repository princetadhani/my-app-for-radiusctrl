# 🐳 FreeRADIUS Control Panel - Docker Deployment Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Building the Image](#building-the-image)
5. [Running the Container](#running-the-container)
6. [Distribution](#distribution)
7. [Troubleshooting](#troubleshooting)
8. [Technical Details](#technical-details)

---

## 🎯 Overview

This Docker deployment provides a **single, portable image** that runs the FreeRADIUS Control Panel on **any device** without requiring:

- ❌ Manual `.env` file editing
- ❌ IP address configuration
- ❌ `next.config.js` modifications
- ❌ Separate frontend/backend setup

### What's Included

- ✅ Built Next.js frontend (production-optimized)
- ✅ Node.js backend (production mode)
- ✅ nginx reverse proxy (eliminates IP dependencies)
- ✅ supervisord process manager
- ✅ Full FreeRADIUS host control

---

## 🔧 Prerequisites

### On the Build Machine (Where You Create the Image)

1. **Docker** installed
   ```bash
   docker --version
   ```

2. **FreeRADIUS** installed and running
   ```bash
   sudo systemctl status freeradius
   ```

3. **Permissions configured** (CRITICAL - Run this ONCE)
   ```bash
   ./scripts/setup-permissions.sh
   ```

   This script:
   - Adds your user to the `freerad` group
   - Sets proper file/directory permissions
   - Configures sudo rules for FreeRADIUS service control

4. **Log out and log back in** after running setup script (for group membership to take effect)

---

## 🚀 Quick Start

### Option 1: Using Scripts (Recommended)

```bash
# 1. Build the image
./docker/build.sh

# 2. Run the container
./docker/run.sh

# 3. Access the application
# Open browser: http://<your-ip>
```

### Option 2: Using Docker Compose

```bash
# Build and run in one command
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🏗️ Building the Image

### Method 1: Build Script

```bash
./docker/build.sh
```

### Method 2: Manual Build

```bash
docker build -t freeradius-control:latest .
```

### Build Time

- First build: ~5-10 minutes (downloads dependencies)
- Subsequent builds: ~2-3 minutes (cached layers)

### Image Size

- Approximate size: 500MB - 800MB (compressed)

---

## ▶️ Running the Container

### Method 1: Run Script

```bash
./docker/run.sh
```

This automatically configures all required volumes and permissions.

### Method 2: Docker Compose

```bash
docker-compose up -d
```

### Method 3: Manual Docker Run

```bash
docker run -d \
  --name freeradius-control \
  --restart unless-stopped \
  -p 80:80 \
  -v /etc/freeradius/3.0:/etc/freeradius/3.0 \
  -v /var/log/freeradius:/var/log/freeradius \
  -v /run/systemd/private:/run/systemd/private \
  -v /var/run/dbus:/var/run/dbus \
  --privileged \
  --pid host \
  freeradius-control:latest
```

### Accessing the Application

Once the container is running, access the web interface at:

```
http://<your-host-ip>
```

Example:
```
http://192.168.1.100
http://10.81.203.135
```

---

## 📦 Distribution

### Step 1: Save the Image (On Build Machine)

```bash
./docker/save-image.sh
```

This creates: `dist/freeradius-control.tar.gz`

### Step 2: Share the File

Transfer `dist/freeradius-control.tar.gz` to your friends via:
- USB drive
- Network share
- File transfer service
- Cloud storage

File size: ~400-600MB (compressed)

### Step 3: Load the Image (On Recipient's Machine)

Recipients run:

```bash
# Method 1: Using script
./docker/load-image.sh freeradius-control.tar.gz

# Method 2: Manual
gunzip -c freeradius-control.tar.gz | docker load
```

### Step 4: Recipients Run the Container

Recipients need to:

1. **Ensure prerequisites** (see [Prerequisites](#prerequisites))

2. **Run the setup script ONCE**:
   ```bash
   ./scripts/setup-permissions.sh
   # Then log out and log back in
   ```

3. **Start the container**:
   ```bash
   ./docker/run.sh
   ```

4. **Access the application**:
   ```
   http://<their-ip>
   ```

---

## 🐛 Troubleshooting

### Container Won't Start

**Check Docker logs:**
```bash
docker logs freeradius-control
```

**Common issues:**

1. **Port 80 already in use**
   ```bash
   # Check what's using port 80
   sudo lsof -i :80

   # Option 1: Stop the conflicting service
   sudo systemctl stop apache2  # or nginx, etc.

   # Option 2: Use a different port
   docker run -p 8080:80 ...  # Access via http://<ip>:8080
   ```

2. **FreeRADIUS directories not found**
   ```bash
   # Ensure FreeRADIUS is installed
   ls -la /etc/freeradius/3.0

   # If not, install FreeRADIUS first
   sudo apt install freeradius  # Debian/Ubuntu
   sudo yum install freeradius  # RHEL/CentOS
   ```

3. **Permission denied errors**
   ```bash
   # Re-run setup script
   ./scripts/setup-permissions.sh

   # Log out and log back in
   # Verify group membership
   groups | grep freerad
   ```

### Can't Control FreeRADIUS Service

**Symptoms:** Service control buttons don't work, status shows "unknown"

**Solutions:**

1. **Check systemd access:**
   ```bash
   docker exec freeradius-control sudo systemctl status freeradius
   ```

2. **Verify privileged mode:**
   ```bash
   docker inspect freeradius-control | grep Privileged
   # Should show: "Privileged": true
   ```

3. **Check volume mounts:**
   ```bash
   docker inspect freeradius-control | grep -A5 Mounts
   # Should show /run/systemd/private and /var/run/dbus
   ```

### WebSocket Connection Fails

**Symptoms:** Live logs don't stream, file change notifications don't work

**Solutions:**

1. **Check nginx logs:**
   ```bash
   docker exec freeradius-control tail -f /var/log/nginx/error.log
   ```

2. **Verify backend is running:**
   ```bash
   docker exec freeradius-control ps aux | grep node
   ```

3. **Test WebSocket connection:**
   ```bash
   # From browser console
   io('/socket.io')
   ```

### Frontend Shows "Connection Error"

**Solutions:**

1. **Check all services are running:**
   ```bash
   docker exec freeradius-control supervisorctl status
   ```

   Should show:
   - `nginx RUNNING`
   - `nextjs RUNNING`
   - `backend RUNNING`

2. **Restart container:**
   ```bash
   docker restart freeradius-control
   ```

3. **View service logs:**
   ```bash
   docker logs -f freeradius-control
   ```

### Image Too Large to Transfer

**Solutions:**

1. **Verify compression:**
   ```bash
   # The save script should create .tar.gz (compressed)
   ls -lh dist/freeradius-control.tar.gz
   ```

2. **Split large file:**
   ```bash
   # Split into 100MB chunks
   split -b 100M dist/freeradius-control.tar.gz freeradius-part-

   # On recipient machine, reassemble:
   cat freeradius-part-* > freeradius-control.tar.gz
   ```

---

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────────────────┐
│              Docker Container                   │
│                                                  │
│  ┌──────────┐    ┌──────────┐   ┌──────────┐  │
│  │  nginx   │───▶│ Next.js  │   │ Backend  │  │
│  │  (port   │    │ (port    │   │ (port    │  │
│  │   80)    │    │  3000)   │   │  3001)   │  │
│  └──────────┘    └──────────┘   └──────────┘  │
│       │               │               │         │
│       └───────────────┴───────────────┘         │
│            Managed by supervisord               │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
   ┌────▼─────┐             ┌────────▼─────────┐
   │  Host    │             │ Host FreeRADIUS  │
   │  Files   │             │ Service (systemd)│
   └──────────┘             └──────────────────┘
```

### Network Flow

1. **User** → `http://<host-ip>` → **nginx (port 80)**
2. **nginx** → `/` → **Next.js frontend (port 3000)**
3. **nginx** → `/api/*` → **Backend (port 3001)**
4. **nginx** → `/socket.io/*` → **Backend WebSocket (port 3001)**

### Why No IP Configuration Needed?

**Traditional approach (requires IP editing):**
```javascript
// ❌ Old way - hardcoded IP
const API_URL = "http://10.81.203.135:3001"
```

**Docker approach (dynamic):**
```javascript
// ✅ New way - relative URL
const API_URL = ""  // Same origin, proxied by nginx
```

nginx handles routing internally, so the frontend never needs to know the host's IP.

### Volume Mounts Explained

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `/etc/freeradius/3.0` | `/etc/freeradius/3.0` | FreeRADIUS config files (read/write) |
| `/var/log/freeradius` | `/var/log/freeradius` | FreeRADIUS logs (read) |
| `/run/systemd/private` | `/run/systemd/private` | systemd socket for service control |
| `/var/run/dbus` | `/var/run/dbus` | D-Bus socket for systemd communication |

### Security Considerations

**Privileged Mode:**

The container runs with `--privileged` to:
- Control host's systemd services
- Access host's D-Bus
- Modify host's FreeRADIUS configs

**Risks:**
- Container has extensive host access
- Should only be run on trusted networks
- Users inside container can execute sudo commands

**Mitigations:**
- Sudoers limited to specific FreeRADIUS commands
- Container filesystem is isolated
- Use firewall rules to restrict access

**Production Recommendations:**
1. Run on internal/management network only
2. Use VPN for remote access
3. Enable authentication (not included in base image)
4. Regular security updates

### Environment Variables

**Build-time (baked into image):**
```dockerfile
ENV NODE_ENV=production
ENV PORT=3001
ENV FREERADIUS_BASE_DIR=/etc/freeradius/3.0
ENV WEBSOCKET_CORS_ORIGIN=*
```

**Runtime (can be overridden):**
```bash
docker run -e PORT=3002 ...
```

But **NOT RECOMMENDED** to override, as nginx config expects port 3001.

### Process Management

**supervisord** manages three processes:

1. **nginx** (priority 10)
   - Starts first
   - Runs as root
   - Serves on port 80

2. **nextjs** (priority 20)
   - Starts second
   - Runs as `appuser` (UID 1000)
   - Serves on port 3000

3. **backend** (priority 30)
   - Starts last
   - Runs as `appuser` via sudo
   - Serves on port 3001

If any process crashes, supervisord automatically restarts it.

---

## 📚 Additional Resources

### Useful Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Enter container shell
docker exec -it freeradius-control sh

# View container resource usage
docker stats freeradius-control

# View container IP
docker inspect freeradius-control | grep IPAddress

# Export container logs
docker logs freeradius-control > container.log 2>&1

# Rebuild image (after code changes)
docker-compose build --no-cache
```

### File Locations Inside Container

```
/app/                           # Application root
  ├── .next/                    # Built Next.js app
  ├── backend/dist/             # Built backend
  ├── node_modules/             # Frontend dependencies
  └── backend/node_modules/     # Backend dependencies

/etc/nginx/http.d/default.conf  # nginx config
/etc/supervisord.conf           # supervisord config
/var/log/supervisor/            # Process logs
/var/log/nginx/                 # nginx logs
```

### Updating the Application

To update the application code:

1. **Make code changes** on development machine
2. **Rebuild image**: `./docker/build.sh`
3. **Save new image**: `./docker/save-image.sh`
4. **Distribute new .tar.gz** to users
5. **Users reload**: `./docker/load-image.sh new-image.tar.gz`
6. **Users restart**: `docker restart freeradius-control`

---

## 🎉 Success!

Your FreeRADIUS Control Panel is now fully containerized and portable!

For support or questions, refer to the main [README.md](README.md) or [SETUP_GUIDE.md](SETUP_GUIDE.md).
