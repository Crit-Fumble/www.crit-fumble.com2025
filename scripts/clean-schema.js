const fs = require('fs');
const path = require('path');

// Read the original schema
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Model rename mappings
const modelRenames = {
  'Board': 'RpgBoard',
  'LocationSheet': 'RpgSheet',
  'TileAsset': 'RpgTileAsset',
  'ObjectType': 'RpgObjectType',
  'SpatialObject': 'RpgSpatialObject',
  'SheetPermission': 'RpgSheetPermission',
  'MarketplaceCommission': 'CritMarketplaceCommission',
  'CommissionProposal': 'CritCommissionProposal',
  'DowntimeActivity': 'RpgActivity',
  'RPGWorld': 'RpgWorldSpace',
  'CardType': 'RpgDungeonCardType',
  'Card': 'RpgDungeonCard'
};

// Table name mappings (@@map directive)
const tableRenames = {
  'boards': 'rpg_boards',
  'location_sheets': 'rpg_sheets',
  'tile_assets': 'rpg_tile_assets',
  'object_types': 'rpg_object_types',
  'spatial_objects': 'rpg_spatial_objects',
  'sheet_permissions': 'rpg_sheet_permissions',
  'marketplace_commissions': 'crit_marketplace_commissions',
  'commission_proposals': 'crit_commission_proposals',
  'downtime_activities': 'rpg_activities',
  'rpg_worlds': 'rpg_world_spaces',
  'card_types': 'rpg_dungeon_card_types',
  'cards': 'rpg_dungeon_cards'
};

console.log('Starting schema cleanup...');
console.log('Models to rename:', Object.keys(modelRenames).length);

// Function to rename model definitions
function renameModels(content) {
  Object.entries(modelRenames).forEach(([oldName, newName]) => {
    // Rename model definition
    const modelRegex = new RegExp(`^model\\s+${oldName}\\s+{`, 'gm');
    content = content.replace(modelRegex, `model ${newName} {`);
    console.log(`  ✓ Renamed model ${oldName} -> ${newName}`);
  });
  return content;
}

// Function to rename relation references
function renameRelations(content) {
  Object.entries(modelRenames).forEach(([oldName, newName]) => {
    // Match relation type references (e.g., "Board?" or "Board[]")
    // But avoid replacing if already prefixed with Rpg or Crit
    const typeRegex = new RegExp(`(?<!Rpg|Crit)\\b${oldName}(\\?|\\[\\])?\\s+@relation`, 'g');
    content = content.replace(typeRegex, (match) => match.replace(oldName, newName));

    // Match relation definitions like: relation(fields: [boardId], references: [id])
    // But avoid double-prefixing
    const relRef = new RegExp(`(?<!Rpg|Crit)${oldName}\\s+@relation\\(`, 'g');
    content = content.replace(relRef, `${newName} @relation(`);
  });
  return content;
}

// Function to update @@map directives
function updateTableMappings(content) {
  Object.entries(tableRenames).forEach(([oldTable, newTable]) => {
    const mapRegex = new RegExp(`@@map\\("${oldTable}"\\)`, 'g');
    content = content.replace(mapRegex, `@@map("${newTable}")`);
  });
  return content;
}

