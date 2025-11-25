'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorldAnvilLinkForm } from '../molecules/WorldAnvilLinkForm';

interface LinkedAccountsContentProps {
  discordLinked: boolean;
  discordUsername?: string | null;
  githubLinked: boolean;
  githubUsername?: string | null;
  twitchLinked: boolean;
  twitchUsername?: string | null;
  worldAnvilLinked: boolean;
  worldAnvilUsername?: string | null;
}

export function LinkedAccountsContent({
  discordLinked,
  discordUsername,
  githubLinked,
  githubUsername,
  twitchLinked,
  twitchUsername,
  worldAnvilLinked,
  worldAnvilUsername,
}: LinkedAccountsContentProps) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    // Refresh the page data
    setRefreshKey(prev => prev + 1);
    router.refresh();
  };

  return (
    <div className="space-y-6" key={refreshKey}>
      {/* Discord Account */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="discord-account">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Discord</h3>
            {discordLinked ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connected as <span className="font-medium text-gray-900 dark:text-white">{discordUsername}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link your Discord account to join our community server
              </p>
            )}
          </div>
          {discordLinked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* GitHub Account */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="github-account">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 text-gray-900 dark:text-gray-100" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub</h3>
            {githubLinked ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connected as <span className="font-medium text-gray-900 dark:text-white">{githubUsername}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link your GitHub account for easy authentication
              </p>
            )}
          </div>
          {githubLinked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* Twitch Account */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6" data-testid="twitch-account">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-12 h-12 text-[#9146FF]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Twitch</h3>
            {twitchLinked ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Connected as <span className="font-medium text-gray-900 dark:text-white">{twitchUsername}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Link your Twitch account to join our streaming community
              </p>
            )}
          </div>
          {twitchLinked && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
              Connected
            </span>
          )}
        </div>
      </div>

      {/* World Anvil Account */}
      <WorldAnvilLinkForm
        isLinked={worldAnvilLinked}
        worldAnvilUsername={worldAnvilUsername}
        onUpdate={handleUpdate}
      />

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              About Linked Accounts
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Linking your accounts allows Crit-Fumble to provide enhanced features such as importing your World Anvil content,
              syncing with Discord roles, and personalized experiences. Your account information is stored securely and never
              shared without your permission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
