import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isWorldEditable, getEditLockMessage } from '@/lib/worldEditLock';

interface WorldPageProps {
  params: {
    worldId: string;
  };
}

// This would come from your API/database in real implementation
async function getWorldData(worldId: string) {
  // TODO: Fetch from /api/rpg/worlds/:id
  return {
    id: worldId,
    name: 'Example World',
    description: 'A persistent RPG world',
    isLive: false,
    lastSaved: new Date().toISOString(),
    gameSystem: 'D&D 5e',
    gmName: 'Game Master'
  };
}

export async function generateMetadata({ params }: WorldPageProps): Promise<Metadata> {
  const world = await getWorldData(params.worldId);

  return {
    title: `${world.name} - World Dashboard`,
    description: world.description,
  };
}

export default async function WorldDashboardPage({ params }: WorldPageProps) {
  const world = await getWorldData(params.worldId);

  if (!world) {
    notFound();
  }

  // Check if world is editable (critical for data integrity)
  const lockStatus = await isWorldEditable(params.worldId);
  const lockMessage = getEditLockMessage(lockStatus);

  const coreConceptCategories = [
    {
      title: 'World Elements',
      icon: '🌍',
      concepts: [
        { name: 'Creatures & NPCs', href: `/worlds/${params.worldId}/creatures`, icon: '👥', count: 0 },
        { name: 'Locations', href: `/worlds/${params.worldId}/locations`, icon: '📍', count: 0 },
        { name: 'Objects & Items', href: `/worlds/${params.worldId}/objects`, icon: '⚔️', count: 0 },
        { name: 'Boards & Maps', href: `/worlds/${params.worldId}/boards`, icon: '🗺️', count: 0 },
      ]
    },
    {
      title: 'Game Components',
      icon: '🎲',
      concepts: [
        { name: 'Cards', href: `/worlds/${params.worldId}/cards`, icon: '🃏', count: 0 },
        { name: 'Decks', href: `/worlds/${params.worldId}/decks`, icon: '📚', count: 0 },
        { name: 'Tables', href: `/worlds/${params.worldId}/tables`, icon: '📋', count: 0 },
        { name: 'Dice Rolls', href: `/worlds/${params.worldId}/dice`, icon: '🎲', count: 0 },
      ]
    },
    {
      title: 'Rules & Systems',
      icon: '📖',
      concepts: [
        { name: 'Rules', href: `/worlds/${params.worldId}/rules`, icon: '⚖️', count: 0 },
        { name: 'Systems', href: `/worlds/${params.worldId}/systems`, icon: '⚙️', count: 0 },
        { name: 'Modes', href: `/worlds/${params.worldId}/modes`, icon: '🎭', count: 0 },
        { name: 'Books', href: `/worlds/${params.worldId}/books`, icon: '📕', count: 0 },
      ]
    },
    {
      title: 'Campaign Data',
      icon: '📜',
      concepts: [
        { name: 'Sessions', href: `/worlds/${params.worldId}/sessions`, icon: '🎮', count: 0 },
        { name: 'Events', href: `/worlds/${params.worldId}/events`, icon: '⚡', count: 0 },
        { name: 'Goals', href: `/worlds/${params.worldId}/goals`, icon: '🎯', count: 0 },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{world.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{world.description}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-gray-600">
                  System: <strong>{world.gameSystem}</strong>
                </span>
                <span className="text-gray-600">
                  GM: <strong>{world.gmName}</strong>
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  world.isLive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {world.isLive ? '🟢 Live' : '⚫ Offline'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {world.isLive ? (
                <Link
                  href={`/play/${params.worldId}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Join Session
                </Link>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  disabled
                >
                  Start Session
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lock Status Banner */}
        {!lockStatus.editable ? (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  🔒 Read-Only Mode
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  {lockMessage}
                </p>
                <p className="mt-2 text-xs text-yellow-600">
                  Editing is disabled to prevent data conflicts. Changes made in Foundry will automatically sync to the database.
                </p>
                {lockStatus.instanceUrl && (
                  <a
                    href={lockStatus.instanceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Join Active Session →
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  ✅ World is offline - Editable
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Browse and edit your world's core concepts. Data will sync automatically when you start a session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Core Concepts Grid */}
        <div className="space-y-8">
          {coreConceptCategories.map((category) => (
            <div key={category.title}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.concepts.map((concept) => (
                  <Link
                    key={concept.name}
                    href={concept.href}
                    className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{concept.icon}</span>
                      <span className="text-2xl font-bold text-gray-300">
                        {concept.count}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{concept.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      View and manage
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📊</span>
            Recent Activity
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center text-gray-500 py-8">
              <p>No recent activity</p>
              <p className="text-sm mt-1">Activity will appear here when you play sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
