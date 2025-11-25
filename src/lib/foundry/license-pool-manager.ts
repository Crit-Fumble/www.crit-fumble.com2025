/**
 * Foundry VTT License Pool Manager
 * Manages shared Foundry licenses for free tier users
 */

export interface License {
  key: string;
  instanceId: string | null;  // Which instance is using this license
  worldCount: number;          // How many worlds on this instance
  maxWorlds: number;           // Maximum worlds per instance
  active: boolean;
}

export interface LicenseAssignment {
  mode: 'shared' | 'private';
  instanceId?: string;
  licenseKey?: string;
  estimatedStartTime?: Date;
}

export interface InstanceInfo {
  id: string;
  licenseKey: string;
  worldIds: string[];
  worldCount: number;
  maxWorlds: number;
  cpuUsage?: number;
  memoryUsage?: number;
  isPrivate: boolean;
}

/**
 * License Pool Manager
 */
export class LicensePoolManager {
  private licenses: Map<string, License> = new Map();
  private instances: Map<string, InstanceInfo> = new Map();
  private maxWorldsPerInstance: number;

  constructor(maxWorldsPerInstance: number = 30) {
    this.maxWorldsPerInstance = maxWorldsPerInstance;
    this.initializeLicenses();
  }

  /**
   * Initialize licenses from environment
   */
  private initializeLicenses() {
    const licensesEnv = process.env.FOUNDRY_VTT_LICENSES;

    if (!licensesEnv) {
      console.warn('[LicensePool] No FOUNDRY_VTT_LICENSES configured');
      return;
    }

    try {
      const licenseKeys: string[] = JSON.parse(licensesEnv);

      for (const key of licenseKeys) {
        this.licenses.set(key, {
          key,
          instanceId: null,
          worldCount: 0,
          maxWorlds: this.maxWorldsPerInstance,
          active: false
        });
      }

      console.log(`[LicensePool] Initialized ${licenseKeys.length} licenses`);
    } catch (error) {
      console.error('[LicensePool] Failed to parse FOUNDRY_VTT_LICENSES:', error);
    }
  }

  /**
   * Assign a campaign to an instance
   */
  async assignCampaign(
    campaignId: string,
    userLicense?: string
  ): Promise<LicenseAssignment> {
    // If user provides license, create private instance
    if (userLicense) {
      return this.assignPrivateInstance(campaignId, userLicense);
    }

    // Otherwise, use shared instance from pool
    return this.assignSharedInstance(campaignId);
  }

  /**
   * Assign to shared instance (free tier)
   */
  private assignSharedInstance(campaignId: string): LicenseAssignment {
    // Find least-loaded shared instance
    const sharedInstances = Array.from(this.instances.values())
      .filter(i => !i.isPrivate)
      .sort((a, b) => a.worldCount - b.worldCount);

    // Use existing instance if available and not full
    if (sharedInstances.length > 0) {
      const instance = sharedInstances[0];

      if (instance.worldCount < this.maxWorldsPerInstance) {
        // Add campaign to this instance
        instance.worldIds.push(campaignId);
        instance.worldCount++;

        // Update license
        const license = this.licenses.get(instance.licenseKey);
        if (license) {
          license.worldCount++;
        }

        console.log(`[LicensePool] Assigned ${campaignId} to existing instance ${instance.id}`);

        return {
          mode: 'shared',
          instanceId: instance.id,
          licenseKey: instance.licenseKey
        };
      }
    }

    // Create new shared instance
    const availableLicense = this.getAvailableLicense();

    if (availableLicense) {
      const instanceId = `shared-${Date.now()}`;

      // Create new instance
      const instance: InstanceInfo = {
        id: instanceId,
        licenseKey: availableLicense.key,
        worldIds: [campaignId],
        worldCount: 1,
        maxWorlds: this.maxWorldsPerInstance,
        isPrivate: false
      };

      this.instances.set(instanceId, instance);

      // Update license
      availableLicense.instanceId = instanceId;
      availableLicense.worldCount = 1;
      availableLicense.active = true;

      console.log(`[LicensePool] Created new shared instance ${instanceId} for ${campaignId}`);

      return {
        mode: 'shared',
        instanceId,
        licenseKey: availableLicense.key
      };
    }

    // No capacity available
    throw new Error(
      'No available capacity. All shared instances are full. Please upgrade to premium or try later.'
    );
  }

