# FreeRADIUS UI - Permission Model

## Overview

This backend uses a **secure permission model** similar to the Python version, where:

1. **Backend user is added to `freerad` group** - Inherits native FreeRADIUS permissions
2. **Group write permissions** on `/etc/freeradius/3.0/` - Enables direct file editing without `sudo cp`
3. **Minimal sudo permissions** - Only for commands that require root (validation, service control, radclient)

## Why This Approach?

✅ **Secure**: Maintains FreeRADIUS native security model (`freerad:freerad` ownership)  
✅ **No password piping**: No need for `echo "password" | sudo -S`  
✅ **Direct file I/O**: Backend can read/write config files natively  
✅ **Minimal sudo**: Only specific commands allowed, not blanket sudo access  

## Permission Structure

```
/etc/freeradius/3.0/
├── Directory permissions: 775 (rwxrwxr-x)
├── File permissions: 664 (rw-rw-r--)
├── Owner: freerad:freerad
└── Group members: freerad, <backend-user>

/var/log/freeradius/
├── Directory permissions: 775
├── Owner: freerad:freerad
└── Group members: freerad, <backend-user>
```

## Setup

Run the automated setup script:

```bash
cd /tmp/my-app
chmod +x scripts/setup-permissions.sh
./scripts/setup-permissions.sh
```

Or manually:

```bash
# 1. Add user to freerad group
sudo usermod -aG freerad $USER

# 2. Set group permissions
sudo find /etc/freeradius/3.0 -type d -not -path "*/certs*" -exec chmod 775 {} +
sudo find /etc/freeradius/3.0 -type f -not -path "*/certs*" -exec chmod 664 {} +
sudo chown -R freerad:freerad /var/log/freeradius
sudo chmod -R 775 /var/log/freeradius

# 3. Configure sudoers (copy from script)

# 4. Log out and back in for group changes
```

## Sudoers Configuration

Located at `/etc/sudoers.d/freeradius-ui`:

```
$USER ALL=(ALL) NOPASSWD: /usr/sbin/freeradius -C -D *
$USER ALL=(ALL) NOPASSWD: /usr/bin/radclient
$USER ALL=(ALL) NOPASSWD: /bin/systemctl reload freeradius
$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart freeradius
$USER ALL=(ALL) NOPASSWD: /bin/systemctl show freeradius
```

## File Operations

### Reading Files
```typescript
// Direct read - no sudo needed!
const content = await fs.readFile('/etc/freeradius/3.0/users', 'utf-8');
```

### Writing Files
```typescript
// Direct write - no sudo needed!
await fs.writeFile('/etc/freeradius/3.0/users', content, 'utf-8');
```

### Validation
```typescript
// Requires sudo (root-level operation)
const { stdout } = await execAsync('sudo freeradius -C -D /etc/freeradius/3.0');
```

### Service Control
```typescript
// Requires sudo (systemctl operations)
await execAsync('sudo systemctl reload freeradius');
```

### COA Commands
```typescript
// Requires sudo (radclient needs network capabilities)
await execAsync(`sudo radclient -f ${file} -x -r 1 ${nasIp} ${type} ${secret}`);
```

## Troubleshooting

### "Permission denied" when writing files

1. Check group membership:
   ```bash
   groups $USER
   ```
   Should show `freerad` or `freeradius`

2. Log out and back in for group changes to take effect

3. Verify file permissions:
   ```bash
   ls -la /etc/freeradius/3.0/users
   ```
   Should show: `rw-rw-r-- 1 freerad freerad`

### "sudo: no password" errors

Check sudoers configuration:
```bash
sudo visudo -c -f /etc/sudoers.d/freeradius-ui
```

### Test permissions

```bash
# Test file write (should work without sudo)
touch /etc/freeradius/3.0/test.tmp && rm /etc/freeradius/3.0/test.tmp

# Test sudo validation (should work without password)
sudo freeradius -C -D /etc/freeradius/3.0
```

## Security Notes

- ✅ Backend never runs as root
- ✅ FreeRADIUS configs remain owned by `freerad` user
- ✅ SSL certificates excluded from group write (stay 600)
- ✅ Sudo access limited to specific commands only
- ✅ No password storage or transmission

## Production Deployment

For production, consider:

1. Running backend as dedicated system user (not personal user)
2. Using systemd service with proper User/Group settings
3. Setting UMask=0002 to ensure new files inherit group permissions
4. Regular permission audits
5. SELinux/AppArmor policies if available
