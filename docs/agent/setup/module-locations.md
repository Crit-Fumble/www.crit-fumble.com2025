# Module Storage Locations - Quick Reference

## Directory Structure

```
www.crit-fumble.com/
├── src/
│   ├── platforms/                    # Third-party platform source code
│   │   ├── foundryvtt/              # ⚠️ NOT IN GIT (licensed software)
│   │   ├── FOUNDRY_VTT_LICENSE.md   # License documentation
│   │   └── README.md                # Platform setup guide
│   │
│   └── modules/                      # ✅ OUR MODULES (in git)
│       ├── foundry-postgresql-storage/
│       │   ├── module.json          # Foundry module manifest
│       │   ├── scripts/             # Module code
│       │   │   └── init.mjs
│       │   ├── LICENSE              # MIT License
│       │   ├── README.md
│       │   └── CHANGELOG.md
│       │
│       ├── foundry-crit-fumble-auth/  (planned)
│       │
│       └── README.md                # Module development guide
```

---

## What Goes Where?

### ❌ NOT in Git (Excluded by .gitignore)

**`src/platforms/foundryvtt/`**
- Foundry VTT source code (proprietary)
- Must be obtained separately with valid license
- Each developer downloads their own copy
- See: `src/platforms/FOUNDRY_VTT_LICENSE.md`

### ✅ IN Git (Our Code)

**`src/modules/*`**
- Our custom Foundry modules
- MIT licensed (distributable)
- Version controlled
- Can be open sourced

---

## Quick Commands

### Check Module Location
```bash
# Your modules should be here:
ls src/modules/

# Expected output:
# - foundry-postgresql-storage/
# - README.md
```

### Check Foundry Location
```bash
# Foundry should be here (but won't be in git):
ls src/platforms/foundryvtt/

# If missing: Download from foundryvtt.com
```

### Install Module for Development
```bash
# Option 1: Symlink (recommended)
cd src/platforms/foundryvtt/Data/modules/
ln -s ../../../../modules/foundry-postgresql-storage ./

# Option 2: Copy
cp -r src/modules/foundry-postgresql-storage src/platforms/foundryvtt/Data/modules/
```

---

## Module Status

### foundry-postgresql-storage
**Status**: 🚧 In Development
**Purpose**: Replace LevelDB with PostgreSQL
**License**: MIT
**Location**: `src/modules/foundry-postgresql-storage/`
**Version**: 0.1.0 (pre-alpha)

### foundry-crit-fumble-auth
**Status**: 📋 Planned
**Purpose**: SSO authentication integration
**License**: MIT
**Location**: `src/modules/foundry-crit-fumble-auth/` (not created yet)

---

## For New Developers

1. **Clone repository** - Modules are included
   ```bash
   git clone https://github.com/crit-fumble/www.crit-fumble.com.git
   ```

2. **Foundry NOT included** - Download separately
   - Purchase license: https://foundryvtt.com/purchase/
   - Download: https://foundryvtt.com/me/licenses
   - Extract to: `src/platforms/foundryvtt/`

3. **Install our modules** - Symlink or copy
   ```bash
   # See "Install Module for Development" above
   ```

4. **Start developing** - Modules are ready to edit
   ```bash
   cd src/modules/foundry-postgresql-storage/
   # Edit code here
   ```

---

## Production Deployment

### Docker Image Build
```dockerfile
# Copy Foundry (obtained separately)
COPY /path/to/foundry/ /foundry/

# Copy our modules (from git)
COPY src/modules/foundry-postgresql-storage /foundry/Data/modules/foundry-postgresql-storage
COPY src/modules/foundry-crit-fumble-auth /foundry/Data/modules/foundry-crit-fumble-auth
```

### Module Auto-Enable
```javascript
// In world configuration
{
  "modules": [
    "foundry-postgresql-storage",  // Always enabled
    "foundry-crit-fumble-auth"     // Always enabled
  ]
}
```

---

## References

- **Module Development**: `src/modules/README.md`
- **Foundry License**: `src/platforms/FOUNDRY_VTT_LICENSE.md`
- **Platform Setup**: `src/platforms/README.md`
- **Architecture**: `todo/next.md`

---

**Last Updated**: 2025-11-19
