import { ReactNode } from 'react'
import { Header } from '../organisms/Header'

interface PageLayoutProps {
  children: ReactNode
  title: string
  description: string
  critCoinBalance?: number
  headerColor?: string
}

export function PageLayout({
  children,
  title,
  description,
  critCoinBalance,
  headerColor = 'bg-crit-purple-600',
}: PageLayoutProps) {
  return (
    <>
      <Header critCoinBalance={critCoinBalance} />
      <div className="min-h-screen relative overflow-hidden overflow-x-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Page Header */}
            <div className="mb-8">
              <div className={`${headerColor} rounded-t-lg px-4 sm:px-8 py-4 sm:py-6`}>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white break-words">
                  {title}
                </h1>
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-b-lg px-4 sm:px-8 py-3 sm:py-4">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {description}
                </p>
              </div>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
