/**
 * Purple Flea Economy Widget
 * Embed live AI agent economy stats on any website.
 *
 * Usage:
 *   <div id="purple-flea-stats"></div>
 *   <script src="https://purpleflea.com/economy/widget.js"></script>
 *
 * Options (set on container element before loading script):
 *   data-theme="dark" (default) | "light" | "minimal"
 *   data-refresh="30" (seconds, default 30)
 *   data-link="true" (default) | "false" — show link to purpleflea.com/economy
 */
(function () {
  'use strict';

  const BASE = 'https://purpleflea.com';
  const SERVICES = {
    casino:  { url: 'https://casino.purpleflea.com/api/v1/public-stats',  color: '#F59E0B', icon: '🎰', label: 'Casino' },
    trading: { url: 'https://trading.purpleflea.com/v1/public-stats',     color: '#10B981', icon: '📈', label: 'Trading' },
    wallet:  { url: 'https://wallet.purpleflea.com/v1/public-stats',      color: '#3B82F6', icon: '👛', label: 'Wallet' },
    domains: { url: 'https://domains.purpleflea.com/public-stats',        color: '#EC4899', icon: '🌐', label: 'Domains' },
  };

  const STAT_KEY = {
    casino:  ['registered_agents', 'total_bets'],
    trading: ['registered_agents', 'total_positions'],
    wallet:  ['registered_agents', 'total_swaps'],
    domains: ['registered_agents', 'total_domains'],
  };

  const STAT_LABEL = {
    registered_agents: 'agents',
    total_bets:        'bets',
    total_positions:   'positions',
    total_swaps:       'swaps',
    total_domains:     'domains',
  };

  function css(dark) {
    return `
      .pflea-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        background: ${dark ? '#0D0D10' : '#FFFFFF'};
        border: 1px solid ${dark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.25)'};
        border-radius: 14px;
        padding: 16px 18px;
        color: ${dark ? '#FAFAFA' : '#09090B'};
        max-width: 520px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      }
      .pflea-widget::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, #A855F7, #7C3AED);
        border-radius: 14px 14px 0 0;
      }
      .pflea-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
      }
      .pflea-logo {
        font-size: 15px;
        font-weight: 800;
        color: #A855F7;
        text-decoration: none;
        letter-spacing: -0.02em;
      }
      .pflea-tag {
        font-size: 10px;
        color: ${dark ? '#52525B' : '#A1A1AA'};
        margin-left: auto;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .pflea-live {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #22C55E;
        display: inline-block;
        animation: pflea-pulse 2s infinite;
      }
      @keyframes pflea-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .pflea-total {
        text-align: center;
        padding: 12px 0;
        border-bottom: 1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
        margin-bottom: 14px;
      }
      .pflea-total-num {
        font-size: 36px;
        font-weight: 800;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        background: linear-gradient(135deg, #A855F7, #C084FC);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        letter-spacing: -0.03em;
      }
      .pflea-total-label {
        font-size: 11px;
        color: ${dark ? '#71717A' : '#A1A1AA'};
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .pflea-services {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      .pflea-service {
        text-align: center;
      }
      .pflea-service-icon {
        font-size: 18px;
        margin-bottom: 4px;
        display: block;
      }
      .pflea-service-count {
        font-size: 18px;
        font-weight: 700;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        letter-spacing: -0.02em;
        line-height: 1;
      }
      .pflea-service-name {
        font-size: 10px;
        color: ${dark ? '#52525B' : '#A1A1AA'};
        margin-top: 2px;
        font-weight: 500;
      }
      .pflea-footer {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'};
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .pflea-footer a {
        font-size: 10px;
        color: #A855F7;
        text-decoration: none;
        font-weight: 500;
        opacity: 0.8;
      }
      .pflea-footer a:hover { opacity: 1; }
      .pflea-updated {
        font-size: 10px;
        color: ${dark ? '#3F3F46' : '#D4D4D8'};
        font-family: monospace;
      }
    `;
  }

  function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 10000)   return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  function renderWidget(container, data, theme, showLink) {
    const dark = theme !== 'light';
    const total = Object.values(data).reduce((s, d) => s + (d && d.registered_agents || 0), 0);

    container.innerHTML = `
      <style>${css(dark)}</style>
      <div class="pflea-widget">
        <div class="pflea-header">
          <span style="font-size:16px">🐾</span>
          <span class="pflea-logo">Purple Flea</span>
          <span class="pflea-tag">Agent Economy</span>
          <span class="pflea-live"></span>
        </div>
        <div class="pflea-total">
          <div class="pflea-total-num">${fmt(total)}</div>
          <div class="pflea-total-label">Total Registered Agents</div>
        </div>
        <div class="pflea-services">
          ${Object.entries(SERVICES).map(([key, svc]) => {
            const d = data[key];
            const agents = d ? (d.registered_agents || 0) : null;
            return `
              <div class="pflea-service">
                <span class="pflea-service-icon">${svc.icon}</span>
                <div class="pflea-service-count" style="color:${svc.color}">${fmt(agents)}</div>
                <div class="pflea-service-name">${svc.label}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="pflea-footer">
          ${showLink !== 'false' ? `<a href="${BASE}/economy" target="_blank" rel="noopener">purpleflea.com/economy ↗</a>` : '<span></span>'}
          <span class="pflea-updated" id="pflea-ts-${container.id}">Updated ${new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    `;
  }

  async function loadStats() {
    const fetches = Object.entries(SERVICES).map(async ([key, svc]) => {
      try {
        const r = await fetch(svc.url);
        if (!r.ok) return [key, null];
        const d = await r.json();
        return [key, d];
      } catch {
        return [key, null];
      }
    });
    const results = await Promise.all(fetches);
    return Object.fromEntries(results);
  }

  async function init() {
    const containers = document.querySelectorAll('#purple-flea-stats, [data-purple-flea-stats]');
    if (!containers.length) return;

    const data = await loadStats();

    containers.forEach(container => {
      if (!container.id) container.id = 'pflea-' + Math.random().toString(36).slice(2, 8);
      const theme    = container.getAttribute('data-theme') || 'dark';
      const refresh  = parseInt(container.getAttribute('data-refresh') || '30', 10);
      const showLink = container.getAttribute('data-link') || 'true';
      renderWidget(container, data, theme, showLink);

      // Auto-refresh
      setInterval(async () => {
        const freshData = await loadStats();
        renderWidget(container, freshData, theme, showLink);
      }, refresh * 1000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
