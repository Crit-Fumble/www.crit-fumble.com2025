'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function NewCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.worldId as string;

  const [formData, setFormData] = useState({
    name: '',
    race: '',
    class: '',
    level: 1,
    imageUrl: '',
    backstory: '',
    // Alignment/Personality axes (0-100)
    lawfulness: 50,
    goodness: 50,
    faith: 50,
    courage: 50,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/rpg/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rpgWorldId: worldId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create character');
      }

      const { character } = await response.json();
      router.push(`/worlds/${worldId}/characters/${character.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSliderChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getAlignmentLabel = (lawfulness: number, goodness: number): string => {
    const lawfulnessLabel =
      lawfulness >= 67 ? 'Lawful' : lawfulness >= 34 ? 'Neutral' : 'Chaotic';
    const goodnessLabel =
      goodness >= 67 ? 'Good' : goodness >= 34 ? 'Neutral' : 'Evil';

    if (lawfulness >= 34 && lawfulness < 67 && goodness >= 34 && goodness < 67) {
      return 'True Neutral';
    }

    return `${lawfulnessLabel} ${goodnessLabel}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/worlds/${worldId}/characters`}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Characters
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Character</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submit a character for GM approval
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Character Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Aragorn"
                />
              </div>

              <div>
                <label htmlFor="race" className="block text-sm font-medium text-gray-700 mb-1">
                  Race
                </label>
                <input
                  type="text"
                  id="race"
                  name="race"
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Human, Elf, Dwarf..."
                />
              </div>

              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <input
                  type="text"
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ranger, Wizard, Fighter..."
                />
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <input
                  type="number"
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Personality & Alignment */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Personality</h2>
            <p className="text-sm text-gray-600 mb-4">
              Define your character's personality along four axes. These drive behavior in AI simulations.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-900">
                Computed Alignment: <span className="text-lg">{getAlignmentLabel(formData.lawfulness, formData.goodness)}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Lawfulness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Lawfulness</label>
                  <span className="text-sm text-gray-600">
                    {formData.lawfulness === 0 ? 'Chaotic' : formData.lawfulness === 100 ? 'Lawful' : formData.lawfulness}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.lawfulness}
                  onChange={(e) => handleSliderChange('lawfulness', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Chaotic</span>
                  <span>Neutral</span>
                  <span>Lawful</span>
                </div>
              </div>

              {/* Goodness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Goodness</label>
                  <span className="text-sm text-gray-600">
                    {formData.goodness === 0 ? 'Evil' : formData.goodness === 100 ? 'Good' : formData.goodness}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.goodness}
                  onChange={(e) => handleSliderChange('goodness', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Evil</span>
                  <span>Neutral</span>
                  <span>Good</span>
                </div>
              </div>

              {/* Faith */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Faith</label>
                  <span className="text-sm text-gray-600">
                    {formData.faith === 0 ? 'Atheist' : formData.faith === 100 ? 'Zealot' : formData.faith}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.faith}
                  onChange={(e) => handleSliderChange('faith', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Atheist</span>
                  <span>Moderate</span>
                  <span>Zealot</span>
                </div>
              </div>

              {/* Courage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Courage</label>
                  <span className="text-sm text-gray-600">
                    {formData.courage === 0 ? 'Cowardly' : formData.courage === 100 ? 'Heroic' : formData.courage}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.courage}
                  onChange={(e) => handleSliderChange('courage', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Cowardly</span>
                  <span>Cautious</span>
                  <span>Heroic</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backstory */}
          <div className="mb-8">
            <label htmlFor="backstory" className="block text-sm font-medium text-gray-700 mb-1">
              Backstory
            </label>
            <textarea
              id="backstory"
              name="backstory"
              value={formData.backstory}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell us about your character's history, motivations, and goals..."
            />
          </div>

          {/* Approval Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Awaiting GM Approval:</strong> After submitting, your character will be pending until the GM reviews and approves it. You'll be notified once it's approved!
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/worlds/${worldId}/characters`}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !formData.name}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Submit Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
