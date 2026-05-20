import Image from 'next/image'
import { CoreStatusButton } from './CoreStatusButton'

// ReSesh "Add to Server" install link. Built from prod App ID + the minimum
// permissions a voice-channel recording bot needs (View Channel, Connect,
// Speak, Use Voice Activity, Send Messages). The permission integer encodes
// those bits — if scopes change, regenerate it in the Discord Developer
// Portal → Installation → Install Link and paste here.
const RESESH_INSTALL_URL =
  'https://discord.com/oauth2/authorize?client_id=1504164101553656028&scope=bot+applications.commands&permissions=3147776'

const DISCORD_INVITE_URL = 'https://discord.gg/D6vVANEJ3w'
const GITHUB_ORG_URL = 'https://github.com/Crit-Fumble'

// Core wallet + pricing surfaces. Subscribe lands on the public /pricing
// comparison page so visitors can see tiers before signing in; the coin
// store is the in-Core wallet, which handles top-ups via Stripe.
const CORE_PRICING_URL = 'https://core.crit-fumble.com/pricing'
const CORE_WALLET_URL = 'https://core.crit-fumble.com/apps/settings/wallet'

// Digital Ocean affiliate link — referral code embedded. Badge image is
// served from DO's own CDN so it tracks correctly for the affiliate program.
const DO_AFFILIATE_URL = 'https://www.digitalocean.com/?refcode=703d70c9a97c'
const DO_BADGE_URL = 'https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg'

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="home-page">
      {/* Fixed-to-viewport background — content scrolls over a locked
          dice image instead of stretching it to the full page height. */}
      <div className="fixed inset-0 bg-dice-hero bg-cover bg-center bg-no-repeat" />
      <div className="fixed inset-0 bg-black/30" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero logo */}
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="relative">
            <Image
              src="/img/cfg-logo.jpg"
              alt="Crit Fumble Gaming Logo"
              width={400}
              height={400}
              className="drop-shadow-2xl rounded-full"
              priority
              data-testid="home-logo"
            />
          </div>
        </div>

        {/* Hero title + tagline + welcome copy (preserved from original site) */}
        <div className="max-w-4xl mx-auto w-full px-4 pb-12">
          <div className="bg-crit-purple-600 rounded-t-lg px-8 py-6">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white text-center">
              Crit Fumble Gaming
            </h1>
          </div>
          <div className="bg-slate-900 rounded-b-lg px-8 py-10">
            <p className="text-xl text-gray-300 text-center italic mb-8">
              If the GM doesn&apos;t kill you, the dice will.
            </p>
            <div className="text-gray-100 leading-relaxed">
              <p>
                Welcome to Crit Fumble Gaming! We&apos;re a VTTRPG group and have players with some of the worst
                luck and dumbest ideas. We started as an in-person group in the Midwest United States, but have
                moved our campaigns online and have since grown to include members all over the country. We play a
                few long-running campaigns, as well as plenty of one-shots and &quot;mini-campaigns&quot; that only
                last a few sessions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Discord ──────────────────────────────────────────────────
            Comes before Core because Discord membership is the gate to
            Core access — visitors should join here first, then enter Core,
            then optionally add ReSesh. Same natural setup flow they'd
            take anyway. */}
        <section className="max-w-4xl mx-auto w-full px-4 pb-12" aria-labelledby="discord-heading">
          <div className="bg-discord rounded-t-lg px-8 py-6 flex items-center justify-center gap-3">
            <svg className="w-10 h-10 text-white" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
            </svg>
            <h2 id="discord-heading" className="text-3xl font-display font-bold text-white text-center">
              Join our Discord
            </h2>
          </div>
          <div className="bg-slate-900 rounded-b-lg px-8 py-10">
            <p className="text-lg text-gray-200 text-center mb-4">
              Start here — Discord is where we moderate our community.
            </p>
            <p className="text-gray-100 max-w-2xl mx-auto text-center mb-8 leading-relaxed">
              Our Discord server is the gate to CFG Core, ReSesh, and everything else. Answer a 
              few questions, agree to the server guidelines, then you'll gain access to the rest of the server, CFG Core Server Hosting, and the ReSesh Bot.
            </p>

            <div className="text-center">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-discord hover:bg-discord-dark px-10 py-4 transition-colors"
              >
                <span className="text-xl md:text-2xl font-display font-bold text-white">
                  Join our Discord
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ── Core + ReSesh ───────────────────────────────────────────
            Paired in a 2-up grid on desktop: Core (hosting) on the left,
            ReSesh (the marquee app running on Core) on the right.
            Stacks on mobile. Both cards stretch to equal height via
            `flex-col` + `flex-1` on the body so their CTAs and trailing
            badges align across the row. */}
        <div className="max-w-5xl mx-auto w-full px-4 pb-12">
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ReSesh */}
            <section className="flex flex-col" aria-labelledby="resesh-heading">
              <div className="bg-crit-purple-600 rounded-t-lg px-6 py-6 flex items-center justify-center gap-4">
                <Image
                  src="/img/resesh.png"
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg shrink-0"
                />
                <h2 id="resesh-heading" className="text-3xl font-display font-bold text-white text-center">
                  ReSesh
                </h2>
              </div>
              <div className="bg-slate-900 rounded-b-lg px-6 py-8 flex-1 flex flex-col">
                <p className="text-lg text-gray-200 text-center mb-6">
                  Discord session recording with searchable transcripts.
                </p>
                <p className="text-gray-100 text-center mb-6 leading-relaxed flex-1">
                  Run a recording bot in your voice channel and get a searchable transcript posted live as you play. 
                  Recordings and transcripts stay yours — runs on DisRecord server powered by our CFG Core infrastructure. 
                  ReSesh is free to try with your Core subscription — no separate fee, just the Compute Tokens it uses to run.
                </p>

                <div className="flex justify-center">
                  <a
                    href="https://deepgram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Transcription powered by Deepgram"
                  >
                    <Image
                      src="/img/powered-by-deepgram.svg"
                      alt="Powered by Deepgram"
                      width={160}
                      height={32}
                      unoptimized
                    />
                  </a>
                </div>

                <div className="text-center mt-6">
                  <a
                    href={RESESH_INSTALL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-crit-purple-600 hover:bg-crit-purple-700 border-2 border-crit-purple-400 px-8 py-4 transition-colors"
                  >
                    <span className="text-lg md:text-xl font-display font-bold text-white">
                      Add ReSesh to your server
                    </span>
                  </a>
                </div>
              </div>
            </section>
            
            {/* Core */}
            {/* CFG Core */}
            <section className="flex flex-col" aria-labelledby="core-heading">
              <div className="bg-crit-purple-600 rounded-t-lg px-6 py-6">
                <h2 id="core-heading" className="text-3xl font-display font-bold text-white text-center">
                  CFG Core
                </h2>
              </div>
              <div className="bg-slate-900 rounded-b-lg px-6 py-8 flex-1 flex flex-col">
                <p className="text-lg text-gray-200 text-center mb-6">
                  Cloud-hosted gaming and community servers, on-demand
                </p>

                <ul className="space-y-4 text-gray-100 mb-6">
                  <li className="flex gap-3">
                    <span className="text-crit-purple-400 font-bold" aria-hidden>→</span>
                    <span>
                      <strong className="text-white">Your tools, your data.</strong> No ads, no data sales.
                    </span>
                  </li>
                  {/* <li className="flex gap-3">
                    <span className="text-crit-purple-400 font-bold" aria-hidden>→</span>
                    <span>
                      Built-in <strong className="text-white">Fermi</strong> chat with community <strong className="text-white">Spacebar</strong> server. Voice support coming soon.
                    </span>
                  </li> */}
                  <li className="flex gap-3">
                    <span className="text-crit-purple-400 font-bold" aria-hidden>→</span>
                    <span>
                      Track your balances and gain early access to the CFG Core Platform.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-crit-purple-400 font-bold" aria-hidden>→</span>
                    <span>
                      <strong className="text-white">FoundryVTT</strong> hosting in Beta now, more coming Fall 2026.
                    </span>
                  </li>
                </ul>

                {/* Hostable game-server kinds. Add new icons here as more
                    kinds land in Core's Server Manager (Phase-0: Foundry +
                    Spacebar). `flex-1` pushes the CTA cluster to the
                    bottom so it lines up with ReSesh's CTA. */}
                <div className="flex flex-col items-center gap-3 mb-6 flex-1">
                  <ul className="flex items-center justify-center gap-6">
                    <li className="flex flex-col items-center gap-1">
                      <Image
                        src="/img/fermi.svg"
                        alt="Fermi"
                        width={48}
                        height={48}
                        className="rounded-lg bg-slate-600 p-1"
                      />
                    </li>
                    <li className="flex flex-col items-center gap-1">
                      <Image
                        src="/img/spacebar.png"
                        alt="Spacebar"
                        width={48}
                        height={48}
                        className="rounded-lg bg-slate-600 p-1"
                      />
                    </li>
                    <li className="flex flex-col items-center gap-1">
                      <Image
                        src="/img/fvtt-d20.png"
                        alt="FoundryVTT"
                        width={48}
                        height={48}
                        className="rounded-lg bg-slate-600 p-1"
                      />
                    </li>
                  </ul>
                </div>

                {/* DigitalOcean affiliate attribution — Core runs on DO, so
                    the badge belongs alongside the Core CTA rather than in
                    the generic site footer. */}
                <div className="flex justify-center">
                  <a
                    href={DO_AFFILIATE_URL}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    aria-label="Powered by DigitalOcean"
                    className="inline-block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DO_BADGE_URL}
                      alt="Powered by DigitalOcean"
                      height={36}
                      style={{ height: 36, width: 'auto' }}
                    />
                  </a>
                </div>

                <div className="text-center mt-6">
                  <CoreStatusButton />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Economy (CT / CC / SC) ─────────────────────────────────
            Three currencies, three CTAs, one row. ReSesh + Core both
            spend Compute Tokens, which come from either a subscription
            grant (left card) or a Crit-Coin top-up (middle card).
            Story Credit is the creator-earnings side: tips, asset-pack
            sales, etc. — convertible to CC, cashable to USD via Stripe
            Connect (Premium+ tier). No technical explainer text by
            design — interested users ask in Discord. */}
        <section className="max-w-5xl mx-auto w-full px-4 pb-12" aria-labelledby="economy-heading">
          <h2 id="economy-heading" className="sr-only">Crit-Fumble economy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Compute Tokens */}
            <div className="flex flex-col">
              <div className="bg-crit-purple-600 rounded-t-lg px-6 py-5 flex items-center justify-center gap-3">
                <svg
                  className="w-9 h-9 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="8" y="8" width="8" height="8" rx="1" />
                  <path d="M9 1.5v2.5M12 1.5v2.5M15 1.5v2.5M9 20v2.5M12 20v2.5M15 20v2.5M1.5 9h2.5M1.5 12h2.5M1.5 15h2.5M20 9h2.5M20 12h2.5M20 15h2.5" />
                </svg>
                <h3 className="text-xl font-display font-bold text-white">Compute Tokens</h3>
              </div>
              <div className="bg-slate-900 rounded-b-lg px-6 py-6 flex-1 flex flex-col">
                <p className="text-gray-100 leading-relaxed mb-6 flex-1">
                  These power ReSesh recording and transcription, as well as Server Hosting.  
                  Free/Basic members get 2,500 CT monthly for free to try things out. 
                  Paid plans include a higher monthly grant. 
                </p>
                <a
                  href={CORE_PRICING_URL}
                  className="inline-flex items-center justify-center rounded-xl bg-crit-purple-600 hover:bg-crit-purple-700 border-2 border-crit-purple-400 px-6 py-3 transition-colors w-full"
                >
                  <span className="text-base font-display font-bold text-white">Subscribe Now</span>
                </a>
              </div>
            </div>

            {/* Crit-Coins */}
            <div className="flex flex-col">
              <div className="bg-crit-purple-600 rounded-t-lg px-6 py-5 flex items-center justify-center gap-3">
                <Image src="/img/crit-coin.png" alt="" width={36} height={36} className="shrink-0" />
                <h3 className="text-xl font-display font-bold text-white">Crit-Coins</h3>
              </div>
              <div className="bg-slate-900 rounded-b-lg px-6 py-6 flex-1 flex flex-col">
                <p className="text-gray-100 leading-relaxed mb-6 flex-1">
                  Tip GMs and top up Compute Tokens if your monthly grant runs out. 
                  1 CC = 10,000 CT.
                </p>
                <a
                  href={CORE_WALLET_URL}
                  className="inline-flex items-center justify-center rounded-xl bg-crit-purple-600 hover:bg-crit-purple-700 border-2 border-crit-purple-400 px-6 py-3 transition-colors w-full"
                >
                  <span className="text-base font-display font-bold text-white">Buy Crit-Coins</span>
                </a>
              </div>
            </div>

            {/* Story Credit — confirmed in source:
                workspaces/cfg-core-browser/src/views/components/molecules/StoryCreditActions.tsx
                — SC is earned (tips, asset-pack sales, creator activity).
                Conversion SC → CC is always available. Cash-out SC → USD
                requires Stripe Connect onboarding (Premium+ tier). The
                "Set up payouts" CTA lands on the wallet page where the
                Stripe Connect onboarding button lives. */}
            <div className="flex flex-col">
              <div className="bg-crit-purple-600 rounded-t-lg px-6 py-5 flex items-center justify-center gap-3">
                <svg
                  className="w-9 h-9 text-white shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" />
                  <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
                </svg>
                <h3 className="text-xl font-display font-bold text-white">Story Credit</h3>
              </div>
              <div className="bg-slate-900 rounded-b-lg px-6 py-6 flex-1 flex flex-col">
                <p className="text-gray-100 leading-relaxed mb-6 flex-1">
                  Earned from tips and creator activity.  
                  1 CC = $0.25 USD when tipped to a creator as Story Credit. 
                  Spend it on Crit-Coins, or cash out via Stripe Connect.
                </p>
                {/* <a
                  href={CORE_WALLET_URL}
                  className="inline-flex items-center justify-center rounded-xl bg-crit-purple-600 hover:bg-crit-purple-700 border-2 border-crit-purple-400 px-6 py-3 transition-colors w-full"
                >
                  <span className="text-base font-display font-bold text-white">See Balance</span>
                </a> */}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-crit-purple-600 py-6 px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
                aria-label="Join our Discord server"
                data-testid="discord-server-link"
              >
                <svg className="w-7 h-7" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                </svg>
              </a>
              <a
                href={GITHUB_ORG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Crit Fumble on GitHub"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>

            <p className="text-xs text-white/70">© Crit Fumble Gaming, LLC</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
