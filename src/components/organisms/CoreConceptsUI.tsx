'use client'

import { useState } from 'react'

interface CoreConceptsUIProps {
  worlds: Array<{
    id: string
    name: string
    description: string | null
  }>
}

type ScaleLevel =
  // Micro Scales
  | 'Interaction'
  | 'Arena'
  // Terrestrial Scales
  | 'Building'
  | 'Settlement'
  | 'Village'
  | 'Town'
  | 'City'
  // Travel/Minimap Scales
  | 'County'
  | 'Province'
  | 'Kingdom'
  | 'Continent'
  // Planetary Scales
  | 'Realm'
  | 'Planet'
  | 'Orbital Space'
  | 'Star System'
  // Astronomical Scales
  | 'Inner System'
  | 'Planetary System'
  | 'Outer System'
  | 'Extended System'
  // Inter-Stellar Scales
  | 'Local Binary'
  | 'Stellar Neighborhood'
  | 'Stellar Region'
  | 'Sector'
  // Galactic Scales
  | 'Regional Sector'
  | 'Galactic Arm Segment'
  | 'Galactic Arm'
  | 'Galaxy'
  // Universal Scales
  | 'Local Group'
  | 'Galactic Cluster'
  | 'Supercluster'
  | 'Universe'

export function CoreConceptsUI({ worlds }: CoreConceptsUIProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'locations'>('overview')

  const scaleLevels: Array<{ value: ScaleLevel; description: string; icon: string; category: string; ratio: string }> = [
    // Micro Scales
    { value: 'Interaction', description: 'Gridless, 1:1 voxel - smallest possible scale (0.1" pixels)', icon: '🔍', category: 'Micro', ratio: '1:1'},
    { value: 'Arena', description: 'Combat scale for 5e - standard TTRPG tabletop (5ft squares)', icon: '⚔️', category: 'Micro', ratio: '1:60 (5ft)'},
    // Terrestrial Scales
    { value: 'Building', description: 'Dungeon, building, clearing, small area (10ft grid)', icon: '🏛️', category: 'Terrestrial', ratio: '1:120 (10ft)' },
    { value: 'Settlement', description: 'Settlement, outpost, grove, camp (30ft hex)', icon: '🏚️', category: 'Terrestrial', ratio: '1:360 (30ft)' },
    { value: 'Village', description: 'Village, neighborhood, glade, ward (50ft hex)', icon: '🏠', category: 'Terrestrial', ratio: '1:600 (50ft)' },
    { value: 'Town', description: 'Town, stronghold, forest, estate (100ft hex)', icon: '🏘️', category: 'Terrestrial', ratio: '1:1200 (100ft)'},
    { value: 'City', description: 'Compound, campus, wilderness tract (300ft hex)', icon: '🌆', category: 'Terrestrial', ratio: '1:3600 (300ft)' },
    // Travel/Minimap Scales
    { value: 'County', description: 'County, wilderness, small lake (0.1 mile hex)', icon: '🌲', category: 'Travel', ratio: '1:6336 (0.1mi)'},
    { value: 'Province', description: 'Province, small sea, large lake (1 mile hex)', icon: '🗾', category: 'Travel', ratio: '1:63360 (1mi)' },
    { value: 'Kingdom', description: 'Kingdom, gulf, large sea (6 mile hex)', icon: '🏰', category: 'Travel', ratio: '1:380160 (6mi)' },
    { value: 'Continent', description: 'Large landmass, ocean (60 mile hex)', icon: '🌍', category: 'Travel', ratio: '1:3801600 (60mi)' },
    // Planetary Scales
    { value: 'Realm', description: 'Multiple continents (100 mile voxel)', icon: '👑', category: 'Planetary', ratio: '1:6336000 (100mi)' },
    { value: 'Planet', description: 'Entire world/plane (1,000 mile voxel)', icon: '🌐', category: 'Planetary', ratio: '1:63360000 (1000mi)' },
    { value: 'Orbital Space', description: 'Planet + moons + alternate planes (6,000 mile voxel)', icon: '🪐', category: 'Planetary', ratio: '1:380160000 (6000mi)' },
    { value: 'Star System', description: 'Multiple orbital spaces (60,000 mile voxel)', icon: '⭐', category: 'Planetary', ratio: '1:3801600000 (60000mi)' },
    // Astronomical Scales
    { value: 'Inner System', description: 'Habitable zone, inner planets (0.1 AU voxel)', icon: '☀️', category: 'Astronomical', ratio: '1:950405600000 (0.1AU)'},
    { value: 'Planetary System', description: 'Inner/mid planets, asteroid belt (1 AU voxel)', icon: '🌑', category: 'Astronomical', ratio: '1:9504056000000 (1AU)',},
    { value: 'Outer System', description: 'Outer planets, Kuiper belt (6 AU voxel)', icon: '🪨', category: 'Astronomical', ratio: '1:57024336000000 (6AU)' },
    { value: 'Extended System', description: 'Scattered disc, inner Oort cloud (60 AU voxel)', icon: '☄️', category: 'Astronomical', ratio: '1:570243360000000 (60AU)' },
    // Inter-Stellar Scales
    { value: 'Local Binary', description: 'Neighboring stars, binary systems (0.1 LY voxel)', icon: '⭐', category: 'Inter-Stellar', ratio: '1:5.99E+14 (0.1LY)' },
    { value: 'Stellar Neighborhood', description: 'Local star cluster (1 LY voxel)', icon: '✨', category: 'Inter-Stellar', ratio: '1:5.99E+15 (1LY)' },
    { value: 'Stellar Region', description: 'Multiple neighborhoods (6 LY voxel)', icon: '🌟', category: 'Inter-Stellar', ratio: '1:3.59E+16 (6LY)' },
    { value: 'Sector', description: 'Star-forming regions, nebulae (60 LY voxel)', icon: '🌠', category: 'Inter-Stellar', ratio: '1:3.59E+17 (60LY)' },
    // Galactic Scales
    { value: 'Regional Sector', description: 'Multiple sectors (0.1 KLY / 100 LY voxel)', icon: '💫', category: 'Galactic', ratio: '1:5.99E+18 (100LY)' },
    { value: 'Galactic Arm Segment', description: 'Arm sections (1 KLY / 1,000 LY voxel)', icon: '🌀', category: 'Galactic', ratio: '1:5.99E+19 (1KLY)' },
    { value: 'Galactic Arm', description: 'Major spiral arms (6 KLY / 6,000 LY voxel)', icon: '🌌', category: 'Galactic', ratio: '1:3.59E+20 (6KLY)'},
    { value: 'Galaxy', description: 'Entire galaxies (60 KLY / 60,000 LY voxel)', icon: '🌌', category: 'Galactic', ratio: '1:3.59E+21 (60KLY)'},
    // Universal Scales
    { value: 'Local Group', description: 'Nearby galaxies (0.1 MLY / 100 KLY voxel)', icon: '🌠', category: 'Universal', ratio: '1:5.99E+22 (100KLY)'},
    { value: 'Galactic Cluster', description: 'Galaxy clusters (1 MLY / 1,000 KLY voxel)', icon: '✨', category: 'Universal', ratio: '1:5.99E+23 (1MLY)'},
    { value: 'Supercluster', description: 'Superclusters (6 MLY / 6,000 KLY voxel)', icon: '💫', category: 'Universal', ratio: '1:3.59E+24 (6MLY)'},
    { value: 'Universe', description: 'Observable universe sections (60 MLY / 60,000 KLY voxel)', icon: '🌌', category: 'Universal', ratio: '1:3.59E+25 (60MLY)'},
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-600 rounded-t-lg px-8 py-4">
        <h2 className="text-2xl font-display font-bold text-white">
          Core Concepts Management
        </h2>
        <p className="text-blue-100 mt-1">
          Define core game concepts and world scales for your TTRPG platform
        </p>
      </div>

      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-8 py-6 space-y-6">

        {/* Section Navigation */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'locations', label: 'Locations', icon: '📍' },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Worlds Implementing Core Concepts Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-5xl font-bold mb-2">{worlds.length}</div>
                  <div className="text-blue-100 text-lg">Worlds Implementing Core Concepts</div>
                  <div className="text-sm text-blue-200 mt-1">Game systems using this framework</div>
                </div>
                <div className="text-6xl">🌍</div>
              </div>
            </div>

            {/* What are Core Concepts */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">What are Core Concepts?</h4>
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>A Tabletop Role-Playing Game can be broken down into basic concepts that define how the game works:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Sheets/Hands</strong> - Track resources, scores, and store data from cards and books</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Cards</strong> - Spell descriptions, item stats, NPC stat blocks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Boards</strong> - Maps, battle grids, play areas with location sheets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Tokens</strong> - Represent creatures and objects on the board</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Voxels</strong> - Volumetric zones for narrative-first movement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Locations</strong> - Can be as small as a single pixel/voxel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Players/Teams/Roles</strong> - Defined by the game system</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Dice, Tables, Books</strong> - Standard TTRPG components</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  These concepts form the foundation that RPG systems implement. Actual game data lives at the RPG System layer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Locations Section */}
        {activeSection === 'locations' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Location Scales</h3>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">About Location Scales</h4>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Locations can range from microscopic interaction scale (1:1 voxels) to universal scale (60 MLY voxels). These hierarchical scales support everything from tactical combat to galaxy-spanning campaigns.
              </p>
            </div>

            {/* Group scales by category */}
            {['Micro', 'Terrestrial', 'Travel', 'Planetary', 'Astronomical', 'Inter-Stellar', 'Galactic', 'Universal'].map((category) => {
              const categoryScales = scaleLevels.filter(s => s.category === category)
              if (categoryScales.length === 0) return null

              return (
                <div key={category} className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-300 dark:border-gray-700 pb-2">
                    {category} Scales
                  </h4>
                  {categoryScales.map((scale) => (
                    <div
                      key={scale.value}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{scale.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 dark:text-white">
                                {scale.value}
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {scale.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {scale.ratio}
                              </div>
                            </div>
                          </div>
                          {scale.value === 'Realm' && (
                            <div className="mt-2 inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                              Default Scale
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">CFG Multiverse Structure</h4>
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌌</span>
                  <div>
                    <div className="font-semibold">Multiverse</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Contains all universes, including the Core universe and derivative game universes (-I, -II, -III, etc.)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 ml-6">
                  <span className="text-2xl">🌌</span>
                  <div>
                    <div className="font-semibold">Universe</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Multiple orbital spaces using the same or related game systems and genres
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 ml-12">
                  <span className="text-2xl">🪐</span>
                  <div>
                    <div className="font-semibold">Orbital Space</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Main world + moons + alternate planes, dimensions, and timelines
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">🚧</span>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-300">Coming Soon</div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    World scale assignment and multiverse organization tools will be available soon.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p><strong>Note:</strong> Core Concepts integration with Foundry VTT requires the foundry-core-concepts module.</p>
          <p><strong>Players:</strong> Managed as Journal Entries in Foundry with special flags</p>
          <p><strong>Teams:</strong> Managed as Journal Entries in Foundry with special flags</p>
          <p><strong>Roles:</strong> Managed as Role Cards in entity card decks</p>
        </div>
      </div>
    </div>
  )
}
