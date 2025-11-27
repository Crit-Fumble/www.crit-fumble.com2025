import { redirect } from 'next/navigation'
import { auth, signIn } from '@/lib/auth'
import Image from 'next/image'

export default async function LoginPage() {
  const session = await auth()

  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="login-page">
      {/* Background Image */}
      <div className="absolute inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />

      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section with Logo */}
        <div className="flex-1 flex items-center justify-center py-20">
          {/* Large Centered Logo */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <Image
                src="/img/cfg-logo.jpg"
                alt="Crit Fumble Gaming Logo"
                width={400}
                height={400}
                className="drop-shadow-2xl rounded-full"
                priority
                data-testid="login-logo"
              />
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-w-4xl mx-auto w-full px-4 pb-20">
          {/* Purple Header */}
          <div className="bg-crit-purple-600 rounded-t-lg px-8 py-6">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white text-center">
              Crit Fumble Gaming
            </h1>
          </div>

          {/* Dark Content Area */}
          <div className="bg-slate-900 rounded-b-lg px-8 py-10">
            {/* Tagline */}
            <p className="text-xl text-gray-300 text-center italic mb-8">
              If the GM doesn&apos;t kill you, the dice will.
            </p>

            {/* Welcome Text */}
            <div className="text-gray-100 leading-relaxed space-y-4 mb-8">
              <p>
                Welcome to Crit Fumble Gaming! We&apos;re a VTTRPG group and have players with some of the worst luck and dumbest
                ideas. We started as an in-person group in the Midwest United States, but have moved our campaigns online and have
                since grown to include members all over the country. We play a few long-running campaigns, as well as plenty of one-shots
                and &quot;mini-campaigns&quot; that only last a few sessions.
              </p>
            </div>

            {/* Sign In Buttons */}
            <div className="space-y-4 max-w-md mx-auto">
              {/* Email Sign In - Stubbed for future implementation */}
              {/* <form
                action={async (formData: FormData) => {
                  'use server'
                  const email = formData.get('email')
                  await signIn('resend', { email, redirectTo: '/dashboard' })
                }}
                className="space-y-3"
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="px-4 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-crit-purple-500 focus:ring-2 focus:ring-crit-purple-500 focus:outline-none transition-colors"
                    data-testid="email-input"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-crit-purple-600 hover:bg-crit-purple-700 text-white rounded-lg font-semibold transition-colors"
                  data-testid="signin-email"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sign in with Email
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-gray-400">Or continue with</span>
                </div>
              </div> */}

              {/* Primary Sign-In: Discord Only */}
              <form
                action={async () => {
                  'use server'
                  await signIn('discord', { redirectTo: '/dashboard' })
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg font-semibold transition-colors"
                  data-testid="signin-discord"
                >
                  <svg className="w-5 h-5" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                  </svg>
                  Sign in with Discord
                </button>
              </form>

              {/* GitHub and Twitch - Removed from sign-in page */}
              {/* Users can link these in their profile settings */}
              {/* <form
                action={async () => {
                  'use server'
                  await signIn('github', { redirectTo: '/dashboard' })
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
                  data-testid="signin-github"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Sign in with GitHub
                </button>
              </form>

              <form
                action={async () => {
                  'use server'
                  await signIn('twitch', { redirectTo: '/dashboard' })
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#9146FF] hover:bg-[#7D3BDB] text-white rounded-lg font-semibold transition-colors"
                  data-testid="signin-twitch"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                  Sign in with Twitch
                </button>
              </form> */}

              {/* Battle.net - Commented out for now */}
              {/* <form
                action={async () => {
                  'use server'
                  await signIn('battlenet', { redirectTo: '/dashboard' })
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#00AEFF] hover:bg-[#0099DD] text-white rounded-lg font-semibold transition-colors"
                  data-testid="signin-battlenet"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.412 8.753C18.991 5.053 16.32 2.401 13 2l.058 1.942c2.467.425 4.421 2.382 4.843 4.85l1.511-.039zm-5.054 9.995c-.004.008-1.265 2.143-3.726 2.903l.485 1.886c3.404-.875 5.24-3.671 5.24-3.671l-1.999-1.118zM11.56 2C8.24 2.4 5.57 5.053 5.15 8.753l1.51.039c.423-2.468 2.377-4.425 4.844-4.85L11.56 2zm-6.398 8.96l-1.511-.04C3.651 11.32 2 13.12 2 16.32v1.68h2v-1.68c0-2.25 1.152-3.572 1.162-3.587l-.004-.004.004.008 1.266-1.765-.266-.012zm9.878 5.796c-.54-.012-1.08-.164-1.566-.456l-2.055 1.15c.827.497 1.76.734 2.688.744.93-.01 1.864-.251 2.692-.75l-2.053-1.15c-.482.29-1.024.442-1.563.462h-.143zm-.84-4.623c-.003-.005-1.167-1.947-3.678-2.677l-.47 1.889c1.863.464 2.896 1.673 2.902 1.68l2.04-1.144-.005-.011-.788-.737zM6.963 11.133c-.485.737-.743 1.597-.743 2.487 0 .89.258 1.75.743 2.487l1.697-1.056c-.275-.432-.42-.932-.42-1.431s.145-.997.42-1.431L6.963 11.133zm10.074 4.974c.485-.737.743-1.597.743-2.487 0-.89-.258-1.75-.743-2.487l-1.697 1.056c.275.432.42.932.42 1.431s-.145.997-.42 1.431l1.697 1.056zm.795-5.38l1.511.04c0 0 1.651-1.8 1.651-5 0-.56-.055-1.121-.156-1.68h-2.014c.1.56.155 1.12.155 1.68 0 2.25-1.151 3.572-1.161 3.587l.004.004-.004-.008 1.266 1.765.266.012-.518.6z"/>
                  </svg>
                  Sign in with Battle.net
                </button>
              </form> */}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="w-full bg-crit-purple-600 py-4 px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <a
              href="https://discord.gg/your-server"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
              aria-label="Join our Discord server"
              data-testid="discord-server-link"
            >
              <svg className="w-8 h-8" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
