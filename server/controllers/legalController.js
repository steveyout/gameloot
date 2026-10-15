/**
 * GameLoot Legal & Compliance Controller
 * Provides Google Play & AdMob compliant Privacy Policy, Terms of Service, and Account Deletion
 * Supports both modern responsive HTML rendering and structured JSON API responses.
 */

const { User } = require('../models');

const APP_NAME = 'GameLoot';
const COMPANY_NAME = 'GameLoot Interactive';
const CONTACT_EMAIL = 'support@youplex.cc';
const PRIVACY_EMAIL = 'support@youplex.cc';
const APP_URL = 'https://gameloot.youplex.cc';
const LAST_UPDATED = 'October 15, 2026';

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
    --danger: #ef4444;
    --danger-bg: rgba(239, 68, 68, 0.12);
    --success: #10b981;
    --success-bg: rgba(16, 185, 129, 0.12);
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
      --danger: #dc2626;
      --danger-bg: #fee2e2;
      --success: #059669;
      --success-bg: #d1fae5;
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
    gap: 10px;
    flex-wrap: wrap;
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
  .nav-link.danger-nav:hover, .nav-link.danger-nav.active {
    color: var(--danger);
    background: var(--danger-bg);
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
  .badge-danger {
    background: var(--danger-bg);
    color: var(--danger);
    border-color: rgba(239, 68, 68, 0.3);
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
  .highlight-box.danger-box {
    border-left-color: var(--danger);
    background: var(--danger-bg);
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

  /* Deletion Form Styles */
  .form-group {
    margin-bottom: 20px;
  }
  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text);
  }
  .form-input {
    width: 100%;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card-subtle);
    color: var(--text);
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
  }
  .form-input:focus {
    border-color: var(--primary);
  }
  .checkbox-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 24px 0;
    padding: 16px;
    background: var(--card-subtle);
    border-radius: 10px;
    border: 1px solid var(--border);
  }
  .checkbox-row input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-top: 2px;
    accent-color: var(--danger);
    cursor: pointer;
  }
  .checkbox-row label {
    font-size: 14px;
    color: var(--text);
    line-height: 1.5;
    cursor: pointer;
  }
  .btn-delete {
    width: 100%;
    padding: 16px;
    border-radius: 12px;
    border: none;
    background: var(--danger);
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .btn-delete:hover {
    opacity: 0.9;
  }
  .alert-error {
    background: var(--danger-bg);
    color: var(--danger);
    border: 1px solid rgba(239, 68, 68, 0.4);
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .success-card {
    text-align: center;
    padding: 40px 24px;
  }
  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: var(--success-bg);
    color: var(--success);
    font-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    border: 2px solid var(--success);
  }
  .ref-badge {
    display: inline-block;
    background: var(--card-subtle);
    border: 1px solid var(--border);
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 14px;
    margin: 16px 0;
  }
  .btn-home {
    display: inline-block;
    margin-top: 24px;
    padding: 12px 24px;
    background: var(--primary);
    color: #ffffff;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 700;
  }
  .btn-home:hover {
    color: #ffffff;
    opacity: 0.9;
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
      'You can submit an instant deletion request directly through our public web form at <a href="/delete-account">https://gameloot.youplex.cc/delete-account</a> without needing to install or open the app.',
      'You can also initiate deletion within the mobile app under Settings > Delete Account, or by emailing support@youplex.cc.',
      'Upon verification, all account records, authentication tokens, gameplay histories, and personal identifiers will be permanently deleted from our active databases.'
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
        <a href="/delete-account" class="nav-link danger-nav ${activeTab === 'delete' ? 'active' : ''}">Delete Account</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <div class="badge">${badge}</div>
      <h1>${title}</h1>
      <div class="updated">Effective & Last Updated: <strong>${LAST_UPDATED}</strong> &bull; Version 1.3</div>
    </div>

    ${sectionsHtml}
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p style="margin-top: 6px;">
      <a href="/privacy">Privacy Policy</a> &bull;
      <a href="/terms">Terms of Service</a> &bull;
      <a href="/delete-account">Delete Account & Data</a> &bull;
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </p>
  </footer>
</body>
</html>`;
}

// Render Dedicated Account Deletion Page
function renderDeleteAccountPage(error = null, success = null) {
  let feedbackHtml = '';
  if (error) {
    feedbackHtml = `
      <div class="alert-error">
        <span>⚠</span> ${error}
      </div>
    `;
  }

  let bodyContent = '';

  if (success) {
    bodyContent = `
      <div class="card-section success-card">
        <div class="success-icon">&#10003;</div>
        <h2>Account Deletion Queued</h2>
        <p>We have processed your request for <strong>${success.email}</strong>.</p>
        <div class="ref-badge">Reference Confirmation ID: <strong>${success.refId}</strong></div>
        <p style="margin-top: 14px;">In accordance with Google Play User Data policies and privacy regulations (GDPR/CCPA), all authentication credentials, points, tickets, gameplay telemetry, and profile identifiers have been permanently removed from our active database.</p>
        <a href="/" class="btn-home">Back to ${APP_NAME}</a>
      </div>
    `;
  } else {
    bodyContent = `
      ${feedbackHtml}

      <div class="card-section">
        <h2>Google Play Account Deletion Policy Overview</h2>
        <p>In compliance with <strong>Google Play Developer Data Safety Policies</strong> and global privacy laws, ${APP_NAME} provides all users with direct self-serve access to request the permanent deletion of their account and all associated data through this public web portal without requiring access to the mobile application.</p>

        <div class="highlight-box danger-box">
          <p><strong>Warning:</strong> Deleting your account is permanent. All accumulated reward points (PTS), tickets, loyalty streaks, rank progress, and redemption records associated with this email will be permanently wiped.</p>
        </div>

        <h3 style="margin-top: 20px;">Data That Will Be Permanently Deleted:</h3>
        <ul>
          <li><strong>User Profile:</strong> Username, email address, password hash, and avatar icon.</li>
          <li><strong>Reward Balances:</strong> All points balance, tickets, daily streak progress, and lucky wheel tickets.</li>
          <li><strong>Gameplay Records:</strong> Heartbeat telemetry, playtime logs, session tokens, high scores, and leaderboards.</li>
          <li><strong>Earn Hub Records:</strong> Survey submissions, quiz completions, and web surf task records.</li>
          <li><strong>Device Telemetry:</strong> Device identifiers, IP addresses, and push notification tokens.</li>
        </ul>

        <h3>Data Retention Disclosures:</h3>
        <p>If you have previously requested a cashout reward (e.g. PayPal payout), transaction audit receipts are retained for up to 90 days strictly to comply with mandatory financial tax laws, banking regulations, and anti-money laundering compliance. After this statutory window, all records are permanently deleted.</p>

        <h3>Processing Timeframe:</h3>
        <p>Requests submitted via this form are processed immediately upon verification. Full data purging from offline backup storage occurs within 24–48 hours.</p>
      </div>

      <div class="card-section">
        <h2>Submit Account Deletion Request</h2>
        <p>Please enter your registered ${APP_NAME} email address below to initiate permanent account and data deletion.</p>

        <form method="POST" action="/delete-account">
          <div class="form-group">
            <label class="form-label" for="email">Account Email Address <span style="color: var(--danger); font-weight: 900;">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-input"
              required
              placeholder="e.g. gamer@example.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Username (Optional)</label>
            <input
              type="text"
              id="username"
              name="username"
              class="form-input"
              placeholder="e.g. PlayerOne"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="reason">Reason for Leaving (Optional)</label>
            <select id="reason" name="reason" class="form-input">
              <option value="">Select a reason...</option>
              <option value="no_longer_play">I no longer play mobile games</option>
              <option value="privacy_concerns">Privacy or data collection concerns</option>
              <option value="technical_issues">Technical difficulties with the app</option>
              <option value="starting_over">Creating a new account</option>
              <option value="other">Other reason</option>
            </select>
          </div>

          <div class="checkbox-row">
            <input type="checkbox" id="confirm" name="confirm" required value="yes" />
            <label for="confirm">
              I understand and agree that this action is irreversible. All unredeemed points, rewards, tickets, and gameplay progress will be permanently erased.
            </label>
          </div>

          <button type="submit" class="btn-delete">
            Permanently Delete My Account & Data
          </button>
        </form>
      </div>

      <div class="card-section">
        <h2>Need Assistance?</h2>
        <p>If you have any questions regarding your personal data or need assistance with your request, contact our Data Protection Officer at <a href="mailto:${PRIVACY_EMAIL}">${PRIVACY_EMAIL}</a>.</p>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Delete Account & Data | ${APP_NAME}</title>
  <meta name="description" content="Request permanent account and associated data deletion for ${APP_NAME} in compliance with Google Play Developer policies.">
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
        <a href="/privacy" class="nav-link">Privacy Policy</a>
        <a href="/terms" class="nav-link">Terms of Service</a>
        <a href="/delete-account" class="nav-link danger-nav active">Delete Account</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <div class="hero">
      <div class="badge badge-danger">Google Play Compliance</div>
      <h1>Request Account & Data Deletion</h1>
      <div class="updated">Google Play User Data Safety &bull; Effective: <strong>${LAST_UPDATED}</strong></div>
    </div>

    ${bodyContent}
  </main>

  <footer class="footer">
    <p>&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
    <p style="margin-top: 6px;">
      <a href="/privacy">Privacy Policy</a> &bull;
      <a href="/terms">Terms of Service</a> &bull;
      <a href="/delete-account">Delete Account & Data</a> &bull;
      <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
    </p>
  </footer>
</body>
</html>`;
}

// Controller Endpoints
function getPrivacyPolicy(req, res) {
  if (req.query.format === 'json' || req.headers?.accept?.includes('application/json')) {
    return res.json({
      success: true,
      title: 'Privacy Policy',
      app_name: APP_NAME,
      last_updated: LAST_UPDATED,
      sections: PRIVACY_SECTIONS,
      contact: { email: PRIVACY_EMAIL, support: CONTACT_EMAIL, website: APP_URL }
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(renderHtmlPage('Privacy Policy', 'Official Legal Document', PRIVACY_SECTIONS, 'privacy'));
}

function getTermsOfService(req, res) {
  if (req.query.format === 'json' || req.headers?.accept?.includes('application/json')) {
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

function getDeleteAccountPage(req, res) {
  if (req.query.format === 'json' || req.headers?.accept?.includes('application/json')) {
    return res.json({
      success: true,
      title: 'Account & Data Deletion Policy',
      app_name: APP_NAME,
      deletion_url: `${APP_URL}/delete-account`,
      data_deleted: [
        'User profile (username, email, password hash, avatar)',
        'Points balance and tickets balance',
        'Proof-of-play session telemetry and heartbeat logs',
        'Device identifiers and push notification tokens',
        'Earn Hub task records (surveys, quizzes, surf tasks)'
      ],
      data_retained: [
        'Completed financial transaction receipts (retained up to 90 days for statutory tax/financial compliance)'
      ],
      contact: { email: PRIVACY_EMAIL, support: CONTACT_EMAIL, website: APP_URL }
    });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(renderDeleteAccountPage());
}

async function handleDeleteAccountRequest(req, res) {
  try {
    const { email, username, reason, confirm } = req.body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const errMsg = 'Please provide a valid registered email address.';
      if (req.is('json') || req.headers?.accept?.includes('application/json') || req.xhr) {
        return res.status(400).json({ success: false, message: errMsg });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(renderDeleteAccountPage(errMsg));
    }

    if (!confirm || (confirm !== 'yes' && confirm !== true && confirm !== 'on')) {
      const errMsg = 'You must confirm that you understand account deletion is permanent.';
      if (req.is('json') || req.headers?.accept?.includes('application/json') || req.xhr) {
        return res.status(400).json({ success: false, message: errMsg });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(renderDeleteAccountPage(errMsg));
    }

    const cleanEmail = email.trim().toLowerCase();
    const refId = 'DEL-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Find and delete the user account and associated cascading data if it exists
    const user = await User.findOne({ where: { email: cleanEmail } });
    if (user) {
      console.log(`[Account Deletion] Permanent deletion executed for user: ${user.username} (${cleanEmail}), ref: ${refId}`);
      await user.destroy();
    } else {
      console.log(`[Account Deletion] Deletion requested for non-existent/guest email: ${cleanEmail}, ref: ${refId}`);
    }

    if (req.is('json') || req.headers?.accept?.includes('application/json') || req.xhr) {
      return res.json({
        success: true,
        message: 'Account and associated data have been permanently queued for deletion.',
        reference_id: refId,
        email: cleanEmail
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderDeleteAccountPage(null, { email: cleanEmail, refId }));
  } catch (err) {
    console.error('Error handling account deletion request:', err);
    const errMsg = 'An unexpected server error occurred while processing your request. Please try again or contact support.';
    if (req.is('json') || req.headers?.accept?.includes('application/json') || req.xhr) {
      return res.status(500).json({ success: false, message: errMsg, error: err.message });
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(renderDeleteAccountPage(errMsg));
  }
}

module.exports = {
  getPrivacyPolicy,
  getTermsOfService,
  getDeleteAccountPage,
  handleDeleteAccountRequest,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS
};
