# Foundry VTT Custom Modules

This directory contains **our custom modules** that extend Foundry VTT functionality. These modules are **our code** and are included in version control.

## Directory Structure

```
src/modules/
├── foundry-postgresql-storage/    # Database storage adapter
│   ├── module.json                 # Foundry module manifest
│   ├── scripts/                    # Module code
│   ├── LICENSE                     # MIT or Apache 2.0
│   └── README.md
├── foundry-crit-fumble-auth/       # Authentication integration
│   ├── module.json
│   ├── scripts/
│   └── README.md
└── README.md                       # This file
```

## Modules vs Foundry Core

### What Goes Here? ✅

- **Our custom modules** that extend Foundry
- **Open source code** we develop
- **Packages** that work with Foundry
- **Integration code** for Crit-Fumble features

### What Doesn't Go Here? ❌

- **Foundry VTT core** → `src/platforms/foundryvtt/` (not in git)
- **Third-party modules** → Downloaded by Foundry at runtime
- **User data** → Stored in database or Foundry's data directory

---

## Current Modules

### 1. foundry-postgresql-storage

**Status**: 🚧 In Development

**Purpose**: Replace Foundry's default LevelDB storage with PostgreSQL

**Key Features**:
- Database adapter for Foundry documents
- Connection to Crit-Fumble PostgreSQL database
- Real-time data synchronization
- Support for all Foundry document types

**Location**: `src/modules/foundry-postgresql-storage/`

**License**: MIT (our code, distributable)

---

### 2. foundry-crit-fumble-auth (Planned)

**Status**: 📋 Planned

**Purpose**: Handle authentication between Crit-Fumble and Foundry instances

**Key Features**:
- SSO (Single Sign-On) integration
- Session token validation
- User permission mapping
- Automatic login from iframe

**Location**: `src/modules/foundry-crit-fumble-auth/`

**License**: MIT (our code, distributable)

---

## Module Development

### Creating a New Module

1. **Create module directory**:
   ```bash
   mkdir -p src/modules/my-module
   cd src/modules/my-module
   ```

2. **Create `module.json` manifest**:
   ```json
   {
     "id": "my-module",
     "title": "My Module",
     "version": "1.0.0",
     "compatibility": {
       "minimum": "11",
       "verified": "11"
     },
     "esmodules": ["scripts/init.mjs"],
     "authors": [{
       "name": "Crit-Fumble",
       "url": "https://crit-fumble.com"
     }],
     "description": "Module description"
   }
   ```

3. **Create module code**:
   ```javascript
   // scripts/init.mjs
   Hooks.once('init', () => {
     console.log('My Module | Initializing');
   });
   ```

4. **Add to git**:
   ```bash
   git add src/modules/my-module/
   git commit -m "Add my-module"
   ```

### Module Structure Best Practices

```
my-module/
├── module.json           # Required: Foundry manifest
├── README.md             # Documentation
├── LICENSE               # Your license (MIT, Apache, etc.)
├── CHANGELOG.md          # Version history
├── scripts/              # JavaScript/TypeScript code
│   ├── init.mjs         # Main entry point
│   ├── api.mjs          # API integration
│   ├── utils.mjs        # Utilities
│   └── models/          # Data models
├── styles/               # CSS (if needed)
│   └── module.css
├── lang/                 # Translations
│   └── en.json
└── templates/            # Handlebars templates (if needed)
    └── my-template.hbs
```

---

## Installing Modules in Foundry

### Development (Local)

There are two approaches:

#### Option A: Symlink (Recommended for Dev)

```bash
# Create symlink from Foundry's modules directory to our source
cd src/platforms/foundryvtt/Data/modules/
ln -s ../../../../modules/foundry-postgresql-storage ./foundry-postgresql-storage
```

#### Option B: Copy During Build

Add to your build script:
```bash
# Copy modules to Foundry directory
cp -r src/modules/* src/platforms/foundryvtt/Data/modules/
```

### Production (Docker)

In your Dockerfile:
```dockerfile
# Copy our custom modules
COPY src/modules/foundry-postgresql-storage /foundry/Data/modules/foundry-postgresql-storage
COPY src/modules/foundry-crit-fumble-auth /foundry/Data/modules/foundry-crit-fumble-auth

# Foundry will auto-discover modules in this directory
```

---

## Module Registration

### In Foundry

Modules placed in the `Data/modules/` directory are automatically discovered by Foundry.

Users can enable/disable them in:
- **Setup Screen** → Module Management
- **World Settings** → Module Management

### Programmatic Installation

