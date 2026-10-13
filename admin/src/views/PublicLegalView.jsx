import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Shield,
  FileText,
  Lock,
  Mail,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Scale
} from 'lucide-react';

const LAST_UPDATED = 'October 13, 2026';
const APP_NAME = 'GameLoot';
const COMPANY_NAME = 'GameLoot Interactive';
const CONTACT_EMAIL = 'support@gameloot.app';
const PRIVACY_EMAIL = 'privacy@gameloot.app';

const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction',
    content: `Welcome to ${APP_NAME} ("we", "our", or "us"). We are committed to protecting your personal privacy while providing a fun and rewarding play-to-earn HTML5 mobile gaming platform. This Privacy Policy details the types of information we collect when you download, install, or use the ${APP_NAME} mobile application and website, how we use, share, and protect that information, and your rights regarding your personal data.`
  },
  {
    id: 'data-collected',
    title: '2. Information We Collect',
    content: `We collect information necessary to operate our loyalty reward platform, enforce fair play anti-cheat standards, and process legitimate reward redemptions:`,
    subsections: [
      {
        title: 'A. Account Information You Provide',
        content: `When you create an account, register via email, or log in with Google, we collect your username, email address, chosen password hash, and optional profile avatar. If you request a reward redemption (e.g. PayPal transfer or gift card), we collect payout details such as your verified recipient email address.`
      },
      {
        title: 'B. Automated Gameplay & Proof-of-Play Data',
        content: `To calculate and grant promotional loyalty points (PTS), we collect session heartbeat pings, elapsed play duration, scores, streak activity, and spin wheel participation. This data ensures reward accuracy and protects our advertising partners from automated fraud.`
      },
      {
        title: 'C. Device & Technical Telemetry',
        content: `We automatically collect device identifiers, operating system version (e.g., Android version), device model, IP address, approximate geographical region (country/city derived from IP), and app version code for crash diagnostics and anti-bot verification.`
      }
    ]
  },
  {
    id: 'admob',
    title: '3. Advertising & Google AdMob Disclosure',
    content: `${APP_NAME} is an ad-supported loyalty platform. We partner with Google AdMob (Google Play Services) to display rewarded video ads, banner ads, and sponsored partner drops. Google AdMob may use device advertising identifiers (such as the Google Advertising ID / GAID) and cookies to serve contextual or personalized advertisements in accordance with Google's Privacy Policy. You can inspect and manage your Google Ad settings or reset your Advertising ID anytime in your Android Device Settings > Google > Ads.`
  },
  {
    id: 'usage',
    title: '4. How We Use Your Information',
    content: `We process your data strictly for legitimate operational purposes:`,
    bullets: [
      'Authenticating your account and synchronizing points balance across sessions.',
      'Auditing gameplay duration with proof-of-play anti-cheat checks before points conversion.',
      'Processing legitimate cashout and reward redemption requests within our 24–72 hour verification window.',
      'Serving sponsored video rewards and promotional loyalty drops.',
      'Broadcasting real-time bonus notifications, streak reminders, and app update alerts.',
      'Preventing fraud, multiple accounts, automated bot emulators, and terms violations.'
    ]
  },
  {
    id: 'sharing',
    title: '5. Sharing & Disclosure of Data',
    content: `We do not sell, rent, or trade your personal information to third parties. We may share data strictly in the following limited circumstances:`,
    bullets: [
      'With trusted cloud hosting and database service providers operating under strict confidentiality.',
      'With payout processors (e.g., PayPal) solely to execute requested user cashouts.',
      'With Google AdMob to deliver rewarded video ads and verify ad completion nonces.',
      'To comply with valid legal processes, court orders, or law enforcement investigations.'
    ]
  },
  {
    id: 'retention-deletion',
    title: '6. Account & Data Deletion (Google Play Compliance)',
    content: `In accordance with Google Play Developer Policy and global privacy standards (GDPR / CCPA):`,
    bullets: [
      'You have the right to request the permanent deletion of your account and all associated personal data at any time.',
      'To request account deletion, navigate to Settings > Account > Delete Account in the mobile app, or email us at privacy@gameloot.app with your registered email and username.',
      'Upon verification, all account records, gameplay histories, and personal identifiers will be permanently purged from our active databases within 30 days.'
    ]
  },
  {
    id: 'security',
    title: '7. Data Security',
    content: `We employ strict security measures including TLS/SSL encryption for all data in transit, encrypted password hashing (bcrypt), tokenized JWT authentication, and automated rate limiting to protect against unauthorized access, alteration, or disclosure.`
  },
  {
    id: 'children',
    title: "8. Children's Privacy (COPPA Compliance)",
    content: `${APP_NAME} is intended for general audiences aged 13 and older (or 16 and older in the European Economic Area). We do not knowingly collect or solicit personal data from children under 13. If we discover that personal information has been collected from a child under 13, we promptly delete such data from our servers.`
  },
  {
    id: 'contact',
    title: '9. Contact Us',
    content: `If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please contact our Data Protection Officer at:`,
    contact: {
      email: PRIVACY_EMAIL,
      support: CONTACT_EMAIL,
      app: APP_NAME
    }
  }
];

