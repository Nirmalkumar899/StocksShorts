export default function About() {
  return (
    <div className="min-h-screen bg-white text-gray-900 max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button onClick={() => window.history.back()} className="text-blue-600 text-sm mb-4 block">← Back</button>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">About StocksShorts</h1>
      </div>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
        <section>
          <p className="text-base text-gray-800">StocksShorts is India's fastest-growing stock market news app — built for traders and investors who want quick, clear, and reliable market updates without the noise.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">What We Do</h2>
          <p>We aggregate and summarise the most important financial news from trusted Indian sources like Economic Times, LiveMint, BSE India, NSE India, and more — and present it in a clean, easy-to-read format inspired by Inshorts.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">Our Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Real-time news</strong> — Updated every 10 minutes from top Indian financial sources</li>
            <li><strong>Hindi translation</strong> — Read any article in Hindi with one tap</li>
            <li><strong>Breakout Stocks</strong> — Daily alerts on stocks making technical breakouts</li>
            <li><strong>IPO Updates</strong> — Latest IPO subscriptions, GMP, allotment status</li>
            <li><strong>Research Reports</strong> — Brokerage recommendations and analyst views</li>
            <li><strong>StocksShorts Special</strong> — Curated high-quality market insights</li>
            <li><strong>F&O Analysis</strong> — Options and futures data for traders</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">Our Mission</h2>
          <p>To make Indian stock market information accessible, concise, and actionable for every investor — from beginners to seasoned traders.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">Disclaimer</h2>
          <p>StocksShorts is a news aggregation platform only. None of our content constitutes investment advice. Please consult a SEBI-registered financial advisor before making any investment decisions.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 text-base mb-2">Follow Us</h2>
          <div className="space-y-2">
            <a href="https://youtube.com/@stocksshortss" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-600 font-medium">
              YouTube — youtube.com/@stocksshortss
            </a>
            <a href="https://instagram.com/stocksshorts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 font-medium">
              Instagram — @stocksshorts
            </a>
            <a href="https://wa.me/917738621246" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-medium">
              WhatsApp — +91 77386 21246
            </a>
          </div>
        </section>

        <section className="border-t pt-4 mt-6">
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
          </div>
        </section>
      </div>
    </div>
  );
}