Our API can automatically enable modules for new worlds:

```javascript
// When creating a new Foundry world
POST /api/foundry/worlds
{
  "name": "My Campaign",
  "system": "dnd5e",
  "modules": [
    "foundry-postgresql-storage",  // Auto-enable our modules
    "foundry-crit-fumble-auth"
  ]
}
```

---

## Foundry Module API

### Module Manifest (`module.json`)

Required fields:
```json
{
  "id": "my-module",              // Unique identifier
  "title": "My Module Title",      // Display name
  "version": "1.0.0",              // Semantic versioning
  "compatibility": {
    "minimum": "11",               // Min Foundry version
    "verified": "11",              // Tested Foundry version
    "maximum": "11"                // Max version (optional)
  },
  "esmodules": ["init.mjs"],       // ES module entry points
  "scripts": ["legacy.js"],        // Legacy scripts (avoid)
  "styles": ["style.css"],         // CSS files
  "languages": [{
    "lang": "en",
    "name": "English",
    "path": "lang/en.json"
  }]
}
```

### Hooks

Common Foundry hooks for modules:

```javascript
// Initialize module
Hooks.once('init', () => {
  console.log('Module initializing...');
});

// After initialization
Hooks.once('ready', () => {
  console.log('Module ready!');
});

// Document operations
Hooks.on('createActor', (actor, options, userId) => {
  console.log('Actor created:', actor.name);
});

Hooks.on('updateItem', (item, changes, options, userId) => {
  console.log('Item updated:', item.name);
});
```

---

## Testing Modules

### Local Testing

1. **Start Foundry with our module**:
   ```bash
   cd src/platforms/foundryvtt
   node main.mjs --dataPath=./Data
   ```

2. **Navigate to**: http://localhost:30000

3. **Enable module**:
   - Setup → Module Management
   - Check your module
   - Launch World

4. **Check console** for module logs

### Automated Testing

```javascript
// tests/modules/foundry-postgresql-storage.test.js
describe('PostgreSQL Storage Module', () => {
  it('should connect to database', async () => {
    const module = await loadModule('foundry-postgresql-storage');
    expect(module.connected).toBe(true);
  });
});
```

---

## Distribution

### Our Modules (Internal Use)

✅ **Can distribute** - They're our code
✅ **Can modify** - We own the code
✅ **Can open source** - MIT/Apache license
✅ **Can sell** - Commercial use allowed

These modules will be:
- Included in our Docker images
- Auto-installed for all Crit-Fumble worlds
- Available for self-hosted users

### Third-Party Modules

If we want to include third-party Foundry modules:
- Check their licenses (most are free/open source)
- Some require attribution
- Cannot redistribute without permission
- Best to let Foundry download them at runtime

---

## Module Dependencies

### Declaring Dependencies

If your module depends on another module:

```json
{
  "id": "my-module",
  "relationships": {
    "requires": [{
      "id": "foundry-postgresql-storage",
      "type": "module",
      "manifest": "https://crit-fumble.com/modules/foundry-postgresql-storage/module.json",
      "compatibility": {
        "minimum": "1.0.0"
      }
    }]
  }
}
```

### System Dependencies

If your module requires a specific game system:

```json
{
  "relationships": {
    "systems": [{
      "id": "dnd5e",
      "type": "system",
      "compatibility": {
        "minimum": "3.0.0"
      }
    }]
  }
}
```

---

## Best Practices

### ✅ Do:
- Use semantic versioning
- Document all features
- Include LICENSE file
- Write README with examples
- Use TypeScript for complex modules
- Add comprehensive error handling
- Test with multiple Foundry versions
- Follow Foundry's coding standards

### ❌ Don't:
- Modify Foundry core files
- Override core Foundry classes (extend instead)
- Bundle Foundry code in your module
- Hard-code database credentials
- Ignore backwards compatibility
- Skip error handling

---

## Resources

### Official Documentation
- [Module Development Guide](https://foundryvtt.com/article/module-development/)
- [Foundry API Docs](https://foundryvtt.com/api/)
- [Package Development Best Practices](https://foundryvtt.com/article/package-development-best-practices/)

### Community Resources
- [Foundry Discord](https://discord.gg/foundryvtt) - #module-development
- [Foundry VTT Subreddit](https://reddit.com/r/FoundryVTT)
- [League of Extraordinary Foundry Developers](https://github.com/League-of-Foundry-Developers)

### Examples
- [Our modules](.) - This directory
- [Foundry Community Modules](https://foundryvtt.com/packages/modules)

---

**Last Updated**: 2025-11-19
