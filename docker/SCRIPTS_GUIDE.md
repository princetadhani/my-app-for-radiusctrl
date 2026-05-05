# Scripts Guide - When to Use Which Script

## 📁 Script Overview

### **For YOU (Developer/Maintainer):**

#### `docker/build.sh`
**Purpose:** Build the Docker image from source code  
**When:** After making code changes  
**Usage:** `sudo ./docker/build.sh`  
**Output:** Docker image `freeradius-control:latest`

#### `docker/create-distribution-package.sh`
**Purpose:** Create distributable .tar.gz package with image + scripts + docs  
**When:** After building image, ready to distribute  
**Usage:** `sudo ./docker/create-distribution-package.sh`  
**Output:** `freeradius-control-docker-YYYYMMDD-HHMMSS.tar.gz`

#### `docker/save-image.sh`
**Purpose:** Save Docker image to .tar file (used internally by create-distribution-package.sh)  
**When:** Usually don't need to run manually  
**Usage:** `sudo ./docker/save-image.sh`  
**Output:** `freeradius-control.tar`

#### `docker/test-deployment.sh`
**Purpose:** Run automated tests to verify everything works  
**When:** Before creating distribution package, after fixes  
**Usage:** `sudo ./docker/test-deployment.sh`  
**Output:** Test results (pass/fail)

---

### **For END USERS (Your Friends):**

#### `scripts/setup-permissions.sh` ⭐ IMPORTANT
**Purpose:** Configure host system permissions (one-time setup)  
**When:** First time on new system, before running container  
**Usage:** `sudo ./scripts/setup-permissions.sh`  
**What it does:**
- Adds sudoers rules for FreeRADIUS commands
- Creates/configures freerad group
- Sets up required permissions

#### `docker/check-prerequisites.sh`
**Purpose:** Check if Docker is installed, install if missing  
**When:** First time on new system  
**Usage:** `sudo ./docker/check-prerequisites.sh`  
**What it does:**
- Checks for Docker
- Installs Docker if missing
- Verifies installation

#### `docker/load-image.sh`
**Purpose:** Load Docker image from .tar file  
**When:** After extracting distribution package  
**Usage:** `sudo ./docker/load-image.sh freeradius-control.tar`  
**What it does:**
- Loads image into Docker

#### `docker/run.sh`
**Purpose:** Start the container  
**When:** After loading image  
**Usage:** `sudo ./docker/run.sh`  
**What it does:**
- Runs docker-compose up -d
- Starts all services

#### `docker/fix-docker-permissions.sh`
**Purpose:** Fix permission issues if they occur  
**When:** Only if you get permission errors  
**Usage:** `sudo ./docker/fix-docker-permissions.sh`  
**What it does:**
- Fixes ownership of FreeRADIUS directories
- Usually not needed if setup-permissions.sh was run

---

## 🎯 **Quick Reference**

### Developer Workflow (YOU):
```bash
# 1. Make code changes
# 2. Build image
sudo ./docker/build.sh

# 3. Test it
sudo ./docker/run.sh
sudo ./docker/test-deployment.sh

# 4. Create distribution package
sudo ./docker/create-distribution-package.sh

# 5. Upload .tar.gz to GitHub
```

### End User Workflow (YOUR FRIENDS):
```bash
# Old way (manual - multiple steps):
wget <github-url>/freeradius-control-docker.tar.gz
tar -xzf freeradius-control-docker.tar.gz
cd freeradius-control-docker
sudo ./scripts/setup-permissions.sh
sudo ./docker/check-prerequisites.sh
sudo ./docker/load-image.sh freeradius-control.tar
sudo docker-compose up -d

# ❌ TOO COMPLEX!
```

### ✅ **NEW WAY - ONE SCRIPT (We'll create this below):**
```bash
# Single command deployment
curl -sSL <github-url>/install.sh | sudo bash
```

---

## 📝 Summary Table

| Script | Who Uses | When | Required |
|--------|----------|------|----------|
| `build.sh` | Developer | After code changes | No (dev only) |
| `create-distribution-package.sh` | Developer | Creating release | No (dev only) |
| `test-deployment.sh` | Developer | Testing before release | No (dev only) |
| `setup-permissions.sh` | End User | First time (one-time) | ⭐ YES |
| `check-prerequisites.sh` | End User | First time | ⭐ YES |
| `load-image.sh` | End User | First time | ⭐ YES |
| `run.sh` | End User | Start container | ⭐ YES |
| `fix-docker-permissions.sh` | End User | Only if errors | No (troubleshooting) |

---

## 🚀 Next Step

We'll create ONE master installation script that does everything automatically!
