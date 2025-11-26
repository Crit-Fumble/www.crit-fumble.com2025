/**
 * Authentication Client for Core Concepts API
 * Handles JWT token exchange and storage for authentication with the Express bridge server
 */

export class AuthClient {
  constructor() {
    this.token = null;
    this.user = null;
    this.bridgeURL = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with the bridge server using NextAuth session token
   * @param {string} bridgeURL - URL of the Express bridge server
   */
  async authenticate(bridgeURL) {
    this.bridgeURL = bridgeURL;

    // Get session token from browser cookie
    const sessionToken = this.getSessionTokenFromCookie();

    if (!sessionToken) {
      throw new Error('No session token found. Please log in to Crit-Fumble website first.');
    }

    // Exchange session token for JWT
    try {
      const response = await fetch(`${bridgeURL}/auth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionToken }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      const data = await response.json();

      // Store JWT token and user info
      this.token = data.token;
      this.user = data.user;
      this.tokenExpiry = Date.now() + (data.expiresIn * 1000);

      // Save to localStorage for persistence
      localStorage.setItem('crit-fumble-jwt', data.token);
      localStorage.setItem('crit-fumble-user', JSON.stringify(data.user));
      localStorage.setItem('crit-fumble-token-expiry', this.tokenExpiry.toString());

      console.log('Core Concepts API | Authenticated as:', data.user.username);

      return true;
    } catch (error) {
      console.error('Core Concepts API | Authentication error:', error);
      throw error;
    }
  }

  /**
   * Get session token from browser cookie
   * @returns {string|null} Session token or null if not found
   */
  getSessionTokenFromCookie() {
    const cookies = document.cookie.split(';');

    // Try to find NextAuth session token
    for (const cookie of cookies) {
      const trimmed = cookie.trim();

      // NextAuth uses different cookie names based on NEXTAUTH_URL
      if (trimmed.startsWith('next-auth.session-token=') ||
          trimmed.startsWith('__Secure-next-auth.session-token=')) {
        return trimmed.split('=')[1];
      }
    }

    return null;
  }

  /**
   * Verify token is valid with bridge server
   * @returns {Promise<boolean>}
   */
  async verifyToken() {
    if (!this.token || !this.bridgeURL) {
      return false;
    }

    try {
      const response = await fetch(`${this.bridgeURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Core Concepts API | Token verification failed:', error);
      return false;
    }
  }

  /**
   * Check if currently authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    // Check if token exists and hasn't expired
    if (!this.token || !this.tokenExpiry) {
      // Try to load from localStorage
      this.loadFromStorage();
    }

    return this.token !== null && Date.now() < this.tokenExpiry;
  }

  /**
   * Load token from localStorage
   */
  loadFromStorage() {
    try {
      this.token = localStorage.getItem('crit-fumble-jwt');
      const userStr = localStorage.getItem('crit-fumble-user');
      const expiryStr = localStorage.getItem('crit-fumble-token-expiry');

      if (userStr) {
        this.user = JSON.parse(userStr);
      }

      if (expiryStr) {
        this.tokenExpiry = parseInt(expiryStr, 10);
      }

      // Check if token is expired
      if (this.tokenExpiry && Date.now() >= this.tokenExpiry) {
        this.clearToken();
      }
    } catch (error) {
      console.error('Core Concepts API | Failed to load token from storage:', error);
      this.clearToken();
    }
  }

  /**
   * Get current JWT token
   * @returns {string|null}
   */
  getToken() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.token;
  }

  /**
   * Get current user info
   * @returns {object|null}
   */
  getUser() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.user;
  }

  /**
   * Clear stored token and user info
   */
  clearToken() {
    this.token = null;
    this.user = null;
    this.tokenExpiry = null;

    localStorage.removeItem('crit-fumble-jwt');
    localStorage.removeItem('crit-fumble-user');
    localStorage.removeItem('crit-fumble-token-expiry');
  }

  /**
   * Make authenticated request to bridge server
   * @param {string} endpoint - API endpoint (e.g., '/api/sessions')
   * @param {object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async fetch(endpoint, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }

    const url = `${this.bridgeURL}${endpoint}`;

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  /**
   * Get user info from bridge server
   * @returns {Promise<object>}
   */
  async getUserInfo() {
    try {
      const response = await this.fetch('/auth/me');

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      this.user = data; // Update cached user info

      return data;
    } catch (error) {
      console.error('Core Concepts API | Failed to get user info:', error);
      throw error;
    }
  }

  /**
   * Refresh token if needed (token is valid for 7 days)
   * @returns {Promise<boolean>}
   */
  async refreshIfNeeded() {
    if (!this.isAuthenticated()) {
      return false;
    }

    // Refresh if token expires in less than 1 day
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (this.tokenExpiry - Date.now() < oneDayMs) {
      try {
        console.log('Core Concepts API | Refreshing token...');
        await this.authenticate(this.bridgeURL);
        return true;
      } catch (error) {
        console.error('Core Concepts API | Token refresh failed:', error);
        return false;
      }
    }

    return true;
  }
}
