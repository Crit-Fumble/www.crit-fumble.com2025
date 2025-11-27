'use client'

export default function TestIframePage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h1 className="text-2xl font-bold text-white mb-2">
            Discord Activity iframe Test
          </h1>
          <p className="text-gray-400">
            This page simulates how the Discord activity will be embedded in Discord's interface.
          </p>
        </div>

        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-4">
            Embedded Activity Preview
          </h2>
          <div className="border-4 border-purple-500/30 rounded-lg overflow-hidden">
            <iframe
              src="/discord-activity"
              className="w-full h-[800px] border-0"
              title="Discord Activity Test"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-3">
            Test Information
          </h2>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span className="font-medium">iframe Source:</span>
              <code className="bg-slate-800 px-2 py-1 rounded">/discord-activity</code>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="font-medium">Sandbox Permissions:</span>
              <code className="bg-slate-800 px-2 py-1 rounded text-xs">
                allow-same-origin allow-scripts allow-forms
              </code>
            </div>
            <div className="flex justify-between text-gray-300">
              <span className="font-medium">Expected Behavior:</span>
              <span>Should load and display activity content</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