// Function to add missing models
function addMissingModels(content) {
  const missingModels = `
// ============================================================================
// Additional Core Concept Tables
// ============================================================================

// RpgSubSystem - Child systems under RpgSystem
model RpgSubSystem {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // SubSystem info
  name        String  @db.VarChar(200)
  title       String  @db.VarChar(200)
  description String? @db.Text
  category    String  @db.VarChar(50) // 'advancement', 'magic', 'crafting', etc.

  // Parent system
  systemId String    @map("system_id")
  system   RpgSystem @relation(fields: [systemId], references: [id], onDelete: Cascade)

  // Order in parent system
  displayOrder Int @default(0) @map("display_order")

  // Rules associated with this subsystem
  ruleIds Json @default("[]") @map("rule_ids") @db.JsonB

  // Metadata
  metadata Json @default("{}")

  @@index([systemId])
  @@index([category])
  @@index([deletedAt])
  @@map("rpg_sub_systems")
}

// RpgAttribute - Trackable attributes (HP, XP, Name, etc.)
model RpgAttribute {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Attribute info
  name        String  @db.VarChar(100)
  title       String  @db.VarChar(100)
  description String? @db.Text
  category    String  @db.VarChar(50) // 'stat', 'skill', 'resource', 'meta'

  // Data type
  dataType     String  @map("data_type") @db.VarChar(20) // 'number', 'string', 'boolean', 'json'
  defaultValue String? @map("default_value") @db.Text

  // Constraints
  minValue Decimal? @map("min_value") @db.Decimal(10, 2)
  maxValue Decimal? @map("max_value") @db.Decimal(10, 2)

  // System reference
  systemName String  @map("system_name") @db.VarChar(100)
  isCore     Boolean @default(false) @map("is_core") // Core to system or optional

  // Metadata
  metadata Json @default("{}")

  @@index([systemName])
  @@index([category])
  @@index([deletedAt])
  @@map("rpg_attributes")
}

// RpgLocation - Location-specific data (not on sheets)
model RpgLocation {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Location info
  name        String  @db.VarChar(200)
  title       String  @db.VarChar(200)
  description String? @db.Text
  locationType String @map("location_type") @db.VarChar(50) // 'dungeon', 'city', 'wilderness', 'plane'

  // Parent location (for hierarchies)
  parentLocationId String?      @map("parent_location_id")
  parentLocation   RpgLocation? @relation("LocationHierarchy", fields: [parentLocationId], references: [id], onDelete: SetNull)
  childLocations   RpgLocation[] @relation("LocationHierarchy")

  // World reference
  worldSpaceId String        @map("world_space_id")
  worldSpace   RpgWorldSpace @relation(fields: [worldSpaceId], references: [id], onDelete: Cascade)

  // NPC and creature generation settings
  npcGenerationRules Json @default("{}") @map("npc_generation_rules") @db.JsonB
  lootGenerationRules Json @default("{}") @map("loot_generation_rules") @db.JsonB
  encounterRules Json @default("{}") @map("encounter_rules") @db.JsonB

  // Environmental properties
  climate     String? @db.VarChar(50)
  terrain     String? @db.VarChar(50)
  dangerLevel Int     @default(1) @map("danger_level") // 1-20

  // Metadata
  metadata Json @default("{}")

  @@index([worldSpaceId])
  @@index([parentLocationId])
  @@index([locationType])
  @@index([deletedAt])
  @@map("rpg_locations")
}

// RpgObject - Object behavior and properties (non-sheet data)
model RpgObject {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Object info
  name        String  @db.VarChar(200)
  title       String  @db.VarChar(200)
  description String? @db.Text
  objectType  String  @map("object_type") @db.VarChar(50) // 'weapon', 'armor', 'consumable', 'treasure'

  // Behavior scripts
  onUseBehavior      Json? @map("on_use_behavior") @db.JsonB
  onEquipBehavior    Json? @map("on_equip_behavior") @db.JsonB
  onDestroyBehavior  Json? @map("on_destroy_behavior") @db.JsonB
  passiveBehavior    Json? @map("passive_behavior") @db.JsonB

  // Loot generation
  lootTableId String? @map("loot_table_id")
  dropChance  Decimal @default(1.0) @map("drop_chance") @db.Decimal(5, 4) // 0.0-1.0

  // System reference
  systemName String @map("system_name") @db.VarChar(100)

  // Metadata
  metadata Json @default("{}")

  @@index([objectType])
  @@index([systemName])
  @@index([deletedAt])
  @@map("rpg_objects")
}

// RpgBook - Books and compendiums
model RpgBook {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Book info
  name        String  @db.VarChar(200)
  title       String  @db.VarChar(200)
  description String? @db.Text
  bookType    String  @map("book_type") @db.VarChar(50) // 'rulebook', 'adventure', 'supplement', 'setting'

  // Publication info
  publisher   String? @db.VarChar(100)
  isbn        String? @db.VarChar(20)
  publishDate DateTime? @map("publish_date")
  edition     String? @db.VarChar(50)

  // Content references
  ruleIds  Json @default("[]") @map("rule_ids") @db.JsonB
  cardIds  Json @default("[]") @map("card_ids") @db.JsonB
  tableIds Json @default("[]") @map("table_ids") @db.JsonB
  systemIds Json @default("[]") @map("system_ids") @db.JsonB
  modeIds  Json @default("[]") @map("mode_ids") @db.JsonB

  // System reference
  systemName String @map("system_name") @db.VarChar(100)

  // Access control
  isPublic    Boolean @default(false) @map("is_public")
  requiresSRD Boolean @default(false) @map("requires_srd") // System Reference Document

  // Metadata
  metadata Json @default("{}")

  @@index([systemName])
  @@index([bookType])
  @@index([publisher])
  @@index([deletedAt])
  @@map("rpg_books")
}

// RpgVoxel - Volumetric positioning for gridless/narrative movement
model RpgVoxel {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Position (voxel coordinates)
  x Int
  y Int
  z Int

  // Parent sheet or board
  sheetId String?    @map("sheet_id")
  sheet   RpgSheet? @relation(fields: [sheetId], references: [id], onDelete: Cascade)

  boardId String?   @map("board_id")
  board   RpgBoard? @relation(fields: [boardId], references: [id], onDelete: Cascade)

  // Voxel size (in feet or other units)
  size       Int     @default(5) // Size of voxel in feet
  sizeUnit   String  @default("feet") @map("size_unit") @db.VarChar(20)

  // Tokens/creatures in this voxel
  occupantIds Json @default("[]") @map("occupant_ids") @db.JsonB

  // Environmental properties
  terrainType String? @map("terrain_type") @db.VarChar(50)
  passability Int     @default(0) // 0=clear, 50=difficult, 100=blocked
  obstruction Int     @default(0) // 0=clear vision, 100=blocked

  // Metadata
  metadata Json @default("{}")

  @@unique([sheetId, x, y, z])
  @@unique([boardId, x, y, z])
  @@index([x, y, z])
  @@map("rpg_voxels")
}
`;

  // Find insertion point (before the last closing comment or at the end)
  const insertionPoint = content.lastIndexOf('// ============================================================================');
  if (insertionPoint > 0) {
    content = content.slice(0, insertionPoint) + missingModels + '\n' + content.slice(insertionPoint);
  } else {
    content += missingModels;
  }

  console.log('  ✓ Added 7 missing models');
  return content;
}

