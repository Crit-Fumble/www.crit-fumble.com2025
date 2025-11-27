import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Crit-Fumble',
  description: 'Privacy Policy for Crit-Fumble virtual tabletop platform',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-invert max-w-none space-y-6">
        <section>
          <p className="text-sm text-gray-400 mb-4">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
          <p className="text-gray-300 mb-4">
            When you use Crit-Fumble, we collect the following types of information:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li><strong>Account Information:</strong> Email address, username, and authentication credentials</li>
            <li><strong>Discord Information:</strong> Discord user ID, username, and server information when you use Discord Activities</li>
            <li><strong>Usage Data:</strong> Campaign data, character sheets, world-building content you create</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p className="text-gray-300 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Provide and maintain the Crit-Fumble service</li>
            <li>Enable Discord Activity features and integration</li>
            <li>Authenticate your account and prevent fraud</li>
            <li>Store and sync your campaigns, characters, and world-building content</li>
            <li>Improve our services and develop new features</li>
            <li>Send you service-related announcements and updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>
          <p className="text-gray-300 mb-4">
            Your data is stored securely using industry-standard encryption and security practices:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Account and payment data is stored with Neon (PostgreSQL)</li>
            <li>Campaign and RPG data is stored on secure DigitalOcean infrastructure</li>
            <li>All data transmission uses HTTPS encryption</li>
            <li>We implement appropriate technical and organizational measures to protect your data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
          <p className="text-gray-300 mb-4">
            Crit-Fumble integrates with the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li><strong>Discord:</strong> For Activities and bot features</li>
            <li><strong>Auth.js:</strong> For authentication</li>
            <li><strong>Vercel:</strong> For hosting and deployment</li>
          </ul>
          <p className="text-gray-300 mt-4">
            Each service has its own privacy policy governing how they handle your data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
          <p className="text-gray-300 mb-4">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations or valid legal requests</li>
            <li>To protect our rights, privacy, safety, or property</li>
            <li>With service providers who assist in operating our platform (under strict confidentiality)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="text-gray-300 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Access, update, or delete your personal information</li>
            <li>Export your campaign and character data</li>
            <li>Opt out of non-essential communications</li>
            <li>Request deletion of your account and associated data</li>
          </ul>
          <p className="text-gray-300 mt-4">
            To exercise these rights, please contact us through your account settings or email support.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p className="text-gray-300 mb-4">
            We use cookies and similar tracking technologies to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Maintain your login session</li>
            <li>Remember your preferences</li>
            <li>Analyze usage patterns and improve our service</li>
          </ul>
          <p className="text-gray-300 mt-4">
            You can control cookies through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
          <p className="text-gray-300">
            Crit-Fumble is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-gray-300">
            If you have questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p className="text-gray-300 mt-4">
            Email: privacy@crit-fumble.com
          </p>
        </section>
      </div>
    </div>
  )
}
