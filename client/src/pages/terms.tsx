export default function Terms() {
  return (
    <div className="min-h-screen bg-white text-gray-900 max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => window.history.back()} className="text-blue-600 text-sm mb-4 block">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-sm text-gray-500">Last updated: March 2026</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using the StocksShorts app or website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">2. About Our Service</h2>
          <p>StocksShorts is a news aggregation platform that provides summarised financial news, IPO updates, stock breakout alerts, and market analysis related to the Indian stock market. We aggregate content from public sources including Economic Times, LiveMint, BSE India, NSE India, and others.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">3. Not Investment Advice</h2>
          <p className="font-semibold text-red-700">IMPORTANT: None of the content on StocksShorts constitutes financial or investment advice. All articles, analysis, and information are for informational and educational purposes only.</p>
          <p className="mt-2">StocksShorts is not a SEBI-registered investment advisor. You should not make any investment decisions based solely on content from this app. Always consult a qualified SEBI-registered financial advisor before investing.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">4. Content & Copyright</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>News content is aggregated from public sources and credited to original publishers</li>
            <li>StocksShorts summaries and analysis are our original content</li>
            <li>You may not copy, reproduce, or redistribute our content without permission</li>
            <li>We respect intellectual property rights and will respond to valid copyright notices</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">5. User Conduct</h2>
          <p className="mb-2">By using StocksShorts, you agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the app for any unlawful purpose</li>
            <li>Attempt to scrape, copy, or systematically download our content</li>
            <li>Interfere with or disrupt the service</li>
            <li>Share misleading or false information claiming it is from StocksShorts</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">6. Accuracy of Information</h2>
          <p>While we strive to provide accurate and timely information, we do not guarantee the completeness, accuracy, or timeliness of any content. Stock market data and news can change rapidly. Always verify information with official sources (NSE, BSE, SEBI) before acting on it.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">7. Third-Party Links</h2>
          <p>Our app contains links to external news sources. We are not responsible for the content, privacy practices, or accuracy of third-party websites. Clicking external links takes you away from StocksShorts and you do so at your own risk.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">8. Limitation of Liability</h2>
          <p>StocksShorts shall not be liable for any financial losses, damages, or investment decisions made based on content from our platform. Use of this app is entirely at your own risk.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">9. Service Availability</h2>
          <p>We aim to keep the service available at all times but do not guarantee uninterrupted access. We may modify, suspend, or discontinue the service at any time without notice.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">10. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">11. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. The updated date will be shown at the top. Continued use of the app after changes means you accept the updated terms.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">12. Contact</h2>
          <div className="space-y-1">
            <p><strong>WhatsApp:</strong> +91 77386 21246</p>
            <p><strong>Instagram:</strong> @stocksshorts</p>
            <p><strong>YouTube:</strong> youtube.com/@stocksshortss</p>
          </div>
        </section>
      </div>
    </div>
  );
}
