export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900 max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => window.history.back()} className="text-blue-600 text-sm mb-4 block">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-sm text-gray-500">Last updated: March 2026</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">1. About StocksShorts</h2>
          <p>StocksShorts ("we", "our", "us") is an Indian stock market news aggregation platform. We provide concise financial news, IPO updates, breakout stock alerts, and market analysis for Indian investors and traders.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">2. Information We Collect</h2>
          <p className="mb-2">We collect minimal information to provide our service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Usage data:</strong> Pages visited, articles read, time spent on the app (via Google Analytics)</li>
            <li><strong>Device information:</strong> Device type, operating system, browser type (anonymised)</li>
            <li><strong>Log data:</strong> IP address, access times (standard server logs)</li>
            <li><strong>Preferences:</strong> Language preference (English/Hindi) stored locally on your device</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">3. Information We Do NOT Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not collect your name, email address, or phone number unless you voluntarily contact us</li>
            <li>We do not collect financial data, bank details, or investment portfolio information</li>
            <li>We do not require account registration to read news</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">4. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To deliver and improve news content</li>
            <li>To understand which articles and categories are most useful</li>
            <li>To fix bugs and improve app performance</li>
            <li>To analyse app usage trends (using anonymised data only)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">5. Third-Party Services</h2>
          <p className="mb-2">We use the following third-party services:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Google Analytics:</strong> For anonymous usage tracking. <a href="https://policies.google.com/privacy" className="text-blue-600">Google Privacy Policy</a></li>
            <li><strong>OpenAI:</strong> For Hindi translation of articles. Article content is processed but not stored by OpenAI after translation.</li>
            <li><strong>News Sources:</strong> Economic Times, LiveMint, BSE India, and other public financial news sources</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">6. Cookies & Local Storage</h2>
          <p>We use browser local storage to remember your language preference and which articles you have read. No personal information is stored in cookies. You can clear this at any time through your browser or app settings.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">7. Data Security</h2>
          <p>We take reasonable steps to protect any data we collect. We do not sell, rent, or trade your information to any third parties.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">8. Children's Privacy</h2>
          <p>StocksShorts is intended for users aged 18 and above (or the age of majority in their jurisdiction). We do not knowingly collect information from children.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">9. Investment Disclaimer</h2>
          <p>None of the articles or content on StocksShorts constitutes investment advice. All content is for informational and educational purposes only. Please consult a SEBI-registered financial advisor before making any investment decisions.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. The updated date will be reflected at the top of this page. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">11. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, contact us:</p>
          <div className="mt-2 space-y-1">
            <p><strong>WhatsApp:</strong> +91 77386 21246</p>
            <p><strong>Instagram:</strong> @stocksshorts</p>
            <p><strong>YouTube:</strong> youtube.com/@stocksshortss</p>
          </div>
        </section>
      </div>
    </div>
  );
}
