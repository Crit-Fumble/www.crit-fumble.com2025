/**
 * Weather System
 *
 * Simulates weather conditions and their effects on gameplay.
 * Tracks temperature, precipitation, wind, and visibility.
 * Applies environmental effects to actors.
 */

import { BaseSystem } from './base-system.mjs';

export class WeatherSystem extends BaseSystem {
  constructor() {
    super('weather', 'Weather System', {
      description: 'Simulates weather conditions with environmental effects',
      version: '1.0.0',
      author: 'Crit-Fumble',
      enabled: true,
      config: {
        updateInterval: 3600, // Update every hour (in seconds)
        enableEffects: true, // Apply effects to actors
        season: 'spring'
      }
    });

    this.state = {
      temperature: 70, // Fahrenheit
      precipitation: 'none', // none, drizzle, rain, heavy_rain, snow, sleet, hail
      windSpeed: 5, // mph
      visibility: 'clear', // clear, light_fog, fog, heavy_fog
      cloudCover: 30, // 0-100%
      humidity: 50, // 0-100%
      lastUpdate: 0
    };

    this.seasonData = {
      spring: {
        tempBase: 60,
        tempRange: 25,
        rainChance: 0.3,
        snowChance: 0.05,
        fogChance: 0.1
      },
      summer: {
        tempBase: 85,
        tempRange: 20,
        rainChance: 0.2,
        snowChance: 0,
        fogChance: 0.05
      },
      fall: {
        tempBase: 55,
        tempRange: 25,
        rainChance: 0.35,
        snowChance: 0.1,
        fogChance: 0.15
      },
      winter: {
        tempBase: 35,
        tempRange: 25,
        rainChance: 0.15,
        snowChance: 0.3,
        fogChance: 0.1
      }
    };
  }

  /**
   * Start the weather system
   */
  async start() {
    await super.start();

    // Generate initial weather if not loaded from state
    if (!this.state.lastUpdate) {
      this.generateWeather();
    }

    // Register scene hooks for visual effects
    Hooks.on('canvasReady', () => this.updateSceneAmbiance());

    console.log('Weather System | Current conditions:', this.getWeatherDescription());
  }

  /**
   * Update weather over time
   */
  async update(deltaTime) {
    const timeSinceUpdate = (Date.now() - this.state.lastUpdate) / 1000;

    // Check if it's time for a weather update
    if (timeSinceUpdate >= this.config.updateInterval) {
      this.updateWeather();
      this.state.lastUpdate = Date.now();

      // Apply effects if enabled
      if (this.config.enableEffects) {
        await this.applyWeatherEffects();
      }

      // Update scene ambiance
      this.updateSceneAmbiance();

      // Save state
      await this.saveState();

      // Notify GM
      if (game.user.isGM) {
        ui.notifications.info(`Weather updated: ${this.getWeatherDescription()}`);
      }
    }
  }

  /**
   * Generate new weather conditions
   */
  generateWeather() {
    const season = this.seasonData[this.config.season] || this.seasonData.spring;

    // Temperature
    this.state.temperature = season.tempBase + (Math.random() - 0.5) * season.tempRange;

    // Precipitation
    const precipRoll = Math.random();
    if (precipRoll < season.snowChance && this.state.temperature < 35) {
      this.state.precipitation = 'snow';
    } else if (precipRoll < season.snowChance + season.rainChance) {
      const intensity = Math.random();
      if (intensity < 0.3) {
        this.state.precipitation = 'drizzle';
      } else if (intensity < 0.8) {
        this.state.precipitation = 'rain';
      } else {
        this.state.precipitation = 'heavy_rain';
      }
    } else {
      this.state.precipitation = 'none';
    }

    // Wind
    this.state.windSpeed = Math.random() * 30;

    // Visibility/Fog
    const fogRoll = Math.random();
    if (fogRoll < season.fogChance) {
      const intensity = Math.random();
      if (intensity < 0.4) {
        this.state.visibility = 'light_fog';
      } else if (intensity < 0.8) {
        this.state.visibility = 'fog';
      } else {
        this.state.visibility = 'heavy_fog';
      }
    } else {
      this.state.visibility = 'clear';
    }

    // Cloud cover
    this.state.cloudCover = Math.random() * 100;

    // Humidity
    if (this.state.precipitation !== 'none') {
      this.state.humidity = 70 + Math.random() * 30;
    } else {
      this.state.humidity = 30 + Math.random() * 40;
    }

    this.state.lastUpdate = Date.now();
  }

  /**
   * Update weather gradually
   */
  updateWeather() {
    // Small gradual changes
    this.state.temperature += (Math.random() - 0.5) * 10;
    this.state.windSpeed += (Math.random() - 0.5) * 10;
    this.state.windSpeed = Math.max(0, Math.min(50, this.state.windSpeed));
    this.state.cloudCover += (Math.random() - 0.5) * 20;
    this.state.cloudCover = Math.max(0, Math.min(100, this.state.cloudCover));

    // 20% chance of major weather change
    if (Math.random() < 0.2) {
      this.generateWeather();
    }
  }

