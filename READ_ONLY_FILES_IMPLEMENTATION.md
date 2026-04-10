# Read-Only Files Implementation

## Summary
Users can now view the `authorize` and `users` files from the UI but **cannot edit** them. These files are now read-only.

## Files Affected

### Read-Only Files (Cannot be edited from UI):
1. `/etc/freeradius/3.0/mods-config/files/authorize`
2. `/etc/freeradius/3.0/users`

## Changes Made

### Backend Changes

#### 1. `backend/src/services/fileService.ts`

**Added:**
- New helper function `isReadOnlyFile()` to check if a file path matches the read-only files
- Updated `FileContentResponse` interface to include optional `readOnly` boolean flag
- Modified `getFileContent()` to return `readOnly: true` for authorize and users files
- Modified `saveFile()` to reject save attempts on read-only files with error message

**Code snippets:**
```typescript
// Helper to check if file is read-only
function isReadOnlyFile(filePath: string): boolean {
  const authorizeFile = path.join(config.freeradius.baseDir, 'mods-config/files/authorize');
  const usersFile = path.join(config.freeradius.baseDir, 'users');
  
  return filePath === authorizeFile || filePath === usersFile;
}

// getFileContent now returns readOnly flag
return {
  content,
  mtime: stats.mtimeMs,
  readOnly: isReadOnlyFile(filePath),
};

// saveFile rejects edits to read-only files
if (isReadOnlyFile(filePath)) {
  return {
    status: 'validation_failed',
    message: 'This file is read-only and cannot be edited from the UI',
    validationError: 'This file is read-only. You can only view its content, not modify it.',
  };
}
```

### Frontend Changes

#### 2. `lib/apiClient.ts`
- Updated `FileContentResponse` interface to include optional `readOnly?: boolean` field

#### 3. `components/editor-panel.tsx`
- Added `isReadOnly` state to track if current file is read-only
- Updated file loading logic to set `isReadOnly` from API response
- Modified `handleEditorChange()` to prevent changes when `isReadOnly` is true
- Set Monaco editor's `readOnly` option based on `isReadOnly` state
- Passed `isReadOnly` prop to `EditorTopBar` component

#### 4. `components/editor-top-bar.tsx`
- Added `isReadOnly` prop to component interface
- Added **READ-ONLY badge** with eye icon when file is read-only
- Hidden **Save** and **Reset** buttons when file is read-only
- Hidden modification indicator dot when file is read-only

## User Experience

### When viewing a read-only file:
1. ✅ File content is **visible** in the editor
2. ✅ **READ-ONLY badge** with eye icon appears in the top bar
3. ✅ Monaco editor is in **read-only mode** (cannot type or modify)
4. ✅ **Save** and **Reset** buttons are **hidden**
5. ✅ Copy path button still works
6. ✅ If user somehow tries to save (e.g., via API), backend rejects with error message

### When viewing a normal editable file:
- Everything works as before
- No changes to existing functionality

## Testing Recommendations

1. **Test read-only file viewing:**
   - Open `/etc/freeradius/3.0/mods-config/files/authorize` → Should show READ-ONLY badge, cannot edit
   - Open `/etc/freeradius/3.0/users` → Should show READ-ONLY badge, cannot edit

2. **Test normal file editing:**
   - Open any file in `/etc/freeradius/3.0/mods-config/files/users.d/` → Should be editable as normal
   - Verify save/reset buttons work

3. **Test backend protection:**
   - Try to save a read-only file via API → Should receive validation_failed response

## Technical Details

- **Backend validation:** Files are checked against absolute paths using `path.join()` with `config.freeradius.baseDir`
- **Frontend state:** `isReadOnly` state is set when file is loaded
- **Monaco editor:** Uses native `readOnly` option for better UX (cursor changes, no editing allowed)
- **UI indicators:** Clear visual feedback with READ-ONLY badge and hidden action buttons
