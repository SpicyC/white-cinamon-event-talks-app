// Global State
let allUpdates = [];
let activeCategory = 'all';
let searchQuery = '';

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const spinner = document.getElementById('spinner');
const searchInput = document.getElementById('search-input');
const filterBtns = document.querySelectorAll('.filter-btn');
const timeline = document.getElementById('timeline');

// State Containers
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const emptyState = document.getElementById('empty-state');

// Twitter Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetText = document.getElementById('tweet-text');
const charCount = document.getElementById('char-count');
const tweetCancelBtn = document.getElementById('tweet-cancel-btn');
const tweetSendBtn = document.getElementById('tweet-send-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
    setupDialogLightDismiss();
});

// Setup Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Search with basic debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTimeline();
        }, 250);
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-category');
            renderTimeline();
        });
    });

    // Twitter Modal Actions
    tweetText.addEventListener('input', () => {
        const remaining = tweetText.value.length;
        charCount.textContent = remaining;
        if (remaining >= 260) {
            charCount.classList.add('warning');
        } else {
            charCount.classList.remove('warning');
        }
    });

    tweetCancelBtn.addEventListener('click', () => tweetModal.close());
    modalCloseBtn.addEventListener('click', () => tweetModal.close());
    
    tweetSendBtn.addEventListener('click', () => {
        const text = tweetText.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterIntentUrl, '_blank');
        tweetModal.close();
    });
}

// Fetch Release Notes
async function fetchReleaseNotes() {
    // Show spinner & loading state
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    showState('loading');

    try {
        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const entries = await response.json();
        
        if (entries.error) {
            throw new Error(entries.error);
        }
        
        // Parse raw XML content html into discrete updates
        allUpdates = [];
        entries.forEach(entry => {
            const parsedUpdates = parseEntryContent(entry.content, entry.title, entry.link);
            allUpdates.push(...parsedUpdates);
        });

        renderTimeline();
    } catch (err) {
        console.error('Error fetching release notes:', err);
        errorMessage.textContent = err.message || 'Check your internet connection and try again.';
        showState('error');
    } finally {
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

// Parse HTML CDATA content into separate update cards
function parseEntryContent(contentHtml, entryTitle, entryLink) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    const nodes = Array.from(doc.body.children);
    
    const updates = [];
    let currentType = null;
    let currentHtml = '';
    
    nodes.forEach(node => {
        if (node.tagName === 'H3') {
            if (currentType && currentHtml.trim()) {
                updates.push({
                    type: currentType,
                    html: currentHtml,
                    title: entryTitle,
                    link: entryLink
                });
            }
            currentType = node.textContent.trim();
            currentHtml = '';
        } else {
            currentHtml += node.outerHTML;
        }
    });
    
    if (currentType && currentHtml.trim()) {
        updates.push({
            type: currentType,
            html: currentHtml,
            title: entryTitle,
            link: entryLink
        });
    }
    
    // Fallback if no H3 headings found
    if (updates.length === 0 && contentHtml.trim()) {
        updates.push({
            type: 'Announcement',
            html: contentHtml,
            title: entryTitle,
            link: entryLink
        });
    }
    
    return updates;
}

// Filter and render updates
function renderTimeline() {
    // 1. Filter
    const filtered = allUpdates.filter(up => {
        const matchesCategory = activeCategory === 'all' || up.type.toLowerCase() === activeCategory.toLowerCase();
        
        const plainText = new DOMParser().parseFromString(up.html, 'text/html').body.textContent.toLowerCase();
        const matchesSearch = searchQuery === '' || 
                              up.type.toLowerCase().includes(searchQuery) || 
                              up.title.toLowerCase().includes(searchQuery) ||
                              plainText.includes(searchQuery);
                              
        return matchesCategory && matchesSearch;
    });

    // 2. Handle empty states
    if (allUpdates.length === 0) {
        showState('error');
        return;
    }
    
    if (filtered.length === 0) {
        showState('empty');
        return;
    }

    showState('timeline');
    timeline.innerHTML = '';

    // 3. Group by date title
    const groups = {};
    filtered.forEach(up => {
        if (!groups[up.title]) {
            groups[up.title] = [];
        }
        groups[up.title].push(up);
    });

    // 4. Render timeline groups
    Object.keys(groups).forEach(dateTitle => {
        const groupEl = document.createElement('section');
        groupEl.className = 'timeline-group';
        
        const markerEl = document.createElement('div');
        markerEl.className = 'timeline-date-marker';
        markerEl.innerHTML = `
            <span class="timeline-node"></span>
            <h2 class="timeline-date-text">${dateTitle}</h2>
        `;
        
        const cardsEl = document.createElement('div');
        cardsEl.className = 'timeline-cards';
        
        groups[dateTitle].forEach(up => {
            const card = document.createElement('article');
            card.className = 'update-card';
            
            const lowerType = up.type.toLowerCase();
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="type-tag ${lowerType}">${up.type}</span>
                    <div class="card-actions">
                        <button class="action-btn copy-btn" aria-label="Copy update to clipboard" title="Copy to clipboard">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                        <button class="action-btn tweet-btn" aria-label="Share update on Twitter" title="Share on Twitter">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${up.html}
                </div>
            `;
            
            // Hook up copy click handler
            const copyBtn = card.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                const plainText = new DOMParser().parseFromString(up.html, 'text/html').body.textContent.trim().replace(/\s+/g, ' ');
                const copyText = `BigQuery ${up.type} (${up.title}): ${plainText}\nRead more: ${up.link}`;
                
                navigator.clipboard.writeText(copyText).then(() => {
                    copyBtn.classList.add('copied');
                    const originalSvg = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:1.15rem; height:1.15rem;">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    `;
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = originalSvg;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });

            // Hook up tweet click handler
            card.querySelector('.tweet-btn').addEventListener('click', () => {
                openTweetComposer(up);
            });
            
            cardsEl.appendChild(card);
        });
        
        groupEl.appendChild(markerEl);
        groupEl.appendChild(cardsEl);
        timeline.appendChild(groupEl);
    });
}

