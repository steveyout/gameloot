/**
 * GameLoot Legal & Compliance Controller
 * Provides Google Play & AdMob compliant Privacy Policy and Terms of Service
 * Supports both modern responsive HTML rendering and structured JSON API responses.
 */

const APP_NAME = 'GameLoot';
const COMPANY_NAME = 'GameLoot Interactive';
const CONTACT_EMAIL = 'support@youplex.cc';
const PRIVACY_EMAIL = 'support@youplex.cc';
const APP_URL = 'https://gameloot.youplex.cc';
const LAST_UPDATED = 'October 14, 2026';

// Common CSS styling for beautiful, clean, responsive legal pages
const SHARED_CSS = `
  :root {
    --bg: #090d16;
    --card: #0f172a;
    --border: #1e293b;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --primary: #06b6d4;
    --primary-gradient: linear-gradient(135deg, #06b6d4, #3b82f6);
    --accent: #fbbf24;
    --card-subtle: #131e33;
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f8fafc;
      --card: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --primary: #0284c7;
      --primary-gradient: linear-gradient(135deg, #0284c7, #2563eb);
      --accent: #d97706;
      --card-subtle: #f1f5f9;
    }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg);
    color: var(--text);
    line-height: 1.65;
    padding: 0;
    margin: 0;
  }
  .header {
    background: var(--card);
    border-bottom: 1px solid var(--border);
    padding: 24px 20px;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }
  .header-inner {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--text);
  }
  .brand-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: var(--primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 20px;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  }
  .brand-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .nav-links {
    display: flex;
    gap: 16px;
  }
  .nav-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.2s;
  }
  .nav-link:hover, .nav-link.active {
    color: var(--primary);
    background: var(--card-subtle);
  }
  .container {
    max-width: 900px;
    margin: 40px auto;
    padding: 0 20px 80px;
  }
  .hero {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .badge {
    display: inline-block;
    background: rgba(6, 182, 212, 0.15);
    color: var(--primary);
    border: 1px solid rgba(6, 182, 212, 0.3);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  h1 {
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .updated {
    font-size: 13px;
    color: var(--text-muted);
  }
  .card-section {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  }
  h2 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
  }
  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0 8px;
    color: var(--text);
  }
  p {
    margin-bottom: 14px;
    color: var(--text-muted);
    font-size: 15px;
  }
  ul, ol {
    margin: 12px 0 16px 24px;
    color: var(--text-muted);
    font-size: 15px;
  }
  li {
    margin-bottom: 8px;
  }
  strong {
    color: var(--text);
  }
  .highlight-box {
    background: var(--card-subtle);
    border-left: 4px solid var(--primary);
    padding: 16px;
    border-radius: 0 12px 12px 0;
    margin: 16px 0;
  }
  .highlight-box p {
    margin-bottom: 0;
  }
  .contact-box {
    background: var(--card-subtle);
    border: 1px solid var(--border);
    padding: 20px;
    border-radius: 12px;
    margin-top: 16px;
  }
  .footer {
    text-align: center;
    padding: 30px 20px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 13px;
  }
  a {
    color: var(--primary);
    text-decoration: underline;
  }
  a:hover {
    color: var(--text);
  }
`;

// 1. Privacy Policy Data
const PRIVACY_SECTIONS = [
  {
    id: 'intro',
    title: '1. Introduction',
    content: `Welcome to ${APP_NAME} ("we", "our", or "us"). We are committed to protecting your personal privacy while providing a fun and rewarding play-to-earn mobile gaming platform. This Privacy Policy details the types of information we collect when you download, install, or use the ${APP_NAME} mobile application and website (${APP_URL}), how we use, share, and protect that information, and your rights regarding your personal data.`
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
      'To request account deletion, navigate to Settings > Account > Delete Account in the mobile app, or email us at support@youplex.cc with your registered email and username.',
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
    content: `If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please contact our support team at:`,
    contact: {
      email: PRIVACY_EMAIL,
      support: CONTACT_EMAIL,
      app: APP_NAME,
      website: APP_URL
    }
  }
];

// 2. Terms of Service Data
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
    content: `The games featured in ${APP_NAME} are either licensed, public domain, or curated from authorized game developers. All game trademarks, assets, and copyrights remain the exclusive property of their respective creators. ${APP_NAME} trademarks, graphics, UI design, and backend systems are protected proprietary intellectual property.`
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
      company: COMPANY_NAME,
      website: APP_URL
    }
  }
];

// Helper to render HTML documents
function renderHtmlPage(title, badge, sections, activeTab) {
  const sectionsHtml = sections.map(s => {
    let extra = '';
    if (s.subsections) {
      extra += s.subsections.map(sub => `
        <div style="margin-top: 14px;">
          <h3>${sub.title}</h3>
          <p>${sub.content}</p>
        </div>
      `).join('');
    }
    if (s.bullets) {
      extra += `<ul>${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    }
    if (s.contact) {
      extra += `
        <div class="contact-box">
          <p><strong>Support & Inquiries:</strong> <a href="mailto:${s.contact.support || s.contact.email}">${s.contact.support || s.contact.email}</a></p>
          <p><strong>Platform:</strong> <a href="${s.contact.website}">${s.contact.website}</a></p>
        </div>
      `;
    }
    return `
      <section class="card-section" id="${s.id}">
        <h2>${s.title}</h2>
        <p>${s.content}</p>
        ${extra}
      </section>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ${APP_NAME}</title>
  <meta name="description" content="Official ${title} for ${APP_NAME} mobile rewards platform.">
  <link rel="icon" href="/favicon.ico" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/" class="brand">
        <div class="brand-icon">G</div>
        <div class="brand-title">${APP_NAME}</div>
      </a>
      <nav class="nav-links">
        <a href="/privacy" class="nav-link ${activeTab === 'privacy' ? 'active' : ''}">Privacy Policy</a>
        <a href="/terms" class="nav-link ${activeTab === 'terms' ? 'active' : ''}">Terms of Service</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <div class="badge">${badge}</div>
      <h1>${title}</h1>
      <div class="updated">Effective & Last Updated: <strong>${LAST_UPDATED}</strong> &bull; Version 1.2</div>
    </div>

    ${sectionsHtml}
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p style="margin-top: 6px;">
      <a href="/privacy">Privacy Policy</a> &bull;
      <a href="/terms">Terms of Service</a> &bull;
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </p>
  </footer>
</body>
</html>`;
}

// Controller Endpoints
function getPrivacyPolicy(req, res) {
  // Check if JSON requested via query or Accept header
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return res.json({
      success: true,
      title: 'Privacy Policy',
      app_name: APP_NAME,
      last_updated: LAST_UPDATED,
      sections: PRIVACY_SECTIONS,
      contact: { email: PRIVACY_EMAIL, support: CONTACT_EMAIL, website: APP_URL }
    });
  }

  // Otherwise deliver responsive HTML page
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(renderHtmlPage('Privacy Policy', 'Official Legal Document', PRIVACY_SECTIONS, 'privacy'));
}

function getTermsOfService(req, res) {
  if (req.query.format === 'json' || req.headers.accept?.includes('application/json')) {
    return res.json({
      success: true,
      title: 'Terms of Service',
      app_name: APP_NAME,
      last_updated: LAST_UPDATED,
      sections: TERMS_SECTIONS,
      contact: { email: CONTACT_EMAIL, website: APP_URL }
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(renderHtmlPage('Terms of Service', 'User Agreement & Guidelines', TERMS_SECTIONS, 'terms'));
}

module.exports = {
  getPrivacyPolicy,
  getTermsOfService,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS
};
