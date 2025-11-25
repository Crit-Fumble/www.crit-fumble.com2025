'use client';

import { useState, useEffect } from 'react';

interface FoundryStatus {
  isRunning: boolean;
  lastActivityTime: number | null;
  timeSinceActivity: number | null;
  minutesUntilShutdown: number | null;
  idleTimeoutMinutes: number;
  stats?: any;
  environment: string;
}

export function FoundryInstanceControl() {
  const [status, setStatus] = useState<FoundryStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/foundry/instance');
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Start Foundry
  const startFoundry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/foundry/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });

      if (!response.ok) throw new Error('Failed to start Foundry');

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Failed to start Foundry');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stop Foundry
  const stopFoundry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/foundry/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });

      if (!response.ok) throw new Error('Failed to stop Foundry');

      const data = await response.json();
      if (data.success) {
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Failed to stop Foundry');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-700 dark:border-t-neutral-400" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading Foundry status...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              status.isRunning
                ? 'bg-green-500 animate-pulse'
                : 'bg-neutral-400 dark:bg-neutral-600'
            }`}
          />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
              Foundry VTT Instance
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {status.isRunning ? 'Running' : 'Stopped'}
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!status.isRunning ? (
            <button
              onClick={startFoundry}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Start Foundry</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopFoundry}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Stopping...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  <span>Stop Foundry</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Information */}
      {status.isRunning && (
        <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          {/* Auto-shutdown timer */}
          {status.minutesUntilShutdown !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">
                Auto-shutdown in:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {status.minutesUntilShutdown} minutes
              </span>
            </div>
          )}

          {/* Resource usage */}
          {status.stats && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">CPU Usage:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {status.stats.CPUPerc}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Memory Usage:
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {status.stats.MemUsage}
                </span>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Auto-Shutdown:</strong> Foundry will automatically shut down after{' '}
              {status.idleTimeoutMinutes} minutes of inactivity to save resources.
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-900 dark:text-red-100">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Help text when stopped */}
      {!status.isRunning && (
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Start the Foundry VTT instance to begin your game session. The instance will
            automatically shut down after 15 minutes of inactivity.
          </p>
        </div>
      )}
    </div>
  );
}
