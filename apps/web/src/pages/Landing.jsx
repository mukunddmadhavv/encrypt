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
    <div className="min-h-screen flex flex-col page-enter">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔔</span>
            <span className="font-bold text-white tracking-tight">
              Smart<span className="gradient-text">Notifier</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign in</Link>
            <Link
              to="/register"
              className="btn-primary text-sm"
              style={{ width: 'auto', padding: '0.5rem 1.25rem' }}
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 text-sm text-brand-300 border border-brand-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
            Powered by OpenRouter LLM
          </div>

          <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            WhatsApp alerts,{' '}
            <span className="gradient-text">only when<br />they matter</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Connect your WhatsApp, set a condition in plain English, and let AI
            filter the noise — notifying you only when something important happens.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="btn-primary text-base"
              style={{ width: 'auto', padding: '0.875rem 2.5rem' }}
            >
              Start for free →
            </Link>
            <Link to="/login" className="btn-secondary text-sm px-8 py-3">
              Sign in
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass glass-hover rounded-2xl p-6">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-base font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-6 pb-28 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
          <p className="text-zinc-500 mb-10 text-sm">Three steps, done in under a minute</p>
          <div className="flex flex-col sm:flex-row gap-6 items-stretch">
            {[
              { n: '01', t: 'Link WhatsApp', d: 'Enter your phone number, get a code, paste it in WhatsApp.' },
              { n: '02', t: 'Set your condition', d: 'Write in plain English when you want to be notified.' },
              { n: '03', t: 'Relax', d: 'AI reads every message silently. You only hear when it matters.' },
            ].map((s) => (
              <div key={s.n} className="flex-1 glass rounded-2xl p-6 text-left">
                <span className="text-xs font-mono text-brand-500 font-bold">{s.n}</span>
                <h3 className="text-sm font-semibold text-white mt-2 mb-1">{s.t}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-600">
        Built with Baileys · OpenRouter · Supabase · Render · Vercel
      </footer>
    </div>
  );
}