  /**
   * Apply weather effects to actors
   */
  async applyWeatherEffects() {
    const effectsToApply = [];

    // Extreme cold
    if (this.state.temperature < 32) {
      effectsToApply.push({
        id: 'weather-extreme-cold',
        name: 'Extreme Cold',
        icon: 'icons/magic/water/snowflake-ice-crystal-white.webp',
        description: 'Suffering from extreme cold',
        changes: []
      });
    }

    // Extreme heat
    if (this.state.temperature > 95) {
      effectsToApply.push({
        id: 'weather-extreme-heat',
        name: 'Extreme Heat',
        icon: 'icons/magic/fire/flame-burning-embers-orange.webp',
        description: 'Suffering from extreme heat',
        changes: []
      });
    }

    // Heavy precipitation
    if (['heavy_rain', 'snow'].includes(this.state.precipitation)) {
      effectsToApply.push({
        id: 'weather-heavy-precipitation',
        name: 'Heavy Precipitation',
        icon: 'icons/magic/water/rain-cloud-storm.webp',
        description: 'Movement hindered by heavy precipitation',
        changes: []
      });
    }

    // Poor visibility
    if (['fog', 'heavy_fog'].includes(this.state.visibility)) {
      effectsToApply.push({
        id: 'weather-poor-visibility',
        name: 'Poor Visibility',
        icon: 'icons/magic/air/fog-gas-smoke-swirling-gray.webp',
        description: 'Vision obscured by fog',
        changes: []
      });
    }

    // Strong winds
    if (this.state.windSpeed > 25) {
      effectsToApply.push({
        id: 'weather-strong-winds',
        name: 'Strong Winds',
        icon: 'icons/magic/air/wind-tornado-wall-blue.webp',
        description: 'Buffeted by strong winds',
        changes: []
      });
    }

    // Apply to all actors
    for (const actor of game.actors) {
      // Remove old weather effects
      const oldEffects = actor.effects.filter(e =>
        e.flags?.['foundry-core-concepts']?.isWeatherEffect
      );
      for (const effect of oldEffects) {
        await effect.delete();
      }

      // Apply new effects
      for (const effectData of effectsToApply) {
        await ActiveEffect.create({
          ...effectData,
          flags: {
            'foundry-core-concepts': {
              isWeatherEffect: true,
              weatherSystemId: this.id
            }
          }
        }, { parent: actor });
      }
    }
  }

  /**
   * Update scene ambiance based on weather
   */
  updateSceneAmbiance() {
    if (!canvas.ready) return;

    const scene = canvas.scene;
    if (!scene) return;

    // Adjust lighting based on cloud cover
    const darknessLevel = this.state.cloudCover / 200; // 0 to 0.5

    // Update scene if GM
    if (game.user.isGM) {
      // Create weather notes for players
      this.displayWeatherWidget();
    }
  }

  /**
   * Display weather widget
   */
  displayWeatherWidget() {
    let widget = document.getElementById('weather-widget');
    if (!widget) {
      widget = document.createElement('div');
      widget.id = 'weather-widget';
      widget.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 100;
        min-width: 200px;
      `;
      document.body.appendChild(widget);
    }

    widget.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">
        Weather Conditions
      </div>
      <div>Temperature: ${Math.round(this.state.temperature)}°F</div>
      <div>Precipitation: ${this.state.precipitation.replace('_', ' ')}</div>
      <div>Wind: ${Math.round(this.state.windSpeed)} mph</div>
      <div>Visibility: ${this.state.visibility.replace('_', ' ')}</div>
    `;
  }

  /**
   * Get weather description
   */
  getWeatherDescription() {
    return `${Math.round(this.state.temperature)}°F, ${this.state.precipitation}, ${Math.round(this.state.windSpeed)} mph winds`;
  }

  /**
   * Set season
   */
  setSeason(season) {
    if (this.seasonData[season]) {
      this.config.season = season;
      this.generateWeather();
      this.onConfigChange(this.config);
    }
  }

  /**
   * Get current season
   */
  getSeason() {
    return this.config.season;
  }

  /**
   * Manually set weather
   */
  setWeather(conditions) {
    if (conditions.temperature !== undefined) {
      this.state.temperature = conditions.temperature;
    }
    if (conditions.precipitation !== undefined) {
      this.state.precipitation = conditions.precipitation;
    }
    if (conditions.windSpeed !== undefined) {
      this.state.windSpeed = conditions.windSpeed;
    }
    if (conditions.visibility !== undefined) {
      this.state.visibility = conditions.visibility;
    }

    this.state.lastUpdate = Date.now();
    this.onStateChange(this.state);
  }

  /**
   * Cleanup
   */
  async cleanup() {
    // Remove weather widget
    const widget = document.getElementById('weather-widget');
    if (widget) {
      widget.remove();
    }

    // Remove weather effects from all actors
    for (const actor of game.actors) {
      const weatherEffects = actor.effects.filter(e =>
        e.flags?.['foundry-core-concepts']?.isWeatherEffect
      );
      for (const effect of weatherEffects) {
        await effect.delete();
      }
    }

    await super.cleanup();
  }
}
