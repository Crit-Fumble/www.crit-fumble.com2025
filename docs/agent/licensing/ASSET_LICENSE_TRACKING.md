# Asset License Tracking System

**Date**: November 24, 2025
**Status**: 📋 **SPECIFICATION**

---

## Overview

To maintain a clear record of asset ownership and licensing, we need to track the source, author, license, and legal information for all assets uploaded to Crit-Fumble.

This is critical for:
1. **Legal Compliance**: Ensuring we have rights to use/distribute assets
2. **Attribution**: Properly crediting creators
3. **Marketplace**: Verifying ownership before allowing sales
4. **Content Moderation**: Identifying and removing infringing content

---

## User Requirements

**User Quote**: "When uploading assets, we will need to make sure we can always include a source, author, license, and legal (for other legal statements and copy). This will give us a clear record of where our content is coming from in cases when it is not generated internally via crit-coins, ai tools, or creator economy"

---

## Schema Changes

### Fields to Add to `CritAsset` and `RpgAsset`

```prisma
// License and Attribution Tracking
source        String?  @db.Text           // URL or description of where asset came from
sourceAuthor  String?  @db.VarChar(255)   @map("source_author") // Original creator name
license       String?  @db.VarChar(100)   // License identifier (SPDX format preferred)
legalNotes    String?  @db.Text           @map("legal_notes")    // Additional legal info

// Content origin classification
contentOrigin String   @default("user_upload") @map("content_origin") @db.VarChar(50)
// Values: 'user_upload', 'ai_generated', 'crit_coins', 'creator_economy', 'srd', 'marketplace'

// AI generation tracking (if applicable)
aiModel       String?  @db.VarChar(100)   @map("ai_model")  // e.g., "dall-e-3", "midjourney"
aiPrompt      String?  @db.Text           @map("ai_prompt") // Generation prompt (for attribution)

// Verification status
verified      Boolean  @default(false)    // Owner/Admin has verified license info
verifiedBy    String?  @map("verified_by") // CritUser.id who verified
verifiedAt    DateTime? @map("verified_at")
```

### Enum for Common Licenses (Optional)

```prisma
enum AssetLicense {
  CC0                    // Creative Commons Zero (Public Domain)
  CC_BY_4_0              // Creative Commons Attribution 4.0
  CC_BY_SA_4_0           // Creative Commons Attribution-ShareAlike 4.0
  CC_BY_NC_4_0           // Creative Commons Attribution-NonCommercial 4.0
  CC_BY_NC_SA_4_0        // Creative Commons Attribution-NonCommercial-ShareAlike 4.0
  ALL_RIGHTS_RESERVED    // Proprietary/Copyright
  PROPRIETARY_CRIT_FUMBLE // Crit-Fumble proprietary
  OGL_1_0A               // Open Gaming License 1.0a
  CUSTOM                 // Custom license (see legalNotes)
  UNKNOWN                // License unknown (needs verification)
}
```

---

## SPDX License Identifiers

For the `license` field, we recommend using **SPDX identifiers** (standardized license names):

### Common SPDX Identifiers

| License | SPDX ID | Use Case |
|---------|---------|----------|
| Creative Commons Zero | `CC0-1.0` | Public domain dedication |
| CC Attribution 4.0 | `CC-BY-4.0` | Attribution required |
| CC Attribution-ShareAlike 4.0 | `CC-BY-SA-4.0` | Attribution + share-alike |
| CC Attribution-NonCommercial 4.0 | `CC-BY-NC-4.0` | Attribution + non-commercial |
| All Rights Reserved | `NONE` | Proprietary content |
| Custom License | `LicenseRef-Custom` | See legalNotes |
| Unknown | `NOASSERTION` | License not determined |

**Full List**: https://spdx.org/licenses/

---

## Updated Schema (CritAsset)

