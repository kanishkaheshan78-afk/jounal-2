/**
 * kaniX_mSnR - Trading Journal Application
 * ==========================================
 * Vanilla JavaScript SPA with localStorage persistence,
 * Chart.js analytics, and a modern dark-themed UI.
 */

const app = {
    // App State
    trades: [],
    currentPage: 'home',
    charts: {},
    demoLoaded: false,

    // DOM Element References (cached)
    elements: {},

    // =========================================
    // Initialization
    // =========================================
    init() {
        this.cacheElements();
        this.loadTheme();
        this.loadTrades();
        this.refreshSetupOptions();
        this.bindEvents();
        this.initCharts();

        // Handle initial navigation
        const hash = window.location.hash.replace('#', '');
        if (hash && ['home', 'journal', 'analytics', 'about'].includes(hash)) {
            this.navigate(hash, false);
        } else {
            this.navigate('home', false);
        }

        this.updateUI();
    },

    cacheElements() {
        this.elements = {
            // Navigation
            navLinks: document.querySelectorAll('.nav-link'),
            mobileLinks: document.querySelectorAll('.mobile-link'),
            hamburger: document.getElementById('hamburger'),
            mobileMenu: document.getElementById('mobileMenu'),
            themeToggle: document.getElementById('themeToggle'),

            // Sections
            sections: document.querySelectorAll('.page-section'),

            // Forms
            tradeForm: document.getElementById('tradeForm'),
            tradeDate: document.getElementById('tradeDate'),
            tradeAsset: document.getElementById('tradeAsset'),
            tradeType: document.getElementById('tradeType'),
            tradeDirection: document.getElementById('tradeDirection'),
            entryPrice: document.getElementById('entryPrice'),
            exitPrice: document.getElementById('exitPrice'),
            positionSize: document.getElementById('positionSize'),
            calculatedPnl: document.getElementById('calculatedPnl'),
            tradeSetup: document.getElementById('tradeSetup'),
            tradeNotes: document.getElementById('tradeNotes'),

            // Quick Trade Modal
            quickTradeModal: document.getElementById('quickTradeModal'),
            quickTradeForm: document.getElementById('quickTradeForm'),
            quickDate: document.getElementById('quickDate'),
            quickAsset: document.getElementById('quickAsset'),
            quickType: document.getElementById('quickType'),
            quickDirection: document.getElementById('quickDirection'),
            quickEntry: document.getElementById('quickEntry'),
            quickExit: document.getElementById('quickExit'),
            quickSize: document.getElementById('quickSize'),
            quickPnl: document.getElementById('quickPnl'),
            quickSetup: document.getElementById('quickSetup'),
            quickNotes: document.getElementById('quickNotes'),
            fab: document.getElementById('fab'),

            // Trades List
            tradesTableBody: document.getElementById('tradesTableBody'),
            emptyState: document.getElementById('emptyState'),
            searchTrades: document.getElementById('searchTrades'),
            filterType: document.getElementById('filterType'),
            filterSetup: document.getElementById('filterSetup'),
            filterResult: document.getElementById('filterResult'),

            // Hero Stats
            heroTotalTrades: document.getElementById('heroTotalTrades'),
            heroWinRate: document.getElementById('heroWinRate'),
            heroPnl: document.getElementById('heroPnl'),

            // Analytics
            totalTrades: document.getElementById('totalTrades'),
            totalWinRate: document.getElementById('totalWinRate'),
            cryptoWinRate: document.getElementById('cryptoWinRate'),
            forexWinRate: document.getElementById('forexWinRate'),
            totalPnl: document.getElementById('totalPnl'),
            avgTrade: document.getElementById('avgTrade'),
            setupTableBody: document.getElementById('setupTableBody'),
            setupEmptyState: document.getElementById('setupEmptyState'),

            // Toast
            toastContainer: document.getElementById('toastContainer'),
        };

        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        if (this.elements.tradeDate) this.elements.tradeDate.value = today;
        if (this.elements.quickDate) this.elements.quickDate.value = today;
    },

    // =========================================
    // Event Binding
    // =========================================
    bindEvents() {
        const { elements } = this;

        // Mobile menu
        elements.hamburger?.addEventListener('click', () => {
            elements.hamburger.classList.toggle('active');
            elements.mobileMenu.classList.toggle('open');
        });

        // Theme toggle
        elements.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Main trade form
        elements.tradeForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTrade('main');
        });

        // Quick trade form
        elements.quickTradeForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTrade('quick');
        });

        // Auto-calculate P&L on main form
        [elements.entryPrice, elements.exitPrice, elements.positionSize, elements.tradeDirection].forEach(el => {
            el?.addEventListener('input', () => this.calculatePnl('main'));
        });

        // Auto-calculate P&L on quick form
        [elements.quickEntry, elements.quickExit, elements.quickSize, elements.quickDirection].forEach(el => {
            el?.addEventListener('input', () => this.calculatePnl('quick'));
        });

        // Search and filter
        elements.searchTrades?.addEventListener('input', () => this.renderTrades());
        elements.filterType?.addEventListener('change', () => this.renderTrades());
        elements.filterSetup?.addEventListener('change', () => this.renderTrades());
        elements.filterResult?.addEventListener('change', () => this.renderTrades());

        // Hash change for browser back/forward
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && hash !== this.currentPage) {
                this.navigate(hash, false);
            }
        });

        // Close modal on overlay click
        elements.quickTradeModal?.addEventListener('click', (e) => {
            if (e.target === elements.quickTradeModal) {
                this.closeQuickTrade();
            }
        });
    },

    // =========================================
    // Navigation
    // =========================================
    navigate(page, updateHash = true) {
        if (!['home', 'journal', 'analytics', 'about'].includes(page)) return;

        this.currentPage = page;

        // Update hash
        if (updateHash) {
            window.location.hash = page;
        }

        // Update nav links
        this.elements.navLinks?.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        this.elements.mobileLinks?.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Close mobile menu
        this.elements.hamburger?.classList.remove('active');
        this.elements.mobileMenu?.classList.remove('open');

        // Show/hide sections with animation
        this.elements.sections?.forEach(section => {
            if (section.id === page) {
                section.classList.add('active');
                // Re-trigger animation
                section.style.animation = 'none';
                section.offsetHeight; // Force reflow
                section.style.animation = '';
            } else {
                section.classList.remove('active');
            }
        });

        // Show/hide FAB
        this.elements.fab.style.display = (page === 'journal' || page === 'home') ? 'flex' : 'none';

        // Update charts if on analytics page
        if (page === 'analytics') {
            setTimeout(() => this.updateCharts(), 100);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // =========================================
    // Theme Management
    // =========================================
    loadTheme() {
        const savedTheme = localStorage.getItem('kanix-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('kanix-theme', next);

        // Update chart colors
        if (this.currentPage === 'analytics') {
            setTimeout(() => this.updateCharts(), 100);
        }
    },

    // =========================================
    // Trade Calculations
    // =========================================
    calculatePnl(form) {
        const isQuick = form === 'quick';
        const entry = parseFloat(isQuick ? this.elements.quickEntry?.value : this.elements.entryPrice?.value);
        const exit = parseFloat(isQuick ? this.elements.quickExit?.value : this.elements.exitPrice?.value);
        const size = parseFloat(isQuick ? this.elements.quickSize?.value : this.elements.positionSize?.value);
        const direction = isQuick ? this.elements.quickDirection?.value : this.elements.tradeDirection?.value;

        if (isNaN(entry) || isNaN(exit) || isNaN(size) || !direction) return;

        let pnl = 0;
        if (direction === 'long') {
            pnl = (exit - entry) * size;
        } else {
            pnl = (entry - exit) * size;
        }

        const formatted = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
        const target = isQuick ? this.elements.quickPnl : this.elements.calculatedPnl;
        if (target) {
            target.value = formatted;
            target.style.color = pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        }
    },

    computeTradePnl(trade) {
        const entry = parseFloat(trade.entryPrice);
        const exit = parseFloat(trade.exitPrice);
        const size = parseFloat(trade.positionSize);

        if (isNaN(entry) || isNaN(exit) || isNaN(size)) return 0;

        if (trade.direction === 'long') {
            return (exit - entry) * size;
        } else {
            return (entry - exit) * size;
        }
    },

    // =========================================
    // Trade CRUD
    // =========================================
    addTrade(form) {
        const isQuick = form === 'quick';
        const els = this.elements;

        const trade = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            date: isQuick ? els.quickDate?.value : els.tradeDate?.value,
            asset: (isQuick ? els.quickAsset?.value : els.tradeAsset?.value)?.toUpperCase().trim(),
            type: isQuick ? els.quickType?.value : els.tradeType?.value,
            direction: isQuick ? els.quickDirection?.value : els.tradeDirection?.value,
            entryPrice: parseFloat(isQuick ? els.quickEntry?.value : els.entryPrice?.value),
            exitPrice: parseFloat(isQuick ? els.quickExit?.value : els.exitPrice?.value),
            positionSize: parseFloat(isQuick ? els.quickSize?.value : els.positionSize?.value),
            setup: (isQuick ? els.quickSetup?.value : els.tradeSetup?.value)?.trim() || 'General',
            notes: (isQuick ? els.quickNotes?.value : els.tradeNotes?.value)?.trim() || '',
            createdAt: new Date().toISOString(),
        };

        // Validation
        if (!trade.date || !trade.asset || !trade.type || !trade.direction ||
            isNaN(trade.entryPrice) || isNaN(trade.exitPrice) || isNaN(trade.positionSize)) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Compute P&L
        trade.pnl = this.computeTradePnl(trade);

        this.trades.unshift(trade);
        this.saveTrades();
        this.refreshSetupOptions();
        this.updateUI();

        // Reset form
        if (isQuick) {
            els.quickTradeForm?.reset();
            els.quickDate.value = new Date().toISOString().split('T')[0];
            els.quickPnl.value = '';
            this.closeQuickTrade();
        } else {
            els.tradeForm?.reset();
            els.tradeDate.value = new Date().toISOString().split('T')[0];
            els.calculatedPnl.value = '';
        }

        this.showToast('Trade added successfully!', 'success');

        // If on analytics, refresh charts
        if (this.currentPage === 'analytics') {
            this.updateCharts();
        }
    },

    deleteTrade(id) {
        if (!confirm('Are you sure you want to delete this trade?')) return;
        this.trades = this.trades.filter(t => t.id !== id);
        this.saveTrades();
        this.refreshSetupOptions();
        this.renderTrades();
        this.updateStats();
        this.updateCharts();
        this.showToast('Trade deleted', 'info');
    },

    // =========================================
    // Data Persistence
    // =========================================
    loadTrades() {
        try {
            const data = localStorage.getItem('kanix-trades');
            if (data) {
                this.trades = JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load trades:', e);
            this.trades = [];
        }

        // Load demo data if empty and not already loaded
        if (this.trades.length === 0 && !this.demoLoaded) {
            this.loadDemoData();
        }
    },

    saveTrades() {
        try {
            localStorage.setItem('kanix-trades', JSON.stringify(this.trades));
        } catch (e) {
            console.error('Failed to save trades:', e);
            this.showToast('Failed to save data. Storage may be full.', 'error');
        }
    },

    // =========================================
    // Setup Options (datalist + filter dropdown)
    // =========================================
    refreshSetupOptions() {
        const defaultSetups = [
            'Elliott Wave - Impulse Wave 3',
            'Elliott Wave - Wave 5 Extension',
            'Elliott Wave - ABC Correction',
            'Elliott Wave - Wave 4 Triangle',
            'Order Flow - Imbalance Breakout',
            'Order Flow - Absorption Reversal',
            'Breakout Retest',
            'Support / Resistance Bounce',
            'Trend Continuation',
            'Reversal / Divergence',
        ];

        const usedSetups = Array.from(new Set(
            this.trades.map(t => t.setup).filter(Boolean)
        ));

        // Datalist: defaults + custom setups the user has typed before
        const allSetups = Array.from(new Set([...defaultSetups, ...usedSetups])).sort();
        const datalist = document.getElementById('setupOptions');
        if (datalist) {
            datalist.innerHTML = allSetups
                .map(s => `<option value="${this.escapeHtml(s)}"></option>`)
                .join('');
        }

        // Filter dropdown: only setups actually used in trades
        const filterSetup = this.elements.filterSetup;
        if (filterSetup) {
            const current = filterSetup.value;
            const sortedUsed = usedSetups.sort();
            filterSetup.innerHTML = '<option value="">All Setups</option>' +
                sortedUsed.map(s => `<option value="${this.escapeHtml(s)}">${this.escapeHtml(s)}</option>`).join('');
            filterSetup.value = sortedUsed.includes(current) ? current : '';
        }
    },

    loadDemoData() {
        this.demoLoaded = true;
        const demoTrades = [
            { id: 'demo1', date: '2026-04-20', asset: 'BTC', type: 'crypto', direction: 'long', setup: 'Elliott Wave - Impulse Wave 3', entryPrice: 68000, exitPrice: 71500, positionSize: 0.5, notes: 'Broke resistance at 70k, strong volume', createdAt: '2026-04-20T10:00:00Z' },
            { id: 'demo2', date: '2026-04-21', asset: 'ETH', type: 'crypto', direction: 'long', setup: 'Elliott Wave - Wave 5 Extension', entryPrice: 3200, exitPrice: 2980, positionSize: 2, notes: 'Stopped out, should have waited for confirmation', createdAt: '2026-04-21T14:00:00Z' },
            { id: 'demo3', date: '2026-04-22', asset: 'EUR/USD', type: 'forex', direction: 'short', setup: 'Order Flow - Imbalance Breakout', entryPrice: 1.0950, exitPrice: 1.0880, positionSize: 10000, notes: 'DXY strength, good technical setup', createdAt: '2026-04-22T09:00:00Z' },
            { id: 'demo4', date: '2026-04-23', asset: 'SOL', type: 'crypto', direction: 'long', setup: 'Breakout Retest', entryPrice: 145, exitPrice: 162, positionSize: 10, notes: 'NFT volume spike, momentum trade', createdAt: '2026-04-23T11:00:00Z' },
            { id: 'demo5', date: '2026-04-24', asset: 'GBP/USD', type: 'forex', direction: 'long', setup: 'Elliott Wave - ABC Correction', entryPrice: 1.2750, exitPrice: 1.2680, positionSize: 5000, notes: 'BoE dovish tone, lost on news', createdAt: '2026-04-24T08:00:00Z' },
            { id: 'demo6', date: '2026-04-25', asset: 'AAPL', type: 'stocks', direction: 'long', setup: 'Breakout Retest', entryPrice: 185.50, exitPrice: 192.30, positionSize: 50, notes: 'Earnings beat, gap up play', createdAt: '2026-04-25T15:00:00Z' },
            { id: 'demo7', date: '2026-04-26', asset: 'XAU/USD', type: 'commodities', direction: 'short', setup: 'Order Flow - Absorption Reversal', entryPrice: 2350, exitPrice: 2320, positionSize: 1, notes: 'Profit taking after ATH', createdAt: '2026-04-26T10:00:00Z' },
            { id: 'demo8', date: '2026-04-27', asset: 'ETH', type: 'crypto', direction: 'short', setup: 'Reversal / Divergence', entryPrice: 3350, exitPrice: 3280, positionSize: 1.5, notes: 'Overextended on daily, RSI divergence', createdAt: '2026-04-27T13:00:00Z' },
            { id: 'demo9', date: '2026-04-28', asset: 'USD/JPY', type: 'forex', direction: 'long', setup: 'Elliott Wave - Impulse Wave 3', entryPrice: 152.30, exitPrice: 153.80, positionSize: 8000, notes: 'Carry trade momentum, BOJ intervention risk managed', createdAt: '2026-04-28T09:00:00Z' },
            { id: 'demo10', date: '2026-04-28', asset: 'BTC', type: 'crypto', direction: 'short', setup: 'Reversal / Divergence', entryPrice: 72000, exitPrice: 73500, positionSize: 0.3, notes: 'FOMO short, wrong timing. Lesson: wait for structure', createdAt: '2026-04-28T16:00:00Z' },
        ];

        this.trades = demoTrades.map(t => ({
            ...t,
            pnl: this.computeTradePnl(t)
        }));

        this.saveTrades();
    },

    // =========================================
    // Trade Table Rendering
    // =========================================
    renderTrades() {
        const { tradesTableBody, emptyState, searchTrades, filterType, filterSetup, filterResult } = this.elements;
        if (!tradesTableBody) return;

        const search = searchTrades?.value?.toLowerCase() || '';
        const typeFilter = filterType?.value || '';
        const setupFilter = filterSetup?.value || '';
        const resultFilter = filterResult?.value || '';

        let filtered = this.trades.filter(t => {
            const matchesSearch = !search ||
                t.asset.toLowerCase().includes(search) ||
                t.notes.toLowerCase().includes(search) ||
                t.type.toLowerCase().includes(search) ||
                (t.setup || '').toLowerCase().includes(search);
            const matchesType = !typeFilter || t.type === typeFilter;
            const matchesSetup = !setupFilter || t.setup === setupFilter;
            const matchesResult = !resultFilter ||
                (resultFilter === 'win' && t.pnl > 0) ||
                (resultFilter === 'loss' && t.pnl < 0);

            return matchesSearch && matchesType && matchesSetup && matchesResult;
        });

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            tradesTableBody.innerHTML = '';
            emptyState?.classList.add('active');
            return;
        }

        emptyState?.classList.remove('active');

        tradesTableBody.innerHTML = filtered.map(trade => {
            const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
            const pnlSign = trade.pnl >= 0 ? '+' : '-';
            const pnlValue = `${pnlSign}$${Math.abs(trade.pnl).toFixed(2)}`;
            const directionClass = trade.direction === 'long' ? 'direction-long' : 'direction-short';
            const directionArrow = trade.direction === 'long' ? '&#9650;' : '&#9660;';

            return `
                <tr data-id="${trade.id}">
                    <td>${this.formatDate(trade.date)}</td>
                    <td class="trade-asset">${this.escapeHtml(trade.asset)}</td>
                    <td><span class="trade-type type-${trade.type}">${trade.type}</span></td>
                    <td class="trade-direction ${directionClass}">${directionArrow} ${trade.direction}</td>
                    <td><span class="setup-tag">${this.escapeHtml(trade.setup || 'General')}</span></td>
                    <td class="trade-price">${parseFloat(trade.entryPrice).toLocaleString()}</td>
                    <td class="trade-price">${parseFloat(trade.exitPrice).toLocaleString()}</td>
                    <td class="trade-pnl ${pnlClass}">${pnlValue}</td>
                    <td class="trade-notes" title="${this.escapeHtml(trade.notes)}">${this.escapeHtml(trade.notes) || '-'}</td>
                    <td>
                        <button class="trade-delete" onclick="app.deleteTrade('${trade.id}')" aria-label="Delete trade">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // =========================================
    // Statistics & Analytics
    // =========================================
    calculateStats() {
        const trades = this.trades;
        const total = trades.length;
        if (total === 0) {
            return {
                total: 0, wins: 0, losses: 0, winRate: 0,
                cryptoWinRate: 0, forexWinRate: 0,
                totalPnl: 0, avgTrade: 0,
                setupStats: []
            };
        }

        const wins = trades.filter(t => t.pnl > 0);
        const losses = trades.filter(t => t.pnl < 0);
        const winRate = (wins.length / total * 100).toFixed(1);

        // Crypto stats
        const cryptoTrades = trades.filter(t => t.type === 'crypto');
        const cryptoWins = cryptoTrades.filter(t => t.pnl > 0);
        const cryptoWinRate = cryptoTrades.length > 0
            ? (cryptoWins.length / cryptoTrades.length * 100).toFixed(1)
            : 0;

        // Forex stats
        const forexTrades = trades.filter(t => t.type === 'forex');
        const forexWins = forexTrades.filter(t => t.pnl > 0);
        const forexWinRate = forexTrades.length > 0
            ? (forexWins.length / forexTrades.length * 100).toFixed(1)
            : 0;

        const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
        const avgTrade = totalPnl / total;

        // Per-setup stats (win rate per trading setup)
        const setupMap = {};
        trades.forEach(t => {
            const key = t.setup || 'General';
            if (!setupMap[key]) {
                setupMap[key] = { setup: key, total: 0, wins: 0, losses: 0, pnl: 0 };
            }
            setupMap[key].total++;
            if (t.pnl > 0) setupMap[key].wins++;
            else if (t.pnl < 0) setupMap[key].losses++;
            setupMap[key].pnl += t.pnl;
        });
        const setupStats = Object.values(setupMap)
            .map(s => ({
                ...s,
                winRate: s.total > 0 ? (s.wins / s.total * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => b.total - a.total);

        return {
            total, wins: wins.length, losses: losses.length, winRate,
            cryptoWinRate, forexWinRate,
            totalPnl, avgTrade,
            setupStats
        };
    },

    updateStats() {
        const stats = this.calculateStats();
        const els = this.elements;

        // Hero stats
        if (els.heroTotalTrades) els.heroTotalTrades.textContent = stats.total;
        if (els.heroWinRate) els.heroWinRate.textContent = `${stats.winRate}%`;
        if (els.heroPnl) {
            const pnlValue = stats.totalPnl >= 0
                ? `+$${stats.totalPnl.toFixed(0)}`
                : `-$${Math.abs(stats.totalPnl).toFixed(0)}`;
            els.heroPnl.textContent = pnlValue;
            els.heroPnl.style.color = stats.totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        }

        // Analytics page stats
        if (els.totalTrades) els.totalTrades.textContent = stats.total;
        if (els.totalWinRate) els.totalWinRate.textContent = `${stats.winRate}%`;
        if (els.cryptoWinRate) els.cryptoWinRate.textContent = `${stats.cryptoWinRate}%`;
        if (els.forexWinRate) els.forexWinRate.textContent = `${stats.forexWinRate}%`;
        if (els.totalPnl) {
            els.totalPnl.textContent = stats.totalPnl >= 0
                ? `+$${stats.totalPnl.toFixed(2)}`
                : `-$${Math.abs(stats.totalPnl).toFixed(2)}`;
            els.totalPnl.style.color = stats.totalPnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        }
        if (els.avgTrade) {
            els.avgTrade.textContent = stats.avgTrade >= 0
                ? `+$${stats.avgTrade.toFixed(2)}`
                : `-$${Math.abs(stats.avgTrade).toFixed(2)}`;
            els.avgTrade.style.color = stats.avgTrade >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        }

        // Setup performance table
        if (els.setupTableBody) {
            if (stats.setupStats.length === 0) {
                els.setupTableBody.innerHTML = '';
                els.setupEmptyState?.classList.add('active');
            } else {
                els.setupEmptyState?.classList.remove('active');
                els.setupTableBody.innerHTML = stats.setupStats.map(s => {
                    const pnlClass = s.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
                    const pnlValue = `${s.pnl >= 0 ? '+' : '-'}$${Math.abs(s.pnl).toFixed(2)}`;
                    const wrClass = parseFloat(s.winRate) >= 50 ? 'pnl-positive' : 'pnl-negative';
                    return `
                        <tr>
                            <td class="setup-name">${this.escapeHtml(s.setup)}</td>
                            <td>${s.total}</td>
                            <td class="pnl-positive">${s.wins}</td>
                            <td class="pnl-negative">${s.losses}</td>
                            <td class="${wrClass}">${s.winRate}%</td>
                            <td class="trade-pnl ${pnlClass}">${pnlValue}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    },

    // =========================================
    // Charts
    // =========================================
    getChartColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            text: isDark ? '#8a8aa3' : '#5a5a75',
            grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            cyan: '#00d4ff',
            purple: '#7c3aed',
            pink: '#ec4899',
            green: '#10b981',
            red: '#ef4444',
            orange: '#f59e0b',
        };
    },

    initCharts() {
        // Charts will be created on demand when analytics page is viewed
    },

    updateCharts() {
        const c = this.getChartColors();
        const stats = this.calculateStats();

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart?.destroy?.());

        // 1. P&L Over Time (Line Chart)
        const pnlCtx = document.getElementById('pnlChart')?.getContext('2d');
        if (pnlCtx) {
            const sorted = [...this.trades].sort((a, b) => new Date(a.date) - new Date(b.date));
            let cumulative = 0;
            const labels = [];
            const data = [];

            sorted.forEach(trade => {
                cumulative += trade.pnl;
                labels.push(this.formatDateShort(trade.date));
                data.push(cumulative);
            });

            this.charts.pnl = new Chart(pnlCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Cumulative P&L',
                        data,
                        borderColor: c.cyan,
                        backgroundColor: `${c.cyan}15`,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: c.cyan,
                        pointBorderColor: 'transparent',
                        pointHoverRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(10, 10, 15, 0.9)',
                            titleColor: c.text,
                            bodyColor: c.cyan,
                            borderColor: c.grid,
                            borderWidth: 1,
                            callbacks: {
                                label: (ctx) => `P&L: $${ctx.raw.toFixed(2)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: c.grid },
                            ticks: { color: c.text, font: { size: 11 } }
                        },
                        y: {
                            grid: { color: c.grid },
                            ticks: {
                                color: c.text,
                                font: { size: 11 },
                                callback: (v) => `$${v.toFixed(0)}`
                            }
                        }
                    }
                }
            });
        }

        // 2. Win vs Loss (Doughnut)
        const winLossCtx = document.getElementById('winLossChart')?.getContext('2d');
        if (winLossCtx) {
            this.charts.winLoss = new Chart(winLossCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Wins', 'Losses'],
                    datasets: [{
                        data: [stats.wins, stats.losses],
                        backgroundColor: [c.green, c.red],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: c.text, font: { size: 12 }, padding: 20 }
                        }
                    }
                }
            });
        }

        // 3. Performance by Asset Type (Bar)
        const typeCtx = document.getElementById('typeChart')?.getContext('2d');
        if (typeCtx) {
            const types = ['crypto', 'forex', 'stocks', 'commodities'];
            const typePnl = types.map(type => {
                return this.trades
                    .filter(t => t.type === type)
                    .reduce((sum, t) => sum + t.pnl, 0);
            });

            this.charts.type = new Chart(typeCtx, {
                type: 'bar',
                data: {
                    labels: ['Crypto', 'Forex', 'Stocks', 'Commodities'],
                    datasets: [{
                        label: 'P&L',
                        data: typePnl,
                        backgroundColor: [c.cyan, c.orange, c.green, c.pink],
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: c.text, font: { size: 11 } }
                        },
                        y: {
                            grid: { color: c.grid },
                            ticks: {
                                color: c.text,
                                font: { size: 11 },
                                callback: (v) => `$${v.toFixed(0)}`
                            }
                        }
                    }
                }
            });
        }

        // 4. Monthly Performance (Bar)
        const monthlyCtx = document.getElementById('monthlyChart')?.getContext('2d');
        if (monthlyCtx) {
            const monthlyMap = {};
            this.trades.forEach(trade => {
                const month = trade.date.substring(0, 7); // YYYY-MM
                monthlyMap[month] = (monthlyMap[month] || 0) + trade.pnl;
            });

            const sortedMonths = Object.keys(monthlyMap).sort();
            const monthLabels = sortedMonths.map(m => {
                const [year, month] = m.split('-');
                return `${month}/${year}`;
            });
            const monthData = sortedMonths.map(m => monthlyMap[m]);

            this.charts.monthly = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Monthly P&L',
                        data: monthData,
                        backgroundColor: monthData.map(v => v >= 0 ? c.purple : c.red),
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: c.text, font: { size: 11 } }
                        },
                        y: {
                            grid: { color: c.grid },
                            ticks: {
                                color: c.text,
                                font: { size: 11 },
                                callback: (v) => `$${v.toFixed(0)}`
                            }
                        }
                    }
                }
            });
        }

        // 5. Win Rate by Setup (Horizontal Bar)
        const setupCtx = document.getElementById('setupChart')?.getContext('2d');
        if (setupCtx) {
            const setupData = [...stats.setupStats]
                .sort((a, b) => b.total - a.total)
                .slice(0, 8);

            this.charts.setup = new Chart(setupCtx, {
                type: 'bar',
                data: {
                    labels: setupData.map(s => s.setup),
                    datasets: [{
                        label: 'Win Rate %',
                        data: setupData.map(s => parseFloat(s.winRate)),
                        backgroundColor: setupData.map(s => parseFloat(s.winRate) >= 50 ? c.green : c.red),
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(10, 10, 15, 0.9)',
                            titleColor: c.text,
                            bodyColor: c.cyan,
                            borderColor: c.grid,
                            borderWidth: 1,
                            callbacks: {
                                label: (ctx) => {
                                    const s = setupData[ctx.dataIndex];
                                    return `Win Rate: ${s.winRate}% (${s.wins}/${s.total})`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 0,
                            max: 100,
                            grid: { color: c.grid },
                            ticks: {
                                color: c.text,
                                font: { size: 11 },
                                callback: (v) => `${v}%`
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: c.text, font: { size: 10 } }
                        }
                    }
                }
            });
        }
    },

    // =========================================
    // UI Updates
    // =========================================
    updateUI() {
        this.renderTrades();
        this.updateStats();
    },

    // =========================================
    // Modal
    // =========================================
    openQuickTrade() {
        this.elements.quickTradeModal?.classList.add('open');
        document.body.style.overflow = 'hidden';
    },

    closeQuickTrade() {
        this.elements.quickTradeModal?.classList.remove('open');
        document.body.style.overflow = '';
    },

    // =========================================
    // Toast Notifications
    // =========================================
    showToast(message, type = 'info') {
        const container = this.elements.toastContainer;
        if (!container) return;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <span class="toast-message">${this.escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // =========================================
    // Utilities
    // =========================================
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
    },

    formatDateShort(dateStr) {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}`;
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
