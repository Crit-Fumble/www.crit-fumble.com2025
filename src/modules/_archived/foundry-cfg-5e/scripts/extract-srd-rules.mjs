/**
 * Extract Rules from SRD 5.2 Glossary
 * Parses the official SRD Rules Glossary markdown to extract atomic rules
 *
 * Sources:
 * - Markdown: C:\Users\hobda\Projects\Crit-Fumble\Notes\dndsrd5.2_markdown\src\08_RulesGlossary.md
 * - JSON reference: C:\Users\hobda\Projects\Crit-Fumble\Notes\.data\5e\5etools-srd521\data\variantrules.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GLOSSARY_PATH = 'C:/Users/hobda/Projects/Crit-Fumble/Notes/dndsrd5.2_markdown/src/08_RulesGlossary.md';
const VARIANTRULES_JSON_PATH = 'C:/Users/hobda/Projects/Crit-Fumble/Notes/.data/5e/5etools-srd521/data/variantrules.json';
const OUTPUT_PATH = path.join(__dirname, '../data/rules/srd-glossary.mjs');

/**
 * Load 5etools variant rules JSON for reference
 */
function load5eToolsRules() {
  try {
    const content = fs.readFileSync(VARIANTRULES_JSON_PATH, 'utf-8');
    const data = JSON.parse(content);
    return data.variantrule || [];
  } catch (error) {
    console.warn('Could not load 5etools variant rules:', error.message);
    return [];
  }
}

/**
 * Parse SRD glossary markdown and extract rules
 */
export async function extractSRDRules() {
  console.log('Extracting rules from SRD 5.2 Glossary...');

  // Load 5etools rules for cross-reference
  const toolsRules = load5eToolsRules();
  const toolsRulesMap = new Map(
    toolsRules.map(r => [r.name.toLowerCase(), r])
  );
  console.log(`Loaded ${toolsRules.length} rules from 5etools for reference`);

  const content = fs.readFileSync(GLOSSARY_PATH, 'utf-8');
  const rules = [];

  // Split by #### headers (rule entries)
  const entries = content.split(/^#### /m).slice(1); // Skip intro

  for (const entry of entries) {
    const lines = entry.trim().split('\n');
    const firstLine = lines[0];

    // Parse name and tags
    const tagMatch = firstLine.match(/^(.+?)\s*\[(.+?)\]$/);
    const name = tagMatch ? tagMatch[1].trim() : firstLine.trim();
    const tags = tagMatch ? [tagMatch[2].toLowerCase()] : [];

    // Get description (everything after first line until next header or blank line)
    const description = lines.slice(1)
      .join('\n')
      .split(/\n\n/)[0]
      .replace(/\*See also\*/g, '')
      .trim();

    // Extract category from tag
    const category = tags.length > 0 ? tags[0] : categorizeRule(name);

    // Create rule ID (lowercase, hyphenated)
    const id = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    // Check if this rule exists in 5etools for additional metadata
    const toolsRule = toolsRulesMap.get(name.toLowerCase());
    const srd52 = toolsRule?.srd52 === true;
    const page = toolsRule?.page;

    rules.push({
      id,
      name,
      type: 'rule',
      category,
      description,
      tags: [...tags, ...inferTags(name, description)],
      metadata: {
        source: 'SRD 5.2 Rules Glossary',
        type: 'rule',
        srd52,
        ...(page && { page })
      }
    });
  }

  console.log(`Extracted ${rules.length} rules from SRD glossary`);
  return rules;
}

/**
 * Categorize rule based on name/content
 */
function categorizeRule(name) {
  const lowerName = name.toLowerCase();

  // Actions
  if (lowerName.includes('action') || ['attack', 'dash', 'dodge', 'help', 'hide', 'ready', 'search'].includes(lowerName)) {
    return 'action';
  }

  // Conditions
  if (['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated',
       'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained',
       'stunned', 'unconscious', 'exhaustion'].some(c => lowerName.includes(c))) {
    return 'condition';
  }

  // Combat
  if (['attack', 'damage', 'armor', 'initiative', 'critical', 'opportunity'].some(c => lowerName.includes(c))) {
    return 'combat';
  }

  // Movement
  if (['speed', 'climb', 'swim', 'fly', 'burrow', 'jump', 'fall'].some(m => lowerName.includes(m))) {
    return 'movement';
  }

  // Ability/Skill checks
  if (['ability', 'skill', 'check', 'proficiency'].some(a => lowerName.includes(a))) {
    return 'd20-test';
  }

  // Areas
  if (['cone', 'cube', 'cylinder', 'line', 'sphere', 'emanation'].some(a => lowerName.includes(a))) {
    return 'area-of-effect';
  }

  // Vision/Senses
  if (['vision', 'sight', 'light', 'darkness', 'invisible'].some(v => lowerName.includes(v))) {
    return 'vision';
  }

  // Magic
  if (['spell', 'magic', 'cantrip', 'concentration', 'ritual'].some(m => lowerName.includes(m))) {
    return 'magic';
  }

  // Hazards
  if (['hazard', 'burning', 'suffocating', 'poisoned'].some(h => lowerName.includes(h))) {
    return 'hazard';
  }

  return 'general';
}

/**
 * Infer additional tags from name and description
 */
function inferTags(name, description) {
  const tags = [];
  const lowerName = name.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // D20 tests
  if (lowerDesc.includes('d20') || lowerDesc.includes('ability check') || lowerDesc.includes('saving throw')) {
    tags.push('d20');
  }

  // Advantage/Disadvantage
  if (lowerDesc.includes('advantage') || lowerDesc.includes('disadvantage')) {
    tags.push('advantage');
  }

  // Movement
  if (lowerDesc.includes('move') || lowerDesc.includes('speed')) {
    tags.push('movement');
  }

  // Combat
  if (lowerDesc.includes('attack') || lowerDesc.includes('damage') || lowerDesc.includes('weapon')) {
    tags.push('combat');
  }

  // Spells
  if (lowerDesc.includes('spell') || lowerDesc.includes('magic')) {
    tags.push('magic');
  }

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Write rules to output file
 */
export async function writeRulesToFile(rules) {
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const content = `/**
 * SRD 5.2 Rules Glossary
 * Extracted from official D&D 5e System Reference Document
 *
 * These are ATOMIC RULES from the glossary - not spells, items, or creatures
 * Total: ${rules.length} rules
 */

export const srdRules = ${JSON.stringify(rules, null, 2)};

export default srdRules;
`;

  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  console.log(`Wrote ${rules.length} rules to ${OUTPUT_PATH}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const rules = await extractSRDRules();
  await writeRulesToFile(rules);
  console.log('Done!');
}