```prisma
model CritAsset {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Asset info
  name        String  @db.VarChar(255)
  description String? @db.Text
  assetType   String  @map("asset_type") @db.VarChar(50)

  // File information
  url      String @db.Text
  mimeType String @map("mime_type") @db.VarChar(100)
  fileSize BigInt @map("file_size")
  filename String @db.VarChar(255)

  // Dimensions (for images/video)
  width  Int?
  height Int?

  // Duration (for audio/video in seconds)
  duration Int?

  // Ownership & Rights
  ownerId String   @map("owner_id")
  owner   CritUser @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  // ========================================
  // LICENSE & ATTRIBUTION TRACKING (NEW)
  // ========================================

  // Source information
  source        String?  @db.Text            // URL or description of origin
  sourceAuthor  String?  @db.VarChar(255)    @map("source_author") // Creator name

  // License tracking (SPDX format recommended)
  license       String?  @db.VarChar(100)    // e.g., "CC-BY-4.0", "CC0-1.0", "NONE"
  legalNotes    String?  @db.Text            @map("legal_notes") // Additional legal info

  // Content origin classification
  contentOrigin String   @default("user_upload") @map("content_origin") @db.VarChar(50)
  // Values: 'user_upload', 'ai_generated', 'crit_coins', 'creator_economy', 'srd', 'marketplace'

  // AI generation tracking (if applicable)
  aiModel       String?  @db.VarChar(100)    @map("ai_model")  // e.g., "dall-e-3"
  aiPrompt      String?  @db.Text            @map("ai_prompt") // Generation prompt

  // Verification (owner/admin verification)
  verified      Boolean   @default(false)    // License info verified by owner/admin
  verifiedBy    String?   @map("verified_by") // CritUser.id who verified
  verifiedAt    DateTime? @map("verified_at") // When verified

  // ========================================
  // END LICENSE TRACKING
  // ========================================

  // Marketplace settings
  isPublic      Boolean  @default(false) @map("is_public")
  isMarketplace Boolean  @default(false) @map("is_marketplace")
  price         Decimal? @db.Decimal(10, 2)

  // Categorization & Discovery
  category String?  @db.VarChar(50)
  tags     String[] @default([])

  // Usage & Analytics
  downloadCount Int @default(0) @map("download_count")
  viewCount     Int @default(0) @map("view_count")

  // File-specific metadata (JSON for flexibility)
  metadata Json @default("{}") @db.JsonB

  @@index([ownerId])
  @@index([assetType])
  @@index([category])
  @@index([isPublic])
  @@index([isMarketplace])
  @@index([contentOrigin])  // NEW INDEX
  @@index([license])        // NEW INDEX
  @@index([verified])       // NEW INDEX
  @@map("crit_assets")
}
```

---

## Updated Schema (RpgAsset)

```prisma
model RpgAsset {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Asset info
  name        String  @db.VarChar(255)
  description String? @db.Text
  assetType   String  @map("asset_type") @db.VarChar(50)

  // File information
  url      String @db.Text
  mimeType String @map("mime_type") @db.VarChar(100)
  fileSize BigInt @map("file_size")
  filename String @db.VarChar(255)

  // Dimensions (for images/video)
  width  Int?
  height Int?

  // Duration (for audio/video in seconds)
  duration Int?

  // Ownership (tracks uploader and origin world)
  uploadedBy String?    @map("uploaded_by")
  uploader   RpgPlayer? @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  worldId String?   @map("world_id")
  world   RpgWorld? @relation(fields: [worldId], references: [id], onDelete: SetNull)

  // ========================================
  // LICENSE & ATTRIBUTION TRACKING (NEW)
  // ========================================

  // Source information
  source        String?  @db.Text            // URL or description of origin
  sourceAuthor  String?  @db.VarChar(255)    @map("source_author") // Creator name

  // License tracking (SPDX format recommended)
  license       String?  @db.VarChar(100)    // e.g., "CC-BY-4.0", "CC0-1.0", "NONE"
  legalNotes    String?  @db.Text            @map("legal_notes") // Additional legal info

  // Content origin classification
  contentOrigin String   @default("user_upload") @map("content_origin") @db.VarChar(50)
  // Values: 'user_upload', 'ai_generated', 'crit_coins', 'creator_economy', 'srd', 'marketplace'

  // AI generation tracking (if applicable)
  aiModel       String?  @db.VarChar(100)    @map("ai_model")  // e.g., "dall-e-3"
  aiPrompt      String?  @db.Text            @map("ai_prompt") // Generation prompt

  // Verification (owner/admin verification)
  verified      Boolean   @default(false)    // License info verified by owner/admin
  verifiedBy    String?   @map("verified_by") // CritUser.id who verified
  verifiedAt    DateTime? @map("verified_at") // When verified

  // ========================================
  // END LICENSE TRACKING
  // ========================================

  // Visibility (within world/campaign)
  isPublic Boolean @default(false) @map("is_public")

  // Categorization
  category String?  @db.VarChar(50)
  tags     String[] @default([])

  // Usage tracking
  usageCount Int @default(0) @map("usage_count")

  // File-specific metadata (JSON for flexibility)
  metadata Json @default("{}") @db.JsonB

  // Shortcode for QR code generation and asset lookup
  shortcode String? @unique @db.VarChar(10)

  @@index([uploadedBy])
  @@index([worldId])
  @@index([assetType])
  @@index([category])
  @@index([isPublic])
  @@index([shortcode])
  @@index([contentOrigin])  // NEW INDEX
  @@index([license])        // NEW INDEX
  @@index([verified])       // NEW INDEX
  @@map("rpg_assets")
}
```

---

