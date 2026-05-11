# FreeRADIUS Control Panel - Installation Guide

## 🚀 One-Command Installation (Recommended)

The easiest way to install on a new system:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```

**This automatically:**
- ✅ Installs Docker (if not present)
- ✅ Downloads the latest release
- ✅ Configures host permissions
- ✅ Loads and starts the application
- ✅ Everything ready in one command!

---

## 📋 Requirements

- **Operating System:** Ubuntu 20.04+ or Debian 10+ (recommended)
- **FreeRADIUS:** Must be installed on the host at `/etc/freeradius/3.0`
- **Root Access:** Required for installation
- **Internet:** For downloading Docker and the application

---

## 🎯 Manual Installation (Alternative)

If you prefer manual installation:

### Step 1: Download the Release

Download the latest `.tar.gz` file from:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest
```

Or using command line:
```bash
wget https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/freeradius-control-docker.tar.gz
```

### Step 2: Extract

```bash
tar -xzf freeradius-control-docker.tar.gz
cd freeradius-control-docker
```

### Step 3: Make Scripts Executable

```bash
chmod +x docker/*.sh
chmod +x scripts/*.sh
```

### Step 4: Install Docker (if not installed)

```bash
sudo ./docker/check-prerequisites.sh
```

### Step 5: Configure Host Permissions

```bash
sudo ./scripts/setup-permissions.sh
```

This configures sudoers and permissions for FreeRADIUS control.

### Step 6: Load Docker Image

```bash
sudo docker load < freeradius-control.tar
```

### Step 7: Start the Application

```bash
sudo docker-compose up -d
```

---

## 🌐 Access the Application

After installation, open your browser:

```
http://<your-server-ip>:9000
```

Example: `http://192.168.1.100:9000`

**Port 9000** is used to avoid conflicts with other services on port 80.

---

## 📊 Verify Installation

Check if the container is running:

```bash
sudo docker ps | grep freeradius-control
```

You should see:
```
freeradius-control   Up X minutes   0.0.0.0:9000->80/tcp
```

---

## 🔧 Common Commands

### View Logs
```bash
sudo docker logs -f freeradius-control
```

### Stop Application
```bash
sudo docker-compose down
```

### Start Application
```bash
sudo docker-compose up -d
```

### Restart Application
```bash
sudo docker-compose restart
```

### Check Status
```bash
sudo docker ps | grep freeradius-control
```

---

## ❓ Troubleshooting

### Container Won't Start

**Check logs:**
```bash
sudo docker logs freeradius-control
```

**Common issues:**
1. FreeRADIUS not installed at `/etc/freeradius/3.0`
2. Port 80 already in use
3. Permissions not configured (run `setup-permissions.sh`)

### Permission Errors

Run the permission fix script:
```bash
sudo ./scripts/setup-permissions.sh
```

Then restart:
```bash
sudo docker-compose restart
```

### Can't Access on Port 80

Check if something else is using port 80:
```bash
sudo netstat -tlnp | grep :80
```

If nginx or apache is running on host, stop it:
```bash
sudo systemctl stop nginx
sudo systemctl stop apache2
```

### Application Shows Errors

1. Check container logs
2. Verify FreeRADIUS is installed on host
3. Verify volume mounts:
   ```bash
   sudo docker exec freeradius-control ls /etc/freeradius/3.0
   ```

---

## 🔄 Updating to New Version

### Stop Current Version
```bash
sudo docker-compose down
sudo docker rmi freeradius-control:latest
```

### Install New Version
Use the one-click installer again (it will update automatically):
```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```

Or manually download new release and repeat installation steps.

---

## 🗑️ Uninstall

### Stop and Remove Container
```bash
sudo docker-compose down
sudo docker rmi freeradius-control:latest
```

### Remove Installation Files
```bash
rm -rf /tmp/freeradius-control-install-*
```

### (Optional) Remove Docker
```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

---

## 📞 Support

If you encounter issues:

1. Check the logs: `sudo docker logs freeradius-control`
2. Verify prerequisites are installed
3. Ensure FreeRADIUS is installed at `/etc/freeradius/3.0`
4. Contact the application maintainer

---

## 🎯 What This Application Does

- **Dashboard:** Monitor FreeRADIUS service status in real-time
- **Configuration:** Edit FreeRADIUS config files through web interface
- **COA/Disconnect:** Send Change of Authorization and Disconnect requests
- **Log Streaming:** View FreeRADIUS logs in real-time
- **User Management:** Manage RADIUS users, clients, and sites
- **Validation:** Validate FreeRADIUS configuration before applying

**All through a modern, user-friendly web interface!**
