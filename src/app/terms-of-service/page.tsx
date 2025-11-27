import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Crit-Fumble',
  description: 'Terms of Service for Crit-Fumble virtual tabletop platform',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-invert max-w-none space-y-6">
        <section>
          <p className="text-sm text-gray-400 mb-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-300">
            By accessing or using Crit-Fumble ("the Service"), you agree to be bound by these Terms of Service ("Terms").
            If you do not agree to these Terms, you may not access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-300 mb-4">
            Crit-Fumble is a virtual tabletop platform that provides:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Campaign management and world-building tools</li>
            <li>Character sheet creation and tracking</li>
            <li>Discord Activities for voice channel integration</li>
            <li>Multiverse and universe management</li>
            <li>Integration with RPG systems and tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
          <p className="text-gray-300 mb-4">
            To use certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and update your account information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <h3 className="text-xl font-semibold mb-3">4.1 Your Content</h3>
          <p className="text-gray-300 mb-4">
            You retain ownership of all content you create on Crit-Fumble, including campaigns, characters, worlds, and other creative works ("User Content").
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 License Grant</h3>
          <p className="text-gray-300 mb-4">
            By posting User Content, you grant Crit-Fumble a worldwide, non-exclusive, royalty-free license to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Store, display, and transmit your User Content</li>
            <li>Enable sharing features you choose to use</li>
            <li>Create backups and ensure service functionality</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">4.3 Content Responsibilities</h3>
          <p className="text-gray-300 mb-4">
            You are solely responsible for your User Content. You agree not to post content that:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Violates any third-party rights (copyright, trademark, privacy, etc.)</li>
            <li>Contains malicious code or viruses</li>
            <li>Is illegal, harmful, threatening, abusive, or harassing</li>
            <li>Promotes illegal activities or violates any laws</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Discord Integration</h2>
          <p className="text-gray-300 mb-4">
            When using Crit-Fumble's Discord Activities:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>You must comply with Discord's Terms of Service and Community Guidelines</li>
            <li>We may access basic Discord user information for authentication</li>
            <li>Activity features require Discord voice channel access</li>
            <li>We are not responsible for Discord service availability or changes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
          <p className="text-gray-300 mb-4">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Use automated scripts or bots to access the Service</li>
            <li>Impersonate any person or entity</li>
            <li>Collect or harvest personal information of other users</li>
            <li>Reverse engineer or attempt to extract source code</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
          <p className="text-gray-300 mb-4">
            The Service and its original content (excluding User Content), features, and functionality are owned by Crit-Fumble and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
          <p className="text-gray-300">
            Third-party RPG systems, game rules, and trademarks remain the property of their respective owners.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Payment and Subscriptions</h2>
          <p className="text-gray-300 mb-4">
            Certain features may require payment. By subscribing to a paid plan:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>You agree to pay all applicable fees</li>
            <li>Subscriptions automatically renew unless cancelled</li>
            <li>Refunds are provided at our discretion</li>
            <li>We may change pricing with 30 days' notice</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p className="text-gray-300 mb-4">
            We may terminate or suspend your account and access to the Service:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>For violation of these Terms</li>
            <li>If required by law or legal request</li>
            <li>If your account has been inactive for an extended period</li>
          </ul>
          <p className="text-gray-300 mt-4">
            You may terminate your account at any time through your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Disclaimer of Warranties</h2>
          <p className="text-gray-300">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
          <p className="text-gray-300">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRIT-FUMBLE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Data and Privacy</h2>
          <p className="text-gray-300">
            Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect,
            use, and protect your information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
          <p className="text-gray-300">
            We reserve the right to modify these Terms at any time. We will notify users of material changes by posting the new Terms
            and updating the "Last Updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
          <p className="text-gray-300">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Crit-Fumble operates,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
          <p className="text-gray-300">
            If you have questions about these Terms, please contact us at:
          </p>
          <p className="text-gray-300 mt-4">
            Email: legal@crit-fumble.com
          </p>
        </section>
      </div>
    </div>
  )
}