## Content Origin Values

### Standard Values

| Value | Description | Use Case |
|-------|-------------|----------|
| `user_upload` | User manually uploaded the file | Default for all uploads |
| `ai_generated` | Generated by AI (DALL-E, Midjourney, etc.) | Track AI-generated content |
| `crit_coins` | Purchased with Crit-Coins | Marketplace purchases |
| `creator_economy` | From creator economy/commissions | Custom commissions |
| `srd` | D&D 5e SRD content | Official SRD assets |
| `marketplace` | From Crit-Fumble marketplace | Marketplace downloads |
| `imported` | Imported from external source (World Anvil, Foundry) | Third-party integrations |
| `system_generated` | Programmatically generated by system | Procedural generation |

---

## Upload Flow with License Tracking

### UI Form for Asset Upload

```typescript
interface AssetUploadForm {
  // File upload
  file: File;

  // Basic info
  name: string;
  description?: string;
  assetType: string; // 'image', 'audio', 'video', etc.

  // License & Attribution
  source?: string;        // "https://example.com/asset" or "Created by me"
  sourceAuthor?: string;  // "John Doe" or "AI: DALL-E 3"
  license: string;        // SPDX ID: "CC-BY-4.0", "CC0-1.0", "NONE"
  legalNotes?: string;    // Additional legal info

  // Content origin
  contentOrigin: 'user_upload' | 'ai_generated' | 'crit_coins' | 'creator_economy' | 'srd' | 'marketplace';

  // AI tracking (if contentOrigin === 'ai_generated')
  aiModel?: string;       // "dall-e-3", "midjourney-v6"
  aiPrompt?: string;      // "A fantasy castle in the mountains"

  // Categorization
  category?: string;
  tags?: string[];

  // Marketplace (if applicable)
  isMarketplace?: boolean;
  price?: number;
}
```

### Upload Validation

```typescript
// src/lib/asset-validation.ts

export function validateAssetLicense(asset: AssetUploadForm): ValidationResult {
  const errors: string[] = [];

  // Require license for marketplace assets
  if (asset.isMarketplace && !asset.license) {
    errors.push('License is required for marketplace assets');
  }

  // Require source for non-original content
  if (asset.contentOrigin !== 'user_upload' &&
      asset.contentOrigin !== 'ai_generated' &&
      !asset.source) {
    errors.push('Source is required for imported content');
  }

  // Require AI fields if AI-generated
  if (asset.contentOrigin === 'ai_generated') {
    if (!asset.aiModel) {
      errors.push('AI model is required for AI-generated content');
    }
    if (!asset.aiPrompt) {
      errors.push('AI prompt is required for AI-generated content');
    }
  }

  // Validate SPDX license format
  if (asset.license && !isValidSPDX(asset.license)) {
    errors.push('Invalid license format. Use SPDX identifiers (e.g., "CC-BY-4.0")');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Owner/Admin Verification Workflow

### Marketplace Assets (Requires Verification)

Before an asset can be published to the marketplace, an owner/admin must verify:
1. **License is accurate** - Asset has proper rights
2. **Attribution is correct** - sourceAuthor is properly credited
3. **No copyright infringement** - Asset is original or properly licensed

```typescript
// src/app/api/admin/assets/verify/route.ts

export async function POST(request: NextRequest) {
  const session = await auth();
  const user = await prisma.critUser.findUnique({
    where: { id: session.user.id }
  });

  // AUTHORIZATION: Owner-only
  if (!isOwner(user)) {
    return NextResponse.json(
      { error: 'Forbidden - Owner access required' },
      { status: 403 }
    );
  }

  const { assetId, approved, notes } = await request.json();

  // Update verification
  await prisma.critAsset.update({
    where: { id: assetId },
    data: {
      verified: approved,
      verifiedBy: user.id,
      verifiedAt: new Date(),
      legalNotes: notes || undefined
    }
  });

  return NextResponse.json({ success: true });
}
```

---

## Querying Assets by License

### Find All CC0 Assets (Public Domain)

```typescript
const cc0Assets = await prisma.critAsset.findMany({
  where: {
    license: 'CC0-1.0',
    verified: true,
    isPublic: true
  }
});
```

### Find All Unverified Marketplace Assets

```typescript
const unverifiedMarketplace = await prisma.critAsset.findMany({
  where: {
    isMarketplace: true,
    verified: false
  },
  include: {
    owner: {
      select: { username: true, email: true }
    }
  }
});
```

### Find All AI-Generated Assets

```typescript
const aiAssets = await prisma.critAsset.findMany({
  where: {
    contentOrigin: 'ai_generated'
  },
  select: {
    name: true,
    aiModel: true,
    aiPrompt: true,
    license: true
  }
});
```

---

## License Compatibility Checking

### Can This Asset Be Used in Marketplace?

```typescript
export function canSellAsset(asset: CritAsset): boolean {
  const allowedLicenses = [
    'CC0-1.0',           // Public domain - can resell
    'CC-BY-4.0',         // Attribution only - can resell with credit
    'NONE',              // All rights reserved - owner can sell
  ];

  const prohibitedLicenses = [
    'CC-BY-NC-4.0',      // Non-commercial - CANNOT sell
    'CC-BY-NC-SA-4.0',   // Non-commercial - CANNOT sell
    'GPL-3.0',           // Software license - not for assets
  ];

  if (prohibitedLicenses.includes(asset.license)) {
    return false;
  }

  // Asset must be verified by owner/admin
  if (!asset.verified) {
    return false;
  }

  return true;
}
```

---

## Migration Plan

### Step 1: Create Migration

```bash
npx prisma migrate dev --name add_asset_license_tracking
```

### Step 2: Backfill Existing Assets

```typescript
// scripts/backfill-asset-licenses.ts

