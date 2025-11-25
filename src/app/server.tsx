'use server';

import { auth } from '@/lib/auth';

// Simple default styles - preserving original design
const DEFAULT_TW_CLASSES = {
  LINK: "border-2 p-2 bg-[rgba(150,25,25,0.25)] text-white hover:bg-[rgba(150,25,25,0.5)] transition-colors",
  BUTTON: "border-2 p-2 bg-[rgba(200,100,50,0.25)] text-white hover:bg-[rgba(200,100,50,0.5)] transition-colors",
};

/**
 * Server action to fetch home page data
 * Can be imported and used by page.tsx
 */
export async function getHomePageData() {
  // Get session from Auth.js
  const session = await auth();

  // Return all data needed by client components
  return {
    session,
    config: {
      twClasses: DEFAULT_TW_CLASSES,
      isLoggedIn: !!session?.user,
      userData: session?.user || null
    }
  };
}
