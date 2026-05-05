# Developer Workflow - Complete Guide

This document answers all your questions about building, testing, and distributing the FreeRADIUS Control Panel.

---

## ✅ Question 1: After Building the Image - Next Steps

After running `sudo ./docker/build.sh`, follow these steps:

```bash
# Step 1: Test the container locally
sudo ./docker/run.sh

# Step 2: Run automated tests
sudo ./docker/test-deployment.sh

# Step 3: Test manually (open browser, test COA, etc.)
# Open: http://<your-ip>

# Step 4: If everything works, create distribution package
sudo ./docker/create-distribution-package.sh

# This creates: dist/freeradius-control-docker-YYYYMMDD-HHMMSS.tar.gz
```

---

## 📦 Question 2: Steps for Other Systems

### What You Give to Users

1. **Upload to GitHub Releases:**
   - Go to your GitHub repository
   - Create a new release
   - Upload the `.tar.gz` file from `dist/` folder
   - Name it: `freeradius-control-docker.tar.gz`

2. **Share the one-click install command:**
   ```bash
   curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
   ```

### What Users Do

**Option A: One-Click Install (Recommended)**
```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```
Done! Everything automatic.

**Option B: Manual Install**
```bash
# 1. Download release
wget https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/freeradius-control-docker.tar.gz

# 2. Extract
tar -xzf freeradius-control-docker.tar.gz
cd freeradius-control-docker

# 3. Make scripts executable
chmod +x docker/*.sh scripts/*.sh

# 4. Install Docker (if needed)
sudo ./docker/check-prerequisites.sh

# 5. Setup permissions
sudo ./scripts/setup-permissions.sh

# 6. Load image
sudo docker load < freeradius-control.tar

# 7. Start
sudo docker-compose up -d
```

---

## 🗂️ Question 3: Which Script to Use When

### FOR YOU (Developer):

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `docker/build.sh` | Build Docker image from source | After code changes |
| `docker/rebuild-everything.sh` | Complete clean rebuild | After bug fixes |
| `docker/test-deployment.sh` | Run automated tests | Before creating release |
| `docker/create-distribution-package.sh` | Create .tar.gz for distribution | When ready to release |

### FOR END USERS:

| Script | Purpose | Required? |
|--------|---------|-----------|
| `docker/one-click-install.sh` | Complete automatic installation | ⭐ RECOMMENDED |
| `scripts/setup-permissions.sh` | Configure host permissions | ⭐ YES (if manual) |
| `docker/check-prerequisites.sh` | Install Docker if missing | ⭐ YES (if manual) |
| `docker/load-image.sh` | Load Docker image | ⭐ YES (if manual) |
| `docker/run.sh` | Start container | ⭐ YES (if manual) |

**See `docker/SCRIPTS_GUIDE.md` for complete details.**

---

## 🔄 Question 4: Bug Fix Workflow

### Quick Method (Use the script we created):

```bash
sudo ./docker/rebuild-everything.sh
```

This does everything automatically!

### Manual Method (Step by Step):

```bash
# 1. Stop and remove old container
sudo docker stop freeradius-control
sudo docker rm freeradius-control

# 2. Remove old image
sudo docker rmi freeradius-control:latest

# 3. Clean frontend
rm -rf .next
rm -rf node_modules/.cache
npm install
npm run build

# 4. Clean backend
cd backend
rm -rf dist
rm -rf node_modules/.cache
npm install
npm run build
cd ..

# 5. Rebuild Docker image
sudo ./docker/build.sh

# 6. Test
sudo ./docker/run.sh
sudo ./docker/test-deployment.sh

# 7. If tests pass, create new distribution
sudo ./docker/create-distribution-package.sh

# 8. Upload new version to GitHub releases
```

---

## 🚀 Question 5: One-Click Installation Script

**Already created!** See `docker/one-click-install.sh`

### How It Works:

1. **Downloads** latest release from GitHub automatically
2. **Installs** Docker if not present
3. **Runs** `setup-permissions.sh`
4. **Runs** `check-prerequisites.sh`
5. **Loads** Docker image
6. **Starts** container

All in one command!

### Before Using:

**Update these lines in `docker/one-click-install.sh`:**

```bash
# Line 22-23
GITHUB_USER="YOUR_USERNAME"     # TODO: Change to your GitHub username
GITHUB_REPO="YOUR_REPO"          # TODO: Change to your repository name
```

### How Users Install:

```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```

### What Happens Automatically:

✅ Checks for Docker → Installs if missing  
✅ Downloads latest `.tar.gz` from GitHub  
✅ Extracts package  
✅ Runs `setup-permissions.sh`  
✅ Loads Docker image  
✅ Starts container  
✅ Shows access URL  

**User does NOTHING except run one command!**

---

## 📋 Complete Developer Checklist

### Initial Setup (One-Time):

- [ ] Update `docker/one-click-install.sh` with your GitHub username/repo
- [ ] Update `INSTALLATION_FOR_USERS.md` with your GitHub username/repo
- [ ] Commit all files to GitHub

### For Each Release:

- [ ] Make code changes/bug fixes
- [ ] Run: `sudo ./docker/rebuild-everything.sh`
- [ ] Test manually (especially COA save/load)
- [ ] Run: `sudo ./docker/test-deployment.sh`
- [ ] All tests pass? → Continue
- [ ] Run: `sudo ./docker/create-distribution-package.sh`
- [ ] Upload `.tar.gz` file to GitHub Releases
- [ ] Upload `docker/one-click-install.sh` to GitHub (root or docker/)
- [ ] Share installation command with users

---

## 🎯 Complete Workflow Example

```bash
# 1. You make code changes
vim app/coa/page.tsx

# 2. Complete rebuild
sudo ./docker/rebuild-everything.sh

# 3. Test it
sudo ./docker/run.sh
# Open browser, test COA save/load

# 4. Run automated tests
sudo ./docker/test-deployment.sh
# All tests pass? Good!

# 5. Create distribution package
sudo ./docker/create-distribution-package.sh
# Creates: dist/freeradius-control-docker-20260505-120000.tar.gz

# 6. Upload to GitHub
# - Go to GitHub → Releases → New Release
# - Tag: v1.0.1
# - Upload: dist/freeradius-control-docker-20260505-120000.tar.gz
# - Rename to: freeradius-control-docker.tar.gz
# - Publish

# 7. Share with users
# Send them this command:
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```

---

## 📂 Files You Created for Distribution

| File | Purpose |
|------|---------|
| `docker/one-click-install.sh` | ⭐ One-command installation for users |
| `docker/rebuild-everything.sh` | Complete clean rebuild for you |
| `docker/test-deployment.sh` | Automated testing |
| `docker/SCRIPTS_GUIDE.md` | Guide to all scripts |
| `INSTALLATION_FOR_USERS.md` | User installation guide |
| `DEVELOPER_WORKFLOW.md` | This file - your complete guide |

---

## ✅ Success Criteria

Your distribution is ready when:

- [x] `docker/one-click-install.sh` has your GitHub username/repo
- [x] All automated tests pass
- [x] COA save/load works correctly
- [x] Distribution package created
- [x] Uploaded to GitHub Releases
- [x] One-click install command shared with users

---

## 💡 Pro Tips

1. **Always test locally** before creating distribution
2. **Run automated tests** - they catch most issues
3. **Test COA operations** - this was the critical bug
4. **Keep GitHub releases** - name consistently for one-click installer
5. **Version your releases** - helps users track updates

---

## 🎁 What You Give Users

**Just ONE command:**
```bash
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker/one-click-install.sh | sudo bash
```

**That's it!** Everything else is automatic! 🎉
