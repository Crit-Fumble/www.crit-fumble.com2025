#!/usr/bin/env python3
"""
Extract website-only schema by removing Rpg and Campaign models
"""

import re

# Read full original schema
with open('prisma/schema-full-original.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Split into lines for processing
lines = content.split('\n')

# Models to EXCLUDE (RPG/game data models)
exclude_models = {
    'RpgPlayer', 'RpgSession', 'RpgHistory', 'RpgTimeline', 'RpgAltHistory',
    'RpgAsset', 'RpgTile', 'RpgExpansion', 'RpgExpansionAccess', 'RpgSheet',
    'RpgBoard', 'RpgThing', 'RpgCreature', 'RpgWorld', 'RpgWorldWiki',
    'RpgWorldWikiRevision', 'RpgCampaign', 'CampaignMember', 'RpgType',
    'RpgTable', 'RpgCard', 'RpgDeck', 'RpgRule', 'RpgEvent', 'RpgGoal',
    'RpgMode', 'RpgSystem', 'RpgActivity', 'RpgSubSystem', 'RpgAttribute',
    'RpgLocation', 'RpgBook', 'RpgVoxel', 'FoundryLicense', 'FoundryInstance',
    'FoundryWorldSnapshot'
}

output_lines = []
skip_model = False
current_model = None
brace_count = 0

for i, line in enumerate(lines):
    # Check if this is a model declaration
    model_match = re.match(r'^model\s+(\w+)\s*{', line)

    if model_match:
        model_name = model_match.group(1)
        current_model = model_name
        brace_count = 1

        # Skip if this is an excluded model
        if model_name in exclude_models:
            skip_model = True
            continue
        else:
            skip_model = False
            output_lines.append(line)
            continue

    # If we're skipping, track braces to know when model ends
    if skip_model:
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count <= 0:
            skip_model = False
            current_model = None
        continue

    # Not skipping, so include this line
    output_lines.append(line)

# Remove RPG-related relations from CritUser
final_lines = []
in_crit_user = False
for line in output_lines:
    if line.startswith('model CritUser'):
        in_crit_user = True
        final_lines.append(line)
        continue

    if in_crit_user and line.strip() == '}':
        # End of CritUser model
        in_crit_user = False
        # Add note about RPG relations before closing brace
        final_lines.append('')
        final_lines.append('  // NOTE: RPG-related relations (rpgPlayer, ownedWorlds, worldWiki) are now in')
        final_lines.append('  // the separate Core Concepts database and accessed via the unified facade')
        final_lines.append(line)
        continue

    if in_crit_user:
        # Skip RPG-related relation lines in CritUser
        if any(x in line for x in ['ownedWorlds', 'rpgPlayer', 'RpgWorld', 'RpgPlayer', 'authoredWorldWikiPages', 'lastEditedWorldWikiPages', 'worldWikiRevisions', 'RpgWorldWiki']):
            continue

    final_lines.append(line)

# Write website schema
with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write('\n'.join(final_lines))

print("Website schema extracted successfully")
print(f"Total lines: {len(final_lines)}")
