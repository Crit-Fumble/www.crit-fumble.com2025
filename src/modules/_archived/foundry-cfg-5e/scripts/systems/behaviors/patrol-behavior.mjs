/**
 * Patrol Behavior
 *
 * Makes creatures patrol between waypoints.
 */

import { Behavior } from './behavior.mjs';

export class PatrolBehavior extends Behavior {
  constructor() {
    super('patrol', 'Patrol', {
      description: 'Patrol between designated waypoints',
      type: 'utility',
      priority: 50
    });
  }

  /**
   * Get initial state
   */
  getInitialState(actor) {
    return {
      active: false,
      currentWaypointIndex: 0,
      waypoints: this.getWaypointsFromActor(actor),
      pauseUntil: 0,
      direction: 1 // 1 for forward, -1 for reverse
    };
  }

  /**
   * Get waypoints from actor flags or token
   */
  getWaypointsFromActor(actor) {
    // Try to get from actor flags
    const flagWaypoints = actor.getFlag('foundry-behaviors', 'patrolWaypoints');
    if (flagWaypoints && flagWaypoints.length > 0) {
      return flagWaypoints;
    }

    // If no waypoints, return token position as single waypoint
    const token = actor.token || actor.getActiveTokens()[0];
    if (token) {
      return [{
        x: token.x,
        y: token.y,
        pause: 0
      }];
    }

    return [];
  }

  /**
   * Check if behavior can execute
   */
  canExecute(actor) {
    if (!super.canExecute(actor)) return false;

    const state = this.getState(actor);
    return state.waypoints && state.waypoints.length > 1;
  }

  /**
   * Update patrol
   */
  async update(actor, deltaTime) {
    const state = this.getState(actor);
    const now = Date.now();

    // Check if paused
    if (state.pauseUntil > now) {
      return;
    }

    // Get token
    const token = actor.token || actor.getActiveTokens()[0];
    if (!token) return;

    // Get current and next waypoint
    const currentWaypoint = state.waypoints[state.currentWaypointIndex];
    if (!currentWaypoint) return;

    // Calculate distance to current waypoint
    const dx = currentWaypoint.x - token.x;
    const dy = currentWaypoint.y - token.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If close enough to waypoint
    if (distance < 50) { // 50 pixels threshold
      // Pause if specified
      if (currentWaypoint.pause > 0) {
        this.setState(actor, {
          pauseUntil: now + (currentWaypoint.pause * 1000)
        });
        return;
      }

      // Move to next waypoint
      let nextIndex = state.currentWaypointIndex + state.direction;

      // Handle patrol pattern
      const patrolPattern = actor.getFlag('foundry-behaviors', 'patrolPattern') || 'loop';

      if (patrolPattern === 'loop') {
        // Loop back to start
        if (nextIndex >= state.waypoints.length) {
          nextIndex = 0;
        }
      } else if (patrolPattern === 'bounce') {
        // Bounce back and forth
        if (nextIndex >= state.waypoints.length || nextIndex < 0) {
          this.setState(actor, {
            direction: -state.direction
          });
          nextIndex = state.currentWaypointIndex + (-state.direction);
        }
      } else if (patrolPattern === 'once') {
        // Stop at end
        if (nextIndex >= state.waypoints.length) {
          this.setState(actor, { active: false });
          return;
        }
      }

      this.setState(actor, {
        currentWaypointIndex: nextIndex
      });
    } else {
      // Move toward waypoint
      await this.moveToward(token, currentWaypoint, deltaTime);
    }
  }

  /**
   * Move token toward target
   */
  async moveToward(token, target, deltaTime) {
    const speed = token.actor.getFlag('foundry-behaviors', 'patrolSpeed') || 100; // pixels per second

    const dx = target.x - token.x;
    const dy = target.y - token.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Calculate movement for this frame
    const moveDistance = Math.min(speed * deltaTime, distance);
    const ratio = moveDistance / distance;

    const newX = token.x + (dx * ratio);
    const newY = token.y + (dy * ratio);

    // Update token position
    try {
      await token.document.update({
        x: newX,
        y: newY,
        rotation: this.calculateRotation(dx, dy)
      }, { animate: false });
    } catch (error) {
      // Token update may fail if not GM or token not controllable
    }
  }

  /**
   * Calculate rotation angle from direction
   */
  calculateRotation(dx, dy) {
    return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  }

  /**
   * Execute behavior (start patrol)
   */
  async execute(actor) {
    await super.execute(actor);

    this.setState(actor, {
      active: true,
      currentWaypointIndex: 0,
      pauseUntil: 0
    });
  }

  /**
   * Get behavior metadata
   */
  getMetadata() {
    return {
      ...super.getMetadata(),
      configurableProperties: [
        {
          key: 'patrolWaypoints',
          name: 'Patrol Waypoints',
          type: 'waypoint-array',
          description: 'Array of {x, y, pause} waypoints'
        },
        {
          key: 'patrolPattern',
          name: 'Patrol Pattern',
          type: 'select',
          options: ['loop', 'bounce', 'once'],
          default: 'loop',
          description: 'How to handle reaching the end of waypoints'
        },
        {
          key: 'patrolSpeed',
          name: 'Patrol Speed',
          type: 'number',
          default: 100,
          description: 'Movement speed in pixels per second'
        }
      ]
    };
  }
}