// Open tweet composer with content draft
function openTweetComposer(update) {
    const plainText = new DOMParser().parseFromString(update.html, 'text/html').body.textContent.trim().replace(/\s+/g, ' ');
    
    // Truncate logic. Twitter reserves 23 characters for URLs.
    // Total text payload budget: 280 - 23 (URL) - 1 (Space) = 256.
    const prefix = `🐦 BigQuery ${update.type} (${update.title}): "`;
    const suffix = `"\n\nRead details:`;
    const textBudget = 256 - prefix.length - suffix.length;
    
    let summary = plainText;
    if (summary.length > textBudget) {
        summary = summary.substring(0, textBudget - 3) + '...';
    }
    
    const draftText = `${prefix}${summary}${suffix} ${update.link}`;
    
    tweetText.value = draftText;
    charCount.textContent = draftText.length;
    charCount.classList.remove('warning');
    
    // Native modal trigger
    tweetModal.showModal();
}

// UI State Manager
function showState(state) {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    emptyState.classList.add('hidden');
    timeline.classList.add('hidden');

    switch (state) {
        case 'loading':
            loadingState.classList.remove('hidden');
            break;
        case 'error':
            errorState.classList.remove('hidden');
            break;
        case 'empty':
            emptyState.classList.remove('hidden');
            break;
        case 'timeline':
            timeline.classList.remove('hidden');
            break;
    }
}

// Modern Web Guidance: Native Backdrop Dismiss Fallback for Unsupported Browsers
function setupDialogLightDismiss() {
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        tweetModal.addEventListener('click', (event) => {
            if (event.target !== tweetModal) return;

            const rect = tweetModal.getBoundingClientRect();
            const isInside = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );

            if (!isInside) {
                tweetModal.close();
            }
        });
    }
}

// Export active updates to CSV
function exportToCSV() {
    // Filter updates exactly like renderTimeline
    const filtered = allUpdates.filter(up => {
        const matchesCategory = activeCategory === 'all' || up.type.toLowerCase() === activeCategory.toLowerCase();
        
        const plainText = new DOMParser().parseFromString(up.html, 'text/html').body.textContent.toLowerCase();
        const matchesSearch = searchQuery === '' || 
                              up.type.toLowerCase().includes(searchQuery) || 
                              up.title.toLowerCase().includes(searchQuery) ||
                              plainText.includes(searchQuery);
                              
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) return;

    // Define CSV header
    const headers = ['Date', 'Category', 'Update Content', 'Link'];
    
    // Process updates into rows
    const rows = filtered.map(up => {
        const plainText = new DOMParser().parseFromString(up.html, 'text/html').body.textContent.trim().replace(/\s+/g, ' ');
        
        // Escape quotes by doubling them
        const cleanDate = `"${up.title.replace(/"/g, '""')}"`;
        const cleanCategory = `"${up.type.replace(/"/g, '""')}"`;
        const cleanText = `"${plainText.replace(/"/g, '""')}"`;
        const cleanLink = `"${up.link.replace(/"/g, '""')}"`;
        
        return [cleanDate, cleanCategory, cleanText, cleanLink];
    });

    // Create CSV Content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Filename prefix
    const categorySlug = activeCategory === 'all' ? 'all' : activeCategory.toLowerCase();
    const searchSlug = searchQuery ? `_${searchQuery.replace(/[^a-z0-9]/gi, '_')}` : '';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `bigquery_releases_${categorySlug}${searchSlug}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