async function backfillAssetLicenses() {
  // Mark all existing assets as user_upload
  await prisma.critAsset.updateMany({
    where: { contentOrigin: null },
    data: {
      contentOrigin: 'user_upload',
      license: 'NOASSERTION', // Unknown license
      verified: false
    }
  });

  // Same for RpgAsset
  await prisma.rpgAsset.updateMany({
    where: { contentOrigin: null },
    data: {
      contentOrigin: 'user_upload',
      license: 'NOASSERTION',
      verified: false
    }
  });

  console.log('Backfilled asset licenses');
}
```

### Step 3: Update Upload Forms

Update all asset upload forms to include license tracking fields.

### Step 4: Create Admin Verification UI

Create admin dashboard for verifying asset licenses before marketplace publication.

---

## Benefits

### Legal Protection

- ✅ Clear record of asset provenance
- ✅ Proper attribution to creators
- ✅ License compliance verification
- ✅ DMCA takedown protection (verified licenses)

### Content Moderation

- ✅ Identify AI-generated content
- ✅ Track source of imports
- ✅ Verify marketplace asset rights
- ✅ Audit trail for copyright disputes

### Creator Economy

- ✅ Proper credit to artists
- ✅ License-based marketplace filtering
- ✅ AI vs human content transparency
- ✅ Support for various licensing models

---

## Example Data

### User Upload (Original Art)

```json
{
  "name": "Fantasy Castle Map",
  "assetType": "image",
  "source": "Created by me",
  "sourceAuthor": "John Doe",
  "license": "CC-BY-4.0",
  "contentOrigin": "user_upload",
  "verified": true,
  "verifiedBy": "owner-uuid",
  "verifiedAt": "2025-11-24T12:00:00Z"
}
```

### AI-Generated Image

```json
{
  "name": "Mountain Landscape",
  "assetType": "image",
  "source": "AI Generated via DALL-E 3",
  "sourceAuthor": "AI: DALL-E 3",
  "license": "CC0-1.0",
  "legalNotes": "Generated using OpenAI DALL-E 3. OpenAI grants commercial rights.",
  "contentOrigin": "ai_generated",
  "aiModel": "dall-e-3",
  "aiPrompt": "A fantasy mountain landscape with snow-capped peaks",
  "verified": true
}
```

### Imported from World Anvil

```json
{
  "name": "Character Portrait",
  "assetType": "image",
  "source": "https://www.worldanvil.com/w/myworld/a/character123",
  "sourceAuthor": "Jane Smith (World Anvil)",
  "license": "CC-BY-NC-4.0",
  "legalNotes": "Imported from World Anvil. Non-commercial use only.",
  "contentOrigin": "imported",
  "verified": false
}
```

### D&D 5e SRD Asset

```json
{
  "name": "Goblin Token",
  "assetType": "image",
  "source": "D&D 5e SRD",
  "sourceAuthor": "Wizards of the Coast",
  "license": "CC-BY-4.0",
  "legalNotes": "From D&D 5e SRD. Attribution to WotC required.",
  "contentOrigin": "srd",
  "verified": true
}
```

---

## Next Steps

1. **Review Schema Changes** - Confirm fields meet requirements
2. **Create Migration** - Add fields to both asset tables
3. **Update Upload Forms** - Add license tracking UI
4. **Create Verification UI** - Owner/admin asset review dashboard
5. **Backfill Existing Data** - Mark existing assets as "NOASSERTION"
6. **Update API Routes** - Include license validation
7. **Add License Badges** - Display license info in UI

---

**Status**: 📋 **SPECIFICATION COMPLETE**
**Ready for Implementation**: ✅ **YES**

**Next Action**: Await user approval to create Prisma migration.

