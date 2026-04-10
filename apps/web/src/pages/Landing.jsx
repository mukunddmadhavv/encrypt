import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🔗',
    title: 'Link with a Code',
    desc: 'No QR scanning. Enter your number, get a pairing code, link from WhatsApp settings in seconds.',
  },
  {
    icon: '🧠',
    title: 'AI Message Filter',
    desc: 'Write your condition in plain English. Our LLM reads every message and pings you only when it matters.',
  },
  {
    icon: '🔒',
    title: 'Zero Message Storage',
    desc: 'Messages are evaluated in-memory only. Nothing is ever written to a database. Your chats stay private.',
  },
  {
    icon: '📲',
    title: 'Notified on Your Number',
    desc: 'Alerts are sent from your own WhatsApp number to yourself — no third-party bots in your chats.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col page-enter bg-gray-50 bg-grid-pattern relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-parrot-500 tracking-tight">Encrypt</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3">Sign in</Link>
            <Link
              to="/register"
              className="bg-parrot-500 hover:bg-parrot-600 text-white font-medium rounded-full text-sm transition-colors shadow-sm"
              style={{ width: 'auto', padding: '0.4rem 1.25rem' }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 relative z-10">
        <section className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 mb-8 text-sm text-gray-600 border border-gray-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-parrot-500" />
            Powered by OpenRouter LLM
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            WhatsApp alerts,<br />
            <span className="text-parrot-500">only when they matter.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Connect your WhatsApp, set a condition in plain English, and let AI
            filter the noise — notifying you only when something important happens.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gray-900 hover:bg-gray-800 text-white text-base font-medium rounded-lg shadow-sm transition-colors"
              style={{ width: 'auto', padding: '0.875rem 2.5rem' }}
            >
              Start for free
            </Link>
            <Link to="/login" className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-base font-medium rounded-lg shadow-sm transition-colors px-8 py-3">
              Sign in
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:border-parrot-300 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-6 pb-32 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">How it works</h2>
          <p className="text-gray-500 mb-12 text-base">Three simple steps, done in under a minute.</p>
          <div className="flex flex-col sm:flex-row gap-6 items-stretch">
            {[
              { n: '01', t: 'Link WhatsApp', d: 'Enter your phone number, get a code, paste it in WhatsApp.' },
              { n: '02', t: 'Set your condition', d: 'Write in plain English when you want to be notified.' },
              { n: '03', t: 'Relax', d: 'AI reads every message silently. You only hear when it matters.' },
            ].map((s) => (
              <div key={s.n} className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 text-left shadow-sm">
                <span className="text-xs font-bold font-mono text-parrot-600 bg-parrot-50 px-2 py-1 rounded inline-block mb-3">{s.n}</span>
                <h3 className="text-base font-bold text-gray-900 mb-2">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm font-medium text-gray-400">
        Built with Baileys · OpenRouter · Supabase · Render
      </footer>
    </div>
  );
}
