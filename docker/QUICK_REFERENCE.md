# ⚡ Quick Reference Guide

## 🎯 Common Commands

### Building & Running

```bash
# Check prerequisites
./docker/check-prerequisites.sh

# Build image
./docker/build.sh

# Run container
./docker/run.sh

# Or use Docker Compose
docker-compose up -d
```

### Distribution

```bash
# Create complete distribution package
./docker/create-distribution-package.sh

# Or just save image
./docker/save-image.sh
```

### Container Management

```bash
# View logs
docker logs -f freeradius-control

# View service status
docker exec freeradius-control supervisorctl status

# Restart container
docker restart freeradius-control

# Stop container
docker stop freeradius-control

# Remove container
docker rm -f freeradius-control

# Enter container shell
docker exec -it freeradius-control sh
```

---

## 📂 File Structure

```
my-app-for-radiusctrl/
├── Dockerfile                          # Main Docker build config
├── docker-compose.yml                  # Docker Compose config
├── .dockerignore                       # Build context exclusions
│
├── docker/                             # Docker-related files
│   ├── nginx.conf                      # Nginx reverse proxy config
│   ├── supervisord.conf                # Process manager config
│   ├── entrypoint.sh                   # Container startup script
│   ├── build.sh                        # Build image script
│   ├── run.sh                          # Run container script
│   ├── save-image.sh                   # Export image script
│   ├── load-image.sh                   # Import image script
│   ├── check-prerequisites.sh          # Prerequisite checker
│   ├── create-distribution-package.sh  # Create distribution package
│   ├── QUICKSTART.md                   # Quick start for end users
│   └── TESTING_CHECKLIST.md            # Testing checklist
│
├── backend/                            # Backend source
│   ├── src/                            # TypeScript source
│   ├── dist/                           # Compiled JavaScript (created in Docker)
│   ├── package.json                    # Backend dependencies
│   └── .env.production                 # Production env config
│
├── app/                                # Next.js app directory
├── components/                         # React components
├── lib/                                # Utilities
│   ├── apiClient.ts                    # ✨ Modified for Docker (relative URLs)
│   └── api.ts
│
├── scripts/
│   └── setup-permissions.sh            # Host setup script (run ONCE)
│
├── DOCKER_DEPLOYMENT.md                # Complete Docker guide
├── DOCKER_IMPLEMENTATION_SUMMARY.md    # Implementation details
├── QUICK_REFERENCE.md                  # This file
└── README.md                           # Main README
```

---

## 🔑 Key Concepts

### Port Mapping

- **Container Port 80** (nginx) → **Host Port 80**
- Users access: `http://<host-ip>`

### Internal Routing (nginx)

- `/` → Next.js (port 3000)
- `/api/*` → Backend (port 3001)
- `/socket.io/*` → Backend WebSocket (port 3001)

### Volume Mounts

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `/etc/freeradius/3.0` | `/etc/freeradius/3.0` | FreeRADIUS configs |
| `/var/log/freeradius` | `/var/log/freeradius` | FreeRADIUS logs |
| `/run/systemd/private` | `/run/systemd/private` | systemd control |
| `/var/run/dbus` | `/var/run/dbus` | D-Bus communication |

---

## 🚀 Workflow

### For You (Developer/Distributor)

1. **One-time setup:**
   ```bash
   ./scripts/setup-permissions.sh
   # Logout/login
   ```

2. **Build image:**
   ```bash
   ./docker/build.sh
   ```

3. **Test locally:**
   ```bash
   ./docker/run.sh
   # Access: http://localhost
   ```

4. **Create distribution package:**
   ```bash
   ./docker/create-distribution-package.sh
   ```

5. **Share:** `dist/freeradius-control-complete.tar.gz`

### For Friends (End Users)

1. **Receive:** `freeradius-control-complete.tar.gz`

2. **Extract:**
   ```bash
   tar -xzf freeradius-control-complete.tar.gz
   cd freeradius-control-package
   ```

3. **Setup (one-time):**
   ```bash
   ./scripts/setup-permissions.sh
   # Logout/login
   ```

4. **Load image:**
   ```bash
   ./docker/load-image.sh freeradius-control.tar.gz
   ```

5. **Run:**
   ```bash
   ./docker/run.sh
   ```

6. **Access:** `http://<their-ip>`

---

## 📖 Documentation Map

- **Getting started?** → [docker/QUICKSTART.md](docker/QUICKSTART.md)
- **Building/distributing?** → [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
- **Understanding implementation?** → [DOCKER_IMPLEMENTATION_SUMMARY.md](DOCKER_IMPLEMENTATION_SUMMARY.md)
- **Quick commands?** → This file

---

## ⚠️ Important Notes

1. **Setup script must be run ONCE** on each host before using Docker
2. **Logout/login required** after setup script for group membership
3. **FreeRADIUS must be installed** on the host (not in Docker)
4. **Container needs privileged mode** for systemd control
5. **Works on any IP** - no configuration needed!

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 80 in use | Change to `-p 8080:80` in run.sh |
| Permission denied | Run `./scripts/setup-permissions.sh` then logout/login |
| Can't control service | Check `docker inspect` shows `Privileged: true` |
| WebSocket fails | Check nginx logs: `docker logs freeradius-control` |
| Container won't start | Check volumes exist: `ls /etc/freeradius/3.0` |

Full troubleshooting: [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md#troubleshooting)

---

## 📊 Success Criteria Checklist

- ✅ Image built successfully
- ✅ Container runs without errors
- ✅ Web interface accessible at `http://<host-ip>`
- ✅ Can browse FreeRADIUS files
- ✅ Can edit and save configs
- ✅ Service control works (reload/restart)
- ✅ Live logs stream correctly
- ✅ COA commands execute
- ✅ Container survives restart
- ✅ Image can be saved and distributed

---

## 🎉 Final Notes

**This implementation achieves:**
- ✅ Zero configuration for end users
- ✅ Single portable image
- ✅ Works on any device
- ✅ Full FreeRADIUS control
- ✅ Production-ready
- ✅ Easy distribution

**Questions?** See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)
