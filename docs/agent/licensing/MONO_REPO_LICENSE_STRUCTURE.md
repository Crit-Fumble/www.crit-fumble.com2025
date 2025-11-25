# Mono-Repo License Structure Guide

**Date**: November 24, 2025
**Status**: 📋 **SPECIFICATION**

---

## Overview

This guide explains how to structure the Crit-Fumble mono-repo with multiple licenses:
- **Apache 2.0** - Core business logic, APIs, authentication
- **MIT** - Simple utilities, UI components
- **CC BY 4.0** - Game content, documentation, SRD data
- **CC0** - Public domain content (third-party)
- **All Rights Reserved** - Proprietary assets (logo, branding, custom audio/video)

---

## User Questions Answered

### Q: Can we use CC0 content in CC BY 4.0 releases?

**A: Yes, absolutely!**

CC0 is "no rights reserved" - the most permissive license. It allows you to:
- ✅ Use in CC BY 4.0 works
- ✅ Use in proprietary works
- ✅ Use in Apache 2.0/MIT works
- ✅ Commercial use
- ✅ No attribution required (though ethically recommended)

**Example**:
```
CC0 artwork (from OpenGameArt)
+
CC BY 4.0 game mechanics (your original content)
=
CC BY 4.0 combined work ✅
```

**Important**: When combining licenses, the **most restrictive** license applies to the combined work:

| Combined Licenses | Result |
|-------------------|--------|
| CC0 + CC BY 4.0 | CC BY 4.0 (attribution required) |
| CC0 + Apache 2.0 | Apache 2.0 (code license) |
| CC BY 4.0 + CC BY-SA 4.0 | CC BY-SA 4.0 (share-alike) |
| CC0 + MIT | MIT (permissive) |

### Q: How should we divide the mono-repo? Can we have multiple licenses in the same repo?

**A: Yes! Multiple licenses in one repo is common and well-supported.**

**Examples of multi-license repos**:
- **Android** (Apache 2.0 + MIT + BSD)
- **Kubernetes** (Apache 2.0 + MIT)
- **React** (MIT, but Facebook used to dual-license BSD + Patents)
- **Blender** (GPL for software, CC BY for docs)

---

## Recommended Mono-Repo Structure

