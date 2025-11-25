# Release Planning & Todo Organization

This directory contains organized todos for the Crit-Fumble VTT platform, broken down by release timeline.

---

## 📂 File Structure

### [3.24.26-release.md](./3.24.26-release.md)
**Target Date:** March 24, 2026 (3 months)

**Focus:** Core D&D 5e VTT functionality

**Key Features:**
- Month 1: Character creation, campaign management, session management, **admin universes organization**
- Month 2: Pixi.js VTT, token system, map backgrounds
- Month 3: Dice roller, combat tracker, basic attacks

**Success Criteria:** Players can create characters, GMs can run sessions with maps/tokens/dice/combat

---

### [8.15.26-release.md](./8.15.26-release.md)
**Target Date:** August 15, 2026 (Q2-Q3 2026)

**Focus:** Enhanced gameplay and community features

**Key Features:**
- Phase 2 (Q2): Spells, character progression, inventory, fog of war, map tools
- Phase 3 (Q3): Discord integration, social features, in-game chat
- Multi-system support (Pathfinder, Call of Cthulhu, etc.)

---

### [future-release.md](./future-release.md)
**Target Date:** 2027+

**Focus:** Advanced features, monetization, platform integrations

**Key Features:**
- Phase 4 (Q4 2026): Monetization (Stripe, Crit-Coins, marketplace)
- Phase 5 (2027): World Anvil integration and data syncing
- Phase 6 (2027+): Cosmic tiers (L21-50), hex grids, timelines, advanced mechanics
- Phase 7 (2027+): FoundryVTT integration
- Phase 8+: Discord Activities, on-demand infrastructure, AI features

---

## 🎯 Current Priority: March 2026 Release

The immediate focus is on the **3.24.26-release.md** checklist. All development should align with these 3-month goals.

### Critical Path:
1. ✅ Admin world/universe organization (needed before March 2026)
2. Character creation UI
3. Campaign & session management
4. VTT rendering (Pixi.js)
5. Dice roller & combat tracker

---

## 📝 How to Use These Files

1. **Active Development:** Reference `3.24.26-release.md` for current sprint planning
2. **Q2-Q3 Planning:** Use `8.15.26-release.md` to understand what comes next
3. **Long-term Vision:** Refer to `future-release.md` for features being deferred

**Note:** Do not add new features to the March 2026 list without removing something else. Scope discipline is critical for hitting the test release date.

---

## 🔄 Universe Organization (March 2026 Scope)

**Why universes are needed before March 2026:**

Admins need to organize worlds into universes on a multiverse scale **before** players start creating campaigns and characters. This provides:

- Proper data hierarchy (Multiverse → Universe → World → Campaign)
- Admin control over world organization
- Foundation for future cosmic-tier features (without implementing cosmic tiers yet)

**What's included:**
- `/universes` page for admins (admin-only)
- Create/edit universe functionality
- Assign worlds to universes
- List universes with stats (total, active, in multiverses)

**What's NOT included:**
- Cosmic-tier gameplay (levels 21-50)
- Multi-scale hex grids
- Timeline/multiverse branching mechanics
- Player-facing universe features

The universes page is **admin tooling only** for organizing the content hierarchy.

---

**Last Updated:** November 24, 2024
