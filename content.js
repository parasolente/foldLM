/**
 * NotebookLM Folders - Main Content Script
 * Initializes all modules and coordinates functionality
 */

(function () {
    'use strict';

    'use strict';

    /**
     * Wait for page to be ready
     */
    function waitForPageReady() {
        return new Promise((resolve) => {
            const check = () => {
                // Check if the main container exists
                const container = document.querySelector('.my-projects-container, .all-projects-container, .project-buttons-flow');
                if (container) {
                    resolve();
                } else {
                    setTimeout(check, 500);
                }
            };

            if (document.readyState === 'complete') {
                check();
            } else {
                window.addEventListener('load', check);
            }
        });
    }

    /**
     * Detect the currently logged-in user account
     * Looks for email in common Google UI elements or aria-labels
     */
    function detectUserAccount() {
        // Try to find the email in the account switcher button or top-right profile area
        // Google often uses aria-label="Google Account: Name (email@gmail.com)"
        const accountInfo = document.querySelector('[aria-label*="@gmail.com"], [aria-label*="Google Account"]');
        if (accountInfo) {
            const label = accountInfo.getAttribute('aria-label');
            const emailMatch = label.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
            if (emailMatch) return emailMatch[1];
        }

        // Fallback: look for profile picture or similar elements that might contain email
        const profileImg = document.querySelector('img[src*="googleusercontent.com"]');
        if (profileImg && profileImg.title && profileImg.title.includes('@')) {
            return profileImg.title;
        }

        return null;
    }

    let currentAccount = null;

    /**
     * Theme Manager to handle light/dark mode
     */
    const ThemeManager = {
        /**
         * Detect the current theme of NotebookLM
         */
        detectTheme() {
            // Check for data-theme attribute on <html> or <body>
            const themeAttr = document.documentElement.getAttribute('data-theme') ||
                document.body.getAttribute('data-theme') ||
                document.documentElement.getAttribute('theme');

            if (themeAttr === 'dark') return 'dark';
            if (themeAttr === 'light') return 'light';

            // Check for classes
            if (document.body.classList.contains('dark-theme') ||
                document.documentElement.classList.contains('dark-theme')) return 'dark';

            // Check for prefers-color-scheme
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }

            return 'light';
        },

        /**
         * Apply the theme to our extension elements
         */
        applyTheme() {
            const theme = this.detectTheme();
            const isDark = theme === 'dark';
            const hasClass = document.body.classList.contains('nlm-dark-theme');

            // Only update if state actually changed to avoid MutationObserver loops
            if (isDark && !hasClass) {
                document.body.classList.add('nlm-dark-theme');
            } else if (!isDark && hasClass) {
                document.body.classList.remove('nlm-dark-theme');
            }
        },

        /**
         * Initialize theme observation
         */
        init() {
            this.applyTheme();

            // Observe attribute changes on html/body for theme toggles
            this.observer = new MutationObserver(() => {
                // Use requestAnimationFrame to avoid blocking the main thread during heavy DOM updates
                requestAnimationFrame(() => this.applyTheme());
            });

            this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'theme'] });
            this.observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                    this.applyTheme();
                });
            }
        }
    };

    let isInitializing = false;

    /**
     * Initialize the extension
     */
    async function init() {
        if (isInitializing) return;
        isInitializing = true;

        try {
            await waitForPageReady();

            // Initialize theme manager
            ThemeManager.init();

            // Detect account
            const account = detectUserAccount();

            // If account changed, we might need to clear previous UI
            if (account !== currentAccount) {
                currentAccount = account;
                if (account) {
                    FolderStorage.setAccountId(account);
                }

                // Clear existing folders section to force re-render with new account data
                const existingSection = document.querySelector('.nlm-folders-section');
                if (existingSection) {
                    existingSection.remove();
                }

                // Also clear any open modals
                if (FolderUI.modalOverlay) {
                    FolderUI.modalOverlay.classList.remove('visible');
                    // Give it some time to finish transition if any
                    setTimeout(() => {
                        const contentArea = FolderUI.modalOverlay.querySelector('.nlm-folder-modal-content');
                        if (contentArea) contentArea.innerHTML = '';
                    }, 200);
                }
            }

            // Initialize UI (creates folder section and modals)
            FolderUI.init();

            // Initialize drag & drop
            DragDrop.init();

            // Hide notebooks that are already in folders
            setTimeout(() => {
                DragDrop.hideNotebooksInFolders();
            }, 1500);

        } catch (error) {
            console.error('🗂️ NotebookLM Folders initialization error:', error);
        } finally {
            isInitializing = false;
        }
    }

    // Start initialization
    init();

    // Re-initialize when navigating (SPA navigation)
    let lastUrl = location.href;
    let reinjectTimeout;

    new MutationObserver(() => {
        // 1. URL Change Check
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            if (location.pathname === '/' || location.pathname === '') {
                setTimeout(init, 1000);
            }
        }

        // 2. DOM Consistency Check (Robust Keep-Alive)
        // If the target container exists but our section is missing, we must re-inject.
        const foldersSection = document.querySelector('.nlm-folders-section');
        const targetContainer = document.querySelector('.my-projects-container, .all-projects-container, .project-buttons-flow');

        if (targetContainer && !foldersSection) {
            clearTimeout(reinjectTimeout);
            // Short debounce to wait for DOM stability
            reinjectTimeout = setTimeout(() => {
                if (document.querySelector('.my-projects-container, .all-projects-container, .project-buttons-flow') && !document.querySelector('.nlm-folders-section')) {
                    FolderUI.init();
                }
            }, 500);
        }
    }).observe(document.body, { subtree: true, childList: true });

})();