```
crit-fumble/
├── LICENSE                       # Main license file (explains all licenses)
├── LICENSE-APACHE               # Full Apache 2.0 text
├── LICENSE-MIT                  # Full MIT text
├── NOTICE                       # Attribution file (Apache 2.0 requirement)
├── README.md                    # Project overview + license summary
│
├── src/                         # 🔶 Apache 2.0 (core application)
│   ├── app/                     # 🔶 Apache 2.0 (Next.js app routes)
│   │   ├── api/                 # 🔶 Apache 2.0 (API routes - business logic)
│   │   ├── auth/                # 🔶 Apache 2.0 (authentication)
│   │   └── (routes)/            # 🔶 Apache 2.0 (page routes)
│   │
│   ├── lib/                     # 🔶 Apache 2.0 (core utilities)
│   │   ├── auth.ts             # 🔶 Apache 2.0 (auth logic)
│   │   ├── admin.ts            # 🔶 Apache 2.0 (permissions)
│   │   ├── rate-limit.ts       # 🔶 Apache 2.0 (security)
│   │   └── ai.ts               # 🔶 Apache 2.0 (AI integrations)
│   │
│   ├── components/              # 🔷 MIT (UI components - non-business)
│   │   ├── atoms/              # 🔷 MIT (simple UI components)
│   │   ├── molecules/          # 🔷 MIT (composed UI components)
│   │   └── organisms/          # 🔷 MIT (complex UI components)
│   │
│   └── hooks/                   # 🔷 MIT (React hooks - UI utilities)
│
├── packages/                    # Mixed licenses by package
│   ├── cfg-core/               # 🔶 Apache 2.0 (business logic package)
│   │   ├── package.json        # Specifies "license": "Apache-2.0"
│   │   └── src/
│   │       ├── permissions.ts  # 🔶 Apache 2.0
│   │       └── worldbuilding.ts # 🔶 Apache 2.0
│   │
│   ├── cfg-utils/              # 🔷 MIT (simple utilities)
│   │   ├── package.json        # Specifies "license": "MIT"
│   │   └── src/
│   │       ├── string.ts       # 🔷 MIT
│   │       └── math.ts         # 🔷 MIT
│   │
│   ├── cfg-ui/                 # 🔷 MIT (UI component library)
│   │   ├── package.json        # Specifies "license": "MIT"
│   │   └── src/
│   │       ├── Button.tsx      # 🔷 MIT
│   │       └── Card.tsx        # 🔷 MIT
│   │
│   └── cfg-lib/                # 🔶 Apache 2.0 (platform library)
│       ├── package.json        # Specifies "license": "Apache-2.0"
│       └── src/
│           └── prisma-adapter.ts # 🔶 Apache 2.0
│
├── prisma/                      # 🔶 Apache 2.0 (database schema)
│   ├── schema.prisma           # 🔶 Apache 2.0 (database structure)
│   └── migrations/             # 🔶 Apache 2.0 (migration scripts)
│
├── data/                        # 📘 CC BY 4.0 (game content)
│   ├── srd/                    # 📘 CC BY 4.0 (D&D 5e SRD - WotC)
│   │   ├── classes.json        # 📘 CC BY 4.0 (requires WotC attribution)
│   │   ├── spells.json         # 📘 CC BY 4.0
│   │   └── monsters.json       # 📘 CC BY 4.0
│   │
│   ├── core-concepts/          # 📘 CC BY 4.0 (your original content)
│   │   ├── tile-types.json     # 📘 CC BY 4.0
│   │   ├── card-types.json     # 📘 CC BY 4.0
│   │   └── systems.json        # 📘 CC BY 4.0
│   │
│   └── cc0/                    # 📗 CC0 (public domain)
│       ├── fantasy-names.json  # 📗 CC0
│       └── dice-tables.json    # 📗 CC0
│
├── docs/                        # 📘 CC BY 4.0 (documentation)
│   ├── agent/                  # 📘 CC BY 4.0 (AI documentation)
│   ├── guides/                 # 📘 CC BY 4.0 (user guides)
│   └── api/                    # 📘 CC BY 4.0 (API docs)
│
├── public/                      # Mixed licenses
│   ├── assets/
│   │   ├── proprietary/        # 🔒 All Rights Reserved
│   │   │   ├── logo.svg        # 🔒 All Rights Reserved (branding)
│   │   │   ├── branding/       # 🔒 All Rights Reserved
│   │   │   └── custom-ui/      # 🔒 All Rights Reserved (custom artwork)
│   │   │
│   │   ├── cc0/                # 📗 CC0 (public domain)
│   │   │   ├── icons/          # 📗 CC0 (e.g., from Font Awesome)
│   │   │   └── textures/       # 📗 CC0 (e.g., from OpenGameArt)
│   │   │
│   │   └── cc-by/              # 📘 CC BY 4.0 (attributed)
│   │       └── artwork/        # 📘 CC BY 4.0 (requires artist credit)
│   │
│   ├── audio/                   # Mixed licenses (tracked in database)
│   │   ├── proprietary/        # 🔒 All Rights Reserved (custom music)
│   │   ├── cc0/                # 📗 CC0 (public domain SFX)
│   │   └── cc-by/              # 📘 CC BY 4.0 (attributed music)
│   │
│   └── video/                   # 🔒 All Rights Reserved (custom videos)
│
├── scripts/                     # 🔶 Apache 2.0 (build scripts)
│   ├── dev/                    # 🔶 Apache 2.0
│   └── deploy/                 # 🔶 Apache 2.0
│
├── tests/                       # 🔶 Apache 2.0 (test code)
│   ├── unit/                   # 🔶 Apache 2.0
│   ├── integration/            # 🔶 Apache 2.0
│   └── e2e/                    # 🔶 Apache 2.0
│
└── .github/                     # 🔶 Apache 2.0 (CI/CD workflows)
    └── workflows/              # 🔶 Apache 2.0
```

---

## License Boundaries Explained

### 🔶 Apache 2.0 (Core Business Logic)

**When to Use**:
- Core business logic and algorithms
- API routes and backend services
- Authentication and authorization
- Database schemas and migrations
- Third-party API integrations
- Security-critical code
- Anything that might have patent implications

**Why Apache 2.0**:
- Patent grant protection
- Trademark protection (excludes "Crit-Fumble" branding)
- Strong contributor protections
- Commercial-friendly