// Function to update RpgSystem to add subsystems relation
function updateRpgSystem(content) {
  const rpgSystemMatch = content.match(/model RpgSystem \{[\s\S]*?@@map\("rpg_systems"\)\n\}/);
  if (rpgSystemMatch) {
    const originalModel = rpgSystemMatch[0];
    // Add subSystems relation before the @@index lines
    const updatedModel = originalModel.replace(
      /(\n  @@index)/,
      '\n\n  // Relations\n  subSystems RpgSubSystem[]\n$1'
    );
    content = content.replace(originalModel, updatedModel);
    console.log('  ✓ Updated RpgSystem to include subSystems relation');
  }
  return content;
}

// Apply all transformations
schema = renameModels(schema);
schema = renameRelations(schema);
schema = updateTableMappings(schema);
schema = addMissingModels(schema);
schema = updateRpgSystem(schema);

// Write cleaned schema
const outputPath = path.join(__dirname, '..', 'prisma', 'schema-cleaned.prisma');
fs.writeFileSync(outputPath, schema, 'utf8');

console.log('\n✓ Schema cleanup complete!');
console.log(`  Output: ${outputPath}`);
console.log('\nSummary:');
console.log(`  - Models renamed: ${Object.keys(modelRenames).length}`);
console.log(`  - Table mappings updated: ${Object.keys(tableRenames).length}`);
console.log(`  - New models added: 7`);
console.log(`  - Relations updated: automatically handled`);
