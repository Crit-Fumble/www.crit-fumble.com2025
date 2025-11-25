'use client';

import { useState } from 'react';

interface WorldAnvilLinkFormProps {
  isLinked: boolean;
  worldAnvilUsername?: string | null;
  onUpdate: () => void;
}

export function WorldAnvilLinkForm({ isLinked, worldAnvilUsername, onUpdate }: WorldAnvilLinkFormProps) {
  const [userToken, setUserToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/linked-accounts/worldanvil/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link World Anvil account');
      }

      // Clear form and notify parent
      setUserToken('');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to unlink your World Anvil account?')) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/linked-accounts/worldanvil/unlink', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unlink World Anvil account');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLinked) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="worldanvil-linked">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-amber-600 dark:text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4 0-7-3-7-7V8.3l7-3.11L19 8.3V13c0 4-3 7-7 7z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">World Anvil</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connected as <span className="font-medium text-gray-900 dark:text-white">{worldAnvilUsername}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Access your worlds, articles, and content
              </p>
            </div>
          </div>
          <button
            onClick={handleUnlink}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="unlink-worldanvil-button"
          >
            {isLoading ? 'Unlinking...' : 'Unlink'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="worldanvil-link-form">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-4 0-7-3-7-7V8.3l7-3.11L19 8.3V13c0 4-3 7-7 7z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">World Anvil</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Connect your World Anvil account to access your worlds and content
          </p>

          <form onSubmit={handleLink} className="mt-4 space-y-4">
            <div>
              <label htmlFor="worldanvil-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User API Token
              </label>
              <div className="relative">
                <input
                  id="worldanvil-token"
                  type={showToken ? 'text' : 'password'}
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value)}
                  placeholder="Enter your World Anvil User API Token"
                  className="w-full px-4 py-2 pr-12 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                  data-testid="worldanvil-token-input"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showToken ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Get your User API Token from{' '}
                <a
                  href="https://www.worldanvil.com/api/auth/key"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  World Anvil API Settings
                </a>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !userToken}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
              data-testid="link-worldanvil-button"
            >
              {isLoading ? 'Verifying...' : 'Link Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