**Examples**:
```typescript
// src/lib/auth.ts - Apache 2.0
/*
 * Copyright 2025 Crit-Fumble Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export async function authenticateUser(credentials: Credentials) {
  // Business logic - Apache 2.0
}
```

### 🔷 MIT (UI Components & Utilities)

**When to Use**:
- Simple utility functions
- UI components (buttons, cards, modals)
- React hooks (non-business logic)
- String/math helpers
- Formatting utilities
- Generic tools

**Why MIT**:
- Maximum adoption (simplest license)
- No patent complications
- Easier for other projects to use
- Community-friendly

**Examples**:
```typescript
// src/hooks/useToggle.ts - MIT
/*
 * Copyright 2025 Crit-Fumble Contributors
 * SPDX-License-Identifier: MIT
 */

export function useToggle(initialValue = false) {
  // Simple utility - MIT
}
```

### 📘 CC BY 4.0 (Content & Documentation)

**When to Use**:
- Documentation files
- Game mechanics and rules
- Character/creature data
- UI text and descriptions
- Database seed data
- Original content

**Why CC BY 4.0**:
- Compatible with D&D 5e SRD
- Allows remixing and adaptation
- Attribution requirement protects creators
- Designed for creative works

**Examples**:
```markdown
<!-- docs/guides/getting-started.md - CC BY 4.0 -->
<!--
Copyright 2025 Crit-Fumble Contributors
SPDX-License-Identifier: CC-BY-4.0
-->

# Getting Started Guide
```

### 📗 CC0 (Public Domain)

**When to Use**:
- Third-party public domain content
- Simple data tables
- Generic assets
- Content you want maximum adoption of

**Why CC0**:
- Most permissive (no restrictions)
- Can be used in any license
- No attribution required (though ethically recommended)

**Examples**:
```json
// data/cc0/fantasy-names.json - CC0
{
  "license": "CC0-1.0",
  "source": "OpenGameArt",
  "names": ["Aldric", "Brenna", "Cedric"]
}
```

### 🔒 All Rights Reserved (Proprietary)

**When to Use**:
- Crit-Fumble logo and branding
- Custom artwork and illustrations
- Original music and sound effects
- Video content
- Proprietary game content

**Why All Rights Reserved**:
- Protects brand identity
- Prevents misuse of assets
- Allows controlled licensing
- Maintains IP value

**Examples**:
```
public/assets/proprietary/logo.svg
© 2025 Crit-Fumble. All Rights Reserved.
```

---

## File-Level License Headers

### Apache 2.0 Header

```typescript
/**
 * Copyright 2025 Crit-Fumble Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
```

### MIT Header

```typescript
/**
 * Copyright 2025 Crit-Fumble Contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * SPDX-License-Identifier: MIT
 */
```

### Short Header (Recommended)

For brevity, use **SPDX short identifiers**:

```typescript
/*
 * Copyright 2025 Crit-Fumble Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
```

```typescript
/*
 * Copyright 2025 Crit-Fumble Contributors
 * SPDX-License-Identifier: MIT
 */
```

```markdown
<!--
Copyright 2025 Crit-Fumble Contributors
SPDX-License-Identifier: CC-BY-4.0
-->
```

---

## Package-Level Licensing

### package.json for Apache 2.0 Package

```json
{
  "name": "@crit-fumble/core",
  "version": "1.0.0",
  "license": "Apache-2.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/crit-fumble.git",
    "directory": "packages/cfg-core"
  },
  "author": "Crit-Fumble Contributors",
  "files": [
    "dist",
    "LICENSE-APACHE",
    "NOTICE"
  ]
}
```

### package.json for MIT Package

```json
{
  "name": "@crit-fumble/utils",
  "version": "1.0.0",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/crit-fumble.git",
    "directory": "packages/cfg-utils"
  },
  "author": "Crit-Fumble Contributors",
  "files": [
    "dist",
    "LICENSE-MIT"
  ]
}
```

---

## Updated Main LICENSE File

The main `LICENSE` file should explain the multi-license structure:

```markdown
# Crit-Fumble License

This mono-repo contains components under different licenses:

## 1. Software Code

### Apache License 2.0 (Core Business Logic)

**Applies to**:
- `src/app/` - Application routes and API
- `src/lib/` - Core utilities and business logic
- `packages/cfg-core/` - Core business logic package
- `packages/cfg-lib/` - Platform library
- `prisma/` - Database schema
- `scripts/` - Build and deployment scripts
- `tests/` - Test code
- `.github/` - CI/CD workflows

**Full License**: [LICENSE-APACHE](LICENSE-APACHE)

### MIT License (UI Components & Utilities)

**Applies to**:
- `src/components/` - UI components
- `src/hooks/` - React hooks
- `packages/cfg-utils/` - Simple utility functions
- `packages/cfg-ui/` - UI component library

**Full License**: [LICENSE-MIT](LICENSE-MIT)

## 2. Content & Documentation (CC BY 4.0)

**Applies to**:
- `docs/` - Documentation
- `data/core-concepts/` - Original game content
- `data/srd/` - D&D 5e SRD content (WotC)

**Full License**: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## 3. Public Domain (CC0)

**Applies to**:
- `data/cc0/` - Public domain content
- `public/assets/cc0/` - Public domain assets

**Full License**: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)

## 4. Proprietary (All Rights Reserved)

**Applies to**:
- `public/assets/proprietary/` - Crit-Fumble branding
- `public/audio/proprietary/` - Custom audio
- `public/video/` - Video content

**Rights**: All Rights Reserved. See LICENSE for usage terms.
```

---

## License Compatibility Matrix

| Base License | Can Include CC0? | Can Include MIT? | Can Include Apache 2.0? | Can Include CC BY 4.0? |
|--------------|------------------|------------------|-------------------------|------------------------|
| Apache 2.0   | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ N/A (different domains) |
| MIT          | ✅ Yes | ✅ Yes | ⚠️ With care* | ⚠️ N/A (different domains) |
| CC BY 4.0    | ✅ Yes | ⚠️ N/A (different domains) | ⚠️ N/A (different domains) | ✅ Yes |
| CC0          | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

*Apache 2.0 → MIT is tricky because Apache has explicit patent grant, MIT doesn't. Generally safe for utilities.

---

## Automated License Checking

### GitHub Action for License Validation

```yaml
# .github/workflows/license-check.yml
name: License Check

on: [push, pull_request]

jobs:
  check-licenses:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check SPDX Headers
        run: |
          # Check all TypeScript files have SPDX headers
          find src -name "*.ts" -o -name "*.tsx" | while read file; do
            if ! grep -q "SPDX-License-Identifier" "$file"; then
              echo "Missing SPDX header: $file"
              exit 1
            fi
          done

      - name: Check Package Licenses
        run: npx license-checker --summary
```

### Pre-commit Hook for License Headers

```bash
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for SPDX headers in staged files
git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' | while read file; do
  if ! grep -q "SPDX-License-Identifier" "$file"; then
    echo "Error: $file is missing SPDX license header"
    exit 1
  fi
done
```

---

## Summary

### License Distribution

| License | Use Case | Files | Why? |
|---------|----------|-------|------|
| **Apache 2.0** | Business logic, APIs, security | `src/app/`, `src/lib/`, `prisma/` | Patent grant, trademark protection |
| **MIT** | UI components, utilities | `src/components/`, `src/hooks/` | Maximum adoption, simplest |
| **CC BY 4.0** | Content, documentation | `docs/`, `data/` | SRD compatible, attribution |
| **CC0** | Public domain content | `data/cc0/`, `public/assets/cc0/` | Most permissive |
| **Proprietary** | Branding, custom assets | `public/assets/proprietary/` | Protect IP |

### Key Takeaways

1. ✅ **Yes, CC0 can be used in CC BY 4.0 releases** (most permissive → more restrictive)
2. ✅ **Yes, multiple licenses in one repo is common and well-supported**
3. ✅ **Use Apache 2.0 for business logic**, MIT for utilities
4. ✅ **Use CC BY 4.0 for content**, compatible with D&D SRD
5. ✅ **Track asset licenses in database** (source, author, license, legal notes)
6. ✅ **Use SPDX headers in all files** for clarity
7. ✅ **Separate packages can have different licenses** (via package.json)

---

**Status**: 📋 **SPECIFICATION COMPLETE**
**Ready for Implementation**: ✅ **YES**

**Next Actions**:
1. Update LICENSE file with multi-license structure
2. Add LICENSE-MIT file
3. Add SPDX headers to all code files
4. Update package.json files with license field
5. Create automated license checking (GitHub Actions)