const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By downloading, installing, accessing, or using the ${APP_NAME} mobile application or services, you agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must immediately uninstall and cease all use of the application.`
  },
  {
    id: 'eligibility',
    title: '2. User Eligibility & Account Integrity',
    content: `You must be at least 13 years of age (or the minimum legal age required in your jurisdiction) to use ${APP_NAME}. You agree to:`,
    bullets: [
      'Maintain only one (1) account per individual. Operating duplicate, alternate, or bot accounts is strictly prohibited.',
      'Provide accurate, current registration details and keep your login credentials confidential.',
      'Accept full responsibility for all activities occurring under your account credentials.'
    ]
  },
  {
    id: 'rewards-system',
    title: '3. Promotional Reward Points (PTS) & Redemptions',
    content: `The reward points ("PTS") awarded within ${APP_NAME} are promotional loyalty points provided as voluntary engagement incentives:`,
    bullets: [
      'Points have no intrinsic monetary or real-world property value and cannot be transferred, sold, or bartered outside the application.',
      'Points may only be redeemed for available gift cards or cashout options published in the in-app Rewards Catalog, subject to meeting published minimum withdrawal thresholds.',
      'All redemption requests undergo automated and manual anti-fraud review before payout approval (typically processed within 24 to 72 business hours).',
      'Users are solely responsible for all applicable personal income taxes, reporting, and transaction fees associated with received payouts.'
    ]
  },
  {
    id: 'fair-play',
    title: '4. Fair Play, Anti-Cheat & Prohibited Conduct',
    content: `To safeguard our platform and advertising partners, ${APP_NAME} enforces a zero-tolerance Fair Play Policy. You expressly agree NOT to:`,
    bullets: [
      'Use automated scripts, clickers, bots, macro recorders, or memory modifiers.',
      'Manipulate proof-of-play heartbeat pings, session timers, or API request payloads.',
      'Employ VPNs, proxy networks, or device spoofing software to circumvent geographic ad rules or artificially multiply rewards.',
      'Decompile, reverse-engineer, modify, or disassemble the application binaries or game webviews.',
      'Engage in fraudulent ad clicks, automated video skipping, or artificial ad impression generation.'
    ]
  },
  {
    id: 'termination',
    title: '5. Account Suspension & Forfeiture',
    content: `We reserve the unilateral right to suspend, terminate, or ban any account without prior notice if we detect suspicious telemetry, anti-cheat violations, automated script activity, or breach of these Terms. Any unredeemed points in a banned or fraudulent account will be permanently forfeited.`
  },
  {
    id: 'games-ip',
    title: '6. Third-Party Games & Intellectual Property',
    content: `The HTML5 games featured in ${APP_NAME} are either licensed, public domain, or curated from authorized web game developers. All game trademarks, assets, and copyrights remain the exclusive property of their respective creators. ${APP_NAME} trademarks, graphics, UI design, and backend systems are protected proprietary intellectual property.`
  },
  {
    id: 'disclaimer',
    title: '7. Disclaimer of Warranties & Limitation of Liability',
    content: `${APP_NAME} is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, ${COMPANY_NAME} shall not be liable for any indirect, incidental, punitive, or consequential damages arising from app usage, payout delays, third-party game availability, or service interruptions.`
  },
  {
    id: 'modifications',
    title: '8. Modifications to Terms',
    content: `We reserve the right to revise these Terms at any time. Changes will become effective upon publishing the updated Terms with a revised "Last Updated" date. Your continued use of the application after changes constitute acceptance of the updated terms.`
  },
  {
    id: 'contact',
    title: '9. Contact & Support',
    content: `If you have questions or inquiries regarding these Terms of Service, please reach out to our team:`,
    contact: {
      email: CONTACT_EMAIL,
      company: COMPANY_NAME
    }
  }
];

export default function PublicLegalView({ initialTab = 'privacy' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('terms') || path.includes('tos')) {
        setActiveTab('terms');
      } else {
        setActiveTab('privacy');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    const newPath = tab === 'terms' ? '/terms' : '/privacy';
    window.history.pushState({}, '', newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const isPrivacy = activeTab === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const docTitle = isPrivacy ? 'Privacy Policy' : 'Terms of Service';
  const docSubtitle = isPrivacy
    ? 'Official compliance statement regarding data collection, Google AdMob, user telemetry, and deletion rights.'
    : 'User agreement, fair play anti-cheat rules, promotional points terms, and redemption policies.';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={handleGoHome}
              className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight">
                GAMELOOT <span className="text-cyan-400">LEGAL</span>
              </span>
            </a>
          </div>

          {/* Segmented Pill Switcher */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => handleSwitchTab('privacy')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                isPrivacy
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => handleSwitchTab('terms')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                !isPrivacy
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>
          </div>

          {/* Back to Home / Sign In */}
          <div className="hidden sm:flex items-center">
            <a
              href="/"
              onClick={handleGoHome}
              className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin HQ</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Document Hero Banner */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 pb-6 border-b border-slate-800/80"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-3">
            {isPrivacy ? <Shield className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
            <span>Public Legal Document • No Login Required</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {docTitle}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            {docSubtitle}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-slate-500">
            <span>Last Updated: <strong className="text-slate-300 font-semibold">{LAST_UPDATED}</strong></span>
            <span>•</span>
            <span>Platform: <strong className="text-slate-300 font-semibold">GameLoot Android & Web</strong></span>
            <span>•</span>
            <span>Audience: <strong className="text-slate-300 font-semibold">Public Access</strong></span>
          </div>
        </motion.div>

        {/* Highlight Summary Card */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-cyan-300">
                {isPrivacy ? 'Google Play & AdMob Transparency' : 'Fair Play & Reward Clarity'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {isPrivacy
                  ? 'GameLoot is an ad-supported loyalty platform. We partner with Google AdMob to deliver rewarded video ads. You retain full control over your advertising ID, and you may request permanent account deletion at any time.'
                  : 'GameLoot promotional points (PTS) have no intrinsic cash value until redeemed through verified catalog options. Automated bots, multiple accounts, and memory injection are strictly prohibited to protect all honest players.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section Cards */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <section
              key={section.id || idx}
              id={section.id}
              className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 sm:p-7 shadow-lg backdrop-blur-sm"
            >
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <span>{section.title}</span>
              </h3>

              {section.content && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {section.content}
                </p>
              )}

              {/* Subsections if any */}
              {section.subsections && (
                <div className="mt-4 space-y-3.5 pl-2 sm:pl-3 border-l-2 border-slate-800">
                  {section.subsections.map((sub, sIdx) => (
                    <div key={sIdx} className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                      <h4 className="text-sm font-bold text-cyan-300 mb-1">
                        {sub.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {sub.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullet Points if any */}
              {section.bullets && (
                <ul className="mt-3.5 space-y-2">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <ChevronRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Contact box if any */}
              {section.contact && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap gap-4 text-xs sm:text-sm">
                  {section.contact.email && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>Privacy Officer: <a href={`mailto:${section.contact.email}`} className="text-cyan-400 hover:underline">{section.contact.email}</a></span>
                    </div>
                  )}
                  {section.contact.support && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <span>General Support: <a href={`mailto:${section.contact.support}`} className="text-cyan-400 hover:underline">{section.contact.support}</a></span>
                    </div>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Account Deletion Quick Action (Privacy) */}
        {isPrivacy && (
          <div className="mt-8 p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-300">
                  Data Deletion & Account Purge Rights
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Under Google Play Developer Policies, GDPR, and CCPA, you may permanently purge your account and all associated gameplay logs at any time. Simply submit an automated deletion request inside the mobile app via <strong>Settings &gt; Delete Account</strong> or email us directly at{' '}
                  <a href={`mailto:${PRIVACY_EMAIL}`} className="text-cyan-400 underline font-semibold">{PRIVACY_EMAIL}</a>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {COMPANY_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleSwitchTab('privacy')}
              className={`hover:text-cyan-400 transition-colors ${isPrivacy ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => handleSwitchTab('terms')}
              className={`hover:text-cyan-400 transition-colors ${!isPrivacy ? 'text-cyan-400 font-semibold' : ''}`}
            >
              Terms of Service
            </button>
            <span>•</span>
            <a href="/" onClick={handleGoHome} className="hover:text-cyan-400 transition-colors">
              Admin HQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
