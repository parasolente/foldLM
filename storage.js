/**
 * NotebookLM Folders - Storage Module
 * Handles persistence of folder data using chrome.storage.local
 */

const FolderStorage = {
    DEFAULT_STORAGE_KEY: 'nlm_folders',
    accountId: null,

    /**
     * Set the current account ID (email)
     * @param {string} email 
     */
    setAccountId(email) {
        this.accountId = email;
    },

    /**
     * Get the storage key for the current account
     */
    get STORAGE_KEY() {
        if (!this.accountId) return this.DEFAULT_STORAGE_KEY;
        // Clean email to use as key (remove special characters)
        const safeId = this.accountId.replace(/[^a-zA-Z0-9]/g, '_');
        return `nlm_folders_${safeId}`;
    },

    /**
     * Check if the extension context is still valid.
     * When an extension is reloaded or updated, the content scripts in existing
     * tabs lose their connection to the extension.
     */
    isContextValid() {
        return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
    },

    /**
     * Get all folders from storage
     * @returns {Promise<Array>} Array of folder objects
     */
    async getFolders() {
        if (!this.isContextValid()) {
            console.log('NotebookLM Folders: Extension context invalidated. Action ignored.');
            return [];
        }

        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            return result[this.STORAGE_KEY] || [];
        } catch (error) {
            // Suppress error in dashboard if it's a context invalidated error
            if (error.message?.includes('Extension context invalidated')) {
                console.log('FolderStorage: Context invalidated while getting folders.');
            } else {
                console.error('FolderStorage: Error getting folders', error);
            }
            return [];
        }
    },

    /**
     * Save all folders to storage
     * @param {Array} folders - Array of folder objects
     */
    async saveFolders(folders) {
        if (!this.isContextValid()) return;

        try {
            await chrome.storage.local.set({ [this.STORAGE_KEY]: folders });
        } catch (error) {
            if (error.message?.includes('Extension context invalidated')) {
                console.log('FolderStorage: Context invalidated while saving folders.');
            } else {
                console.error('FolderStorage: Error saving folders', error);
            }
        }
    },

    /**
     * Create a new folder
     * @param {Object} folderData - { name, emoji, color }
     * @returns {Promise<Object>} The created folder
     */
    async createFolder(folderData) {
        const folders = await this.getFolders();
        const newFolder = {
            id: 'folder_' + Date.now(),
            name: folderData.name || 'New Folder',
            emoji: folderData.emoji || '📁',
            color: folderData.color || '#f8ccc8',
            notebooks: [],
            createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        await this.saveFolders(folders);
        return newFolder;
    },

    /**
     * Update a folder
     * @param {string} folderId - Folder ID
     * @param {Object} updates - Fields to update
     */
    async updateFolder(folderId, updates) {
        const folders = await this.getFolders();
        const index = folders.findIndex(f => f.id === folderId);
        if (index !== -1) {
            folders[index] = { ...folders[index], ...updates };
            await this.saveFolders(folders);
            return folders[index];
        }
        return null;
    },

    /**
     * Delete a folder
     * @param {string} folderId - Folder ID
     */
    async deleteFolder(folderId) {
        const folders = await this.getFolders();
        const filtered = folders.filter(f => f.id !== folderId);
        await this.saveFolders(filtered);
    },

    /**
     * Add a notebook to a folder
     * @param {string} folderId - Folder ID
     * @param {Object} notebookData - { id, title, emoji, color, date, sources }
     */
    async addNotebookToFolder(folderId, notebookData) {
        const folders = await this.getFolders();
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            // Check if notebook already exists
            const exists = folder.notebooks.some(n => n.id === notebookData.id);
            if (!exists) {
                folder.notebooks.push(notebookData);
                await this.saveFolders(folders);
            }
            return folder;
        }
        return null;
    },

    /**
     * Remove a notebook from a folder
     * @param {string} folderId - Folder ID
     * @param {string} notebookId - Notebook ID
     */
    async removeNotebookFromFolder(folderId, notebookId) {
        const folders = await this.getFolders();
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
            folder.notebooks = folder.notebooks.filter(n => n.id !== notebookId);
            await this.saveFolders(folders);
            return folder;
        }
        return null;
    },

    /**
     * Get folder containing a specific notebook
     * @param {string} notebookId - Notebook ID
     * @returns {Promise<Object|null>} Folder containing the notebook or null
     */
    async getFolderByNotebook(notebookId) {
        const folders = await this.getFolders();
        return folders.find(f => f.notebooks.some(n => n.id === notebookId)) || null;
    },

    async getNotebooksInFolders() {
        const folders = await this.getFolders();
        const notebookIds = new Set();
        folders.forEach(folder => {
            folder.notebooks.forEach(n => notebookIds.add(n.id));
        });
        return notebookIds;
    },

    /**
     * Save view preference (list or grid)
     * @param {string} view - 'list' or 'grid'
     */
    async saveViewPreference(view) {
        if (!this.isContextValid()) return;
        try {
            await chrome.storage.local.set({ nlm_view_pref: view });
        } catch (error) {
            console.error('FolderStorage: Error saving view preference', error);
        }
    },

    /**
     * Get view preference
     * @returns {Promise<string>} 'list' or 'grid' (default 'list')
     */
    async getViewPreference() {
        if (!this.isContextValid()) return 'list';
        try {
            const result = await chrome.storage.local.get('nlm_view_pref');
            return result.nlm_view_pref || 'list';
        } catch (error) {
            console.error('FolderStorage: Error getting view preference', error);
            return 'list';
        }
    }
};

// Make available globally
window.FolderStorage = FolderStorage;
