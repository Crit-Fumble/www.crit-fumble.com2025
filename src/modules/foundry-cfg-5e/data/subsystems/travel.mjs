/**
 * Travel Subsystem
 * Overland travel, navigation, and environmental hazards
 *
 * Source: SRD 5.2 - Gameplay Toolbox > Travel Pace, Environmental Effects
 */

export const travelSubsystem = {
  id: 'travel',
  name: 'Travel & Exploration',
  type: 'subsystem',
  category: 'core',
  description: 'Rules for overland travel, navigation, environmental hazards, and survival.',

  usesRules: [
    'speed',
    'exhaustion',
    'ability-check',
    'saving-throw',
    'difficult-terrain',
    'perception',
    'survival'
  ],

  // Travel Pace system
  travelPace: {
    description: 'Characters can travel at Normal, Fast, or Slow pace.',

    paces: [
      {
        pace: 'Fast',
        speedMultiplier: 1.33,
        milesPerHour: 4,
        milesPerDay: 32,
        effect: 'Characters have Disadvantage on Wisdom (Perception) checks.',
        canStealth: false
      },
      {
        pace: 'Normal',
        speedMultiplier: 1.0,
        milesPerHour: 3,
        milesPerDay: 24,
        effect: 'No special effects.',
        canStealth: false
      },
      {
        pace: 'Slow',
        speedMultiplier: 0.67,
        milesPerHour: 2,
        milesPerDay: 16,
        effect: 'Characters can use Stealth.',
        canStealth: true
      }
    ],

    modifiers: [
      {
        modifier: 'Good Roads',
        effect: 'Increases maximum pace by one step (Slow → Normal or Normal → Fast).'
      },
      {
        modifier: 'Slower Travelers',
        effect: 'Group must move at Slow pace if any member\'s Speed is reduced to half or less.'
      },
      {
        modifier: 'Extended Travel',
        description: 'Characters can travel beyond 8 hours per day at risk of exhaustion.',
        check: {
          type: 'Constitution saving throw',
          dc: '10 + 1 for each hour past 8 hours',
          failure: 'Gain 1 Exhaustion level'
        },
        usesRule: 'exhaustion'
      }
    ],

    specialMovement: {
      description: 'For high-speed magical travel (Wind Walk, Carpet of Flying, etc.)',
      formulas: {
        milesPerHour: 'Speed ÷ 10',
        milesPerDayNormal: 'Miles per hour × hours traveled (typically 8)',
        fastPace: 'Miles per day × 1⅓ (round down)',
        slowPace: 'Miles per day × ⅔ (round down)'
      },
      benefit: 'Flying or ignoring Difficult Terrain allows Fast pace regardless of terrain.'
    },

    vehicles: {
      description: 'Characters in vehicles use vehicle\'s speed in miles per hour.',
      note: 'Don\'t choose a travel pace when using vehicles.'
    }
  },

  // Environmental effects
  environmentalEffects: {
    description: 'Natural hazards that can affect travelers.',

    hazards: [
      {
        id: 'deep-water',
        name: 'Deep Water',
        description: 'Swimming through water more than 100 feet deep.',
        check: {
          type: 'Constitution saving throw',
          dc: 10,
          frequency: 'Each hour',
          failure: 'Gain 1 Exhaustion level'
        },
        immunity: 'Creatures with Swim Speed are immune.',
        usesRule: 'exhaustion'
      },
      {
        id: 'extreme-cold',
        name: 'Extreme Cold',
        description: 'Temperature of 0°F or lower.',
        check: {
          type: 'Constitution saving throw',
          dc: 10,
          frequency: 'End of each hour',
          failure: 'Gain 1 Exhaustion level'
        },
        immunity: 'Creatures with Resistance or Immunity to Cold damage.',
        usesRule: 'exhaustion'
      },
      {
        id: 'extreme-heat',
        name: 'Extreme Heat',
        description: 'Temperature of 100°F or higher, without drinkable water.',
        check: {
          type: 'Constitution saving throw',
          dc: '5 for first hour, +1 each additional hour',
          frequency: 'End of each hour',
          failure: 'Gain 1 Exhaustion level',
          disadvantage: 'Wearing Medium or Heavy armor'
        },
        immunity: 'Creatures with Resistance or Immunity to Fire damage.',
        usesRule: 'exhaustion'
      },
      {
        id: 'frigid-water',
        name: 'Frigid Water',
        description: 'Immersion in ice-cold water.',
        duration: 'Constitution score in minutes before ill effects',
        check: {
          type: 'Constitution saving throw',
          dc: 10,
          frequency: 'Each additional minute',
          failure: 'Gain 1 Exhaustion level'
        },
        immunity: 'Creatures with Resistance/Immunity to Cold or naturally adapted to ice-cold water.',
        usesRule: 'exhaustion'
      },
      {
        id: 'heavy-precipitation',
        name: 'Heavy Precipitation',
        description: 'Heavy rain or heavy snowfall.',
        effects: [
          'Area is Lightly Obscured',
          'Disadvantage on Wisdom (Perception) checks',
          'Heavy rain extinguishes open flames'
        ],
        usesRule: 'obscured'
      },
      {
        id: 'high-altitude',
        name: 'High Altitude',
        description: 'Traveling at 10,000+ feet above sea level.',
        effect: 'Each hour counts as 2 hours for determining travel duration.',
        acclimation: {
          duration: '30 days or more at elevation',
          limit: 'Cannot acclimate above 20,000 feet unless native to such environments'
        }
      },
      {
        id: 'slippery-ice',
        name: 'Slippery Ice',
        description: 'Ice-covered surfaces.',
        effect: 'Slippery ice is Difficult Terrain.',
        check: {
          type: 'Dexterity saving throw',
          dc: 10,
          trigger: 'Moves onto slippery ice for first time on turn or starts turn there',
          failure: 'Prone condition'
        },
        usesRule: 'difficult-terrain'
      },
      {
        id: 'strong-wind',
        name: 'Strong Wind',
        description: 'High-speed winds.',
        effects: [
          'Disadvantage on ranged weapon attack rolls',
          'Extinguishes open flames',
          'Disperses fog',
          'Flying creatures must land at end of turn or fall',
          'In desert: sandstorm imposes Disadvantage on Wisdom (Perception) checks'
        ]
      },
      {
        id: 'thin-ice',
        name: 'Thin Ice',
        description: 'Ice that cannot support heavy weight.',
        weightTolerance: '3d10 × 10 pounds per 10-foot-square area',
        failure: 'Ice breaks when weight exceeds tolerance. Creatures fall through into frigid water.',
        references: ['frigid-water']
      }
    ]
  },

  // Travel activities
  activities: {
    gm: [
      'gm-describe-terrain',
      'gm-determine-travel-duration',
      'gm-apply-environmental-effects',
      'gm-trigger-random-encounter'
    ],
    player: [
      'navigate',
      'forage',
      'track',
      'scout',
      'set-pace',
      'rest-short',
      'rest-long'
    ]
  },

  metadata: {
    source: 'SRD 5.2 - Gameplay Toolbox',
    sections: ['Travel Pace', 'Environmental Effects'],
    type: 'subsystem',
    fundamental: true
  }
};

export default travelSubsystem;
