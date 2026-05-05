# FreeRADIUS UI - Permission Setup

## Quick Start

```bash
./scripts/setup-permissions.sh
exit  # Log out and back in
```

---

## What This Script Does

### 1. Adds You to `freerad` Group
Your user joins the `freerad` group to get access to FreeRADIUS files.

### 2. Sets Group Write Permissions
**Goal:** Make `freerad` GROUP permissions match `freerad` USER permissions exactly.

```bash
# Before:
-rw-r----- freerad:freerad radiusd.conf  (group read-only)

# After:
-rw-rw---- freerad:freerad radiusd.conf  (group read+write)
```

**What gets changed:**
- ✅ All config files: `chmod g+w`
- ✅ All directories: `chmod g+w`
- ✅ **Certificate files** (for RadSec support)
- ✅ Everything in `/etc/freeradius/3.0/`

### 3. Fixes COA Directory Ownership
```bash
# Before:
drwxrwx--- root:root /etc/freeradius/3.0/coa

# After:
drwxrwx--- freerad:freerad /etc/freeradius/3.0/coa
```

### 4. Auto-Fixes Existing COA Files
If you have existing COA files created as `root:root`, the script automatically fixes them:

```bash
# Before:
-rw-rw-r-- root:root prince_txt.txt

# After:
-rw-rw-r-- freerad:freerad prince_txt.txt
```

### 5. Configures Sudo
Allows running these commands without password:
- `sudo freeradius -C` (validation)
- `sudo systemctl reload freeradius` (service control)
- `sudo radclient` (COA commands)

---

## What You Get

| Item | Before | After |
|------|--------|-------|
| **Config files** | `rw-r-----` (group read-only) | `rw-rw----` (group read+write) |
| **Cert files** | `rw-r-----` (group read-only) | `rw-rw----` (group read+write) |
| **COA directory** | `root:root` | `freerad:freerad` |
| **COA files** | `root:root` | `freerad:freerad` (auto-fixed!) |
| **New COA files** | Auto-created with `freerad:freerad` by backend |

---

## Technical Details

### Command: `chmod g+w`
```bash
chmod g+w /etc/freeradius/3.0/radiusd.conf
```
**Translation:** "Add write permission to GROUP"

**Result:** `-rw-r-----` becomes `-rw-rw----`

### What's Safe
- ✅ **Ownership unchanged:** Still `freerad:freerad`
- ✅ **User permissions unchanged:** Still `rw-`
- ✅ **Others blocked:** Still no access (`---`)
- ✅ **FreeRADIUS unaffected:** Service doesn't care about group write

### Backend Auto-Fix
New COA files are automatically created with correct ownership:

```typescript
// backend/src/services/coaService.ts
await fs.writeFile(filePath, content);
const dirStats = await fs.stat(config.freeradius.coaDir);
await fs.chown(filePath, dirStats.uid, dirStats.gid);  // Match directory owner
```

---

## Verification

After running the script and logging back in:

```bash
# 1. Group membership
groups | grep freerad
# Expected: shows "freerad"

# 2. File permissions
ls -l /etc/freeradius/3.0/radiusd.conf
# Expected: -rw-rw---- freerad:freerad

# 3. Cert permissions
ls -l /etc/freeradius/3.0/certs/server.pem
# Expected: -rw-rw---- freerad:freerad

# 4. COA directory
ls -ld /etc/freeradius/3.0/coa
# Expected: drwxrwx--- freerad:freerad

# 5. COA files
ls -l /etc/freeradius/3.0/coa/
# Expected: -rw-rw-r-- freerad:freerad (all files)
```

---

## Why One Script?

Previously needed multiple steps:
- Run permission script
- Run COA fix script
- Manual verification

**Now:** ONE script does everything automatically!

---

## Troubleshooting

### "Permission denied" errors
**Solution:** Log out and back in (group membership requires new session)

### COA files still showing root ownership
**Solution:** Re-run the script - it auto-fixes existing files

### Backend can't write files
**Cause:** Didn't log out/in after running script  
**Solution:** `exit` then log back in

---

## Summary

**ONE command:**
```bash
./scripts/setup-permissions.sh
```

**Does:**
1. Group = User permissions (exact match)
2. Certs included (RadSec ready)
3. COA directory owned by freerad:freerad
4. Existing COA files auto-fixed
5. New COA files auto-created correctly (backend)
6. Sudo configured

**Result:** Zero permission errors, everything works!
