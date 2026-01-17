# Authority Button Testing Guide

## What Was Changed
Added extensive debug logging to diagnose the "Assign Authority" button issue.

## How to Test

### 1. Open Admin Dashboard
- Navigate to `/admin-dashboard.html`
- Login with admin credentials
- Click on "Authority" tab in navigation

### 2. Open Browser Console
- Press F12 (Chrome/Firefox) or Cmd+Option+I (Mac)
- Go to "Console" tab
- Clear any existing logs

### 3. Click "➕ Assign Authority" Button
Watch for these console logs in order:

```
Button clicked: create-authority
Handling action: create-authority
=== handleAction START ===
Action: create-authority
Button: <button class="btn" data-action="create-authority">
Event: MouseEvent {...}
✅ Create authority case matched
Resetting form...
Form reset complete
Calling showSection...
=== showSection START ===
Target section: authority-form-section
Total sections found: [number]
Removed active from: dashboard
Removed active from: moments
... (all sections)
Target element: <div id="authority-form-section">
✅ Added active class to: authority-form-section
Target display: block
✅ Scrolled to section
=== showSection END ===
✅ showSection called
```

### 4. Expected Behavior
- Authority form section should become visible
- Page should scroll to the form
- Form should be reset (empty fields)
- Title should say "Assign Authority"

### 5. If Button Still Not Working

Check console for:
- ❌ **No logs at all**: Event listener not attached
- ❌ **"Button clicked" but no "handleAction"**: Action not being called
- ❌ **"Section not found"**: DOM element missing
- ❌ **JavaScript errors**: Syntax or runtime error

### 6. Common Issues

**Issue**: No console logs appear
**Fix**: Check if JavaScript is enabled, check for script errors earlier in page load

**Issue**: Logs show but section doesn't appear
**Fix**: Check CSS - `.section.active { display: block; }` rule may be missing

**Issue**: "Form not found" error
**Fix**: `authority-form` element ID is missing or misspelled

## Standalone Test
Open `test-authority-button.html` in browser for isolated button test without full admin dashboard.

## Rollback
If issues persist, previous version without debug logs is in git history:
```bash
git log --oneline | head -5
git checkout HEAD~1 public/admin-dashboard.html
```
