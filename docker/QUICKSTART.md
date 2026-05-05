# 🚀 Quick Start Guide for End Users

## For People Receiving the Docker Image

This guide is for people who received the `freeradius-control.tar.gz` file and want to run it on their machine.

---

## ✅ Prerequisites Check

Before starting, make sure you have:

1. **Docker installed**
   ```bash
   docker --version
   ```
   If not installed: https://docs.docker.com/get-docker/

2. **FreeRADIUS installed and running**
   ```bash
   sudo systemctl status freeradius
   ```
   
   If not running:
   ```bash
   # Debian/Ubuntu
   sudo apt install freeradius
   
   # RHEL/CentOS
   sudo yum install freeradius
   
   # Start service
   sudo systemctl start freeradius
   ```

3. **Setup script run (CRITICAL - Only once)**
   ```bash
   ./scripts/setup-permissions.sh
   ```
   
   Then **LOG OUT and LOG BACK IN** for group membership to take effect!

---

## 📦 Installation Steps

### Step 1: Load the Docker Image

```bash
# If you received the image file
./docker/load-image.sh freeradius-control.tar.gz

# Or manually
gunzip -c freeradius-control.tar.gz | docker load
```

### Step 2: Run the Container

```bash
./docker/run.sh
```

Or manually:
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

### Step 3: Access the Application

Open your browser and go to:
```
http://<your-ip-address>
```

To find your IP:
```bash
hostname -I | awk '{print $1}'
```

Example: `http://192.168.1.100`

---

## 🎛️ Managing the Container

### View Logs
```bash
docker logs -f freeradius-control
```

### Stop Container
```bash
docker stop freeradius-control
```

### Start Container
```bash
docker start freeradius-control
```

### Restart Container
```bash
docker restart freeradius-control
```

### Remove Container
```bash
docker rm -f freeradius-control
```

---

## ❓ Troubleshooting

### "Port 80 already in use"

**Solution 1:** Stop conflicting service
```bash
sudo systemctl stop apache2  # or nginx
```

**Solution 2:** Use different port
```bash
# Change -p 80:80 to -p 8080:80
# Then access via http://<your-ip>:8080
```

### "Permission denied"

Run the setup script:
```bash
./scripts/setup-permissions.sh
```

Then **log out and log back in**.

### "Cannot access FreeRADIUS service"

1. Check if FreeRADIUS is running on host:
   ```bash
   sudo systemctl status freeradius
   ```

2. Check container privileges:
   ```bash
   docker inspect freeradius-control | grep Privileged
   ```
   Should show: `"Privileged": true`

### "Container keeps restarting"

View logs to see the error:
```bash
docker logs freeradius-control
```

Common issues:
- FreeRADIUS directories not mounted correctly
- FreeRADIUS not installed on host
- Permissions not set up

---

## 🎉 Done!

You should now have the FreeRADIUS Control Panel running at:
```
http://<your-ip>
```

Enjoy! 🚀