  /**
   * Assign to private instance (premium tier)
   */
  private assignPrivateInstance(
    campaignId: string,
    userLicense: string
  ): LicenseAssignment {
    const instanceId = `private-${campaignId}`;

    // Create private instance
    const instance: InstanceInfo = {
      id: instanceId,
      licenseKey: userLicense,
      worldIds: [campaignId],
      worldCount: 1,
      maxWorlds: 100,  // No hard limit for private instances
      isPrivate: true
    };

    this.instances.set(instanceId, instance);

    console.log(`[LicensePool] Created private instance ${instanceId} for ${campaignId}`);

    return {
      mode: 'private',
      instanceId,
      licenseKey: userLicense
    };
  }

  /**
   * Get available license from pool
   */
  private getAvailableLicense(): License | null {
    for (const license of this.licenses.values()) {
      if (!license.active || license.worldCount < license.maxWorlds) {
        return license;
      }
    }
    return null;
  }

  /**
   * Release a campaign from instance
   */
  releaseCampaign(campaignId: string): void {
    // Find instance with this campaign
    for (const [instanceId, instance] of this.instances.entries()) {
      const index = instance.worldIds.indexOf(campaignId);

      if (index !== -1) {
        // Remove campaign from instance
        instance.worldIds.splice(index, 1);
        instance.worldCount--;

        // Update license
        const license = this.licenses.get(instance.licenseKey);
        if (license) {
          license.worldCount--;
        }

        console.log(`[LicensePool] Released ${campaignId} from instance ${instanceId}`);

        // If instance is now empty and not private, deactivate
        if (!instance.isPrivate && instance.worldCount === 0) {
          this.instances.delete(instanceId);

          if (license) {
            license.instanceId = null;
            license.worldCount = 0;
            license.active = false;
          }

          console.log(`[LicensePool] Deactivated empty instance ${instanceId}`);
        }

        return;
      }
    }

    console.warn(`[LicensePool] Campaign ${campaignId} not found in any instance`);
  }

  /**
   * Get instance info
   */
  getInstance(instanceId: string): InstanceInfo | null {
    return this.instances.get(instanceId) || null;
  }

  /**
   * Get all instances
   */
  getAllInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const totalLicenses = this.licenses.size;
    const activeLicenses = Array.from(this.licenses.values()).filter(l => l.active).length;
    const totalInstances = this.instances.size;
    const sharedInstances = Array.from(this.instances.values()).filter(i => !i.isPrivate).length;
    const privateInstances = Array.from(this.instances.values()).filter(i => i.isPrivate).length;
    const totalCampaigns = Array.from(this.instances.values()).reduce((sum, i) => sum + i.worldCount, 0);

    const avgCampaignsPerSharedInstance = sharedInstances > 0
      ? totalCampaigns / sharedInstances
      : 0;

    const availableCapacity = (totalLicenses - activeLicenses) * this.maxWorldsPerInstance +
      Array.from(this.instances.values())
        .filter(i => !i.isPrivate)
        .reduce((sum, i) => sum + (i.maxWorlds - i.worldCount), 0);

    return {
      licenses: {
        total: totalLicenses,
        active: activeLicenses,
        available: totalLicenses - activeLicenses
      },
      instances: {
        total: totalInstances,
        shared: sharedInstances,
        private: privateInstances
      },
      campaigns: {
        total: totalCampaigns,
        avgPerSharedInstance: Math.round(avgCampaignsPerSharedInstance * 10) / 10
      },
      capacity: {
        available: availableCapacity,
        maxWorldsPerInstance: this.maxWorldsPerInstance
      }
    };
  }

  /**
   * Check if can accept new campaign
   */
  canAcceptCampaign(): boolean {
    const stats = this.getStats();
    return stats.capacity.available > 0;
  }

  /**
   * Get estimated wait time
   */
  getEstimatedWaitTime(): number {
    if (this.canAcceptCampaign()) {
      return 0;  // Immediate
    }

    // Estimate based on average session length (assume 3 hours)
    const avgSessionHours = 3;
    return avgSessionHours * 60;  // minutes
  }
}

// Singleton instance
export const licensePool = new LicensePoolManager();
