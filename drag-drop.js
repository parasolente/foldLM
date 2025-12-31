
const DragDrop = {
    draggedElement: null,
    draggedNotebookData: null,

    init() {
        this.setupDragListeners();
        this.observeNewNotebooks();
    },

    setupDragListeners() {
        setTimeout(() => {
            this.makeNotebooksDraggable();
            this.setupFolderDropZones();
        }, 1000);
    },

    makeNotebooksDraggable() {
        const notebooks = document.querySelectorAll('project-button');
        notebooks.forEach(notebook => {
            if (notebook.dataset.dragInitialized) return;
            notebook.dataset.dragInitialized = 'true';

            notebook.setAttribute('draggable', 'true');

            notebook.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, notebook);
            });

            notebook.addEventListener('dragend', (e) => {
                this.handleDragEnd(e, notebook);
            });
        });
    },

    handleDragStart(e, notebook) {
        this.draggedElement = notebook;
        notebook.classList.add('nlm-notebook-dragging');

        const id = notebook.dataset.notebookId || notebook.querySelector('[id*="project-"]')?.id?.replace('project-', '').replace('-title', '').replace('-emoji', '');
        const title = notebook.querySelector('.project-button-title')?.textContent?.trim() || 'Untitled';
        const emoji = notebook.querySelector('.project-button-box-icon')?.textContent?.trim() || '📓';
        const subtitleParts = notebook.querySelectorAll('.project-button-subtitle-part');
        const date = subtitleParts[0]?.textContent?.trim() || '';
        const sources = subtitleParts[1]?.textContent?.trim() || '';

        const card = notebook.querySelector('mat-card');
        const cardColor = card ? this.getBackgroundColor(card) : '#c2e7ff';

        this.draggedNotebookData = {
            id,
            title,
            emoji,
            date,
            sources,
            color: cardColor
        };

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
    },

    getBackgroundColor(element) {
        const color = window.getComputedStyle(element).backgroundColor || 'rgb(194, 231, 255)';
        return this.normalizeColor(color);
    },

    normalizeColor(rgbString) {
        // Map of known dark-mode colors to their light-mode equivalents in NotebookLM
        // This prevents "double-darkening" when capturing colors while in dark mode.
        const colorMap = {
            'rgb(61, 45, 45)': '#F8CCC8',  // Pink
            'rgb(26, 47, 69)': '#C2E7FF',  // Blue
            'rgb(27, 45, 33)': '#C4EED0',  // Green
            'rgb(53, 46, 27)': '#FFF3CD',  // Yellow
            'rgb(38, 27, 53)': '#E8D5F9',  // Purple
            'rgb(29, 44, 44)': '#A8F0F0',  // Cyan
            'rgb(51, 40, 29)': '#FFE5CC',  // Orange
            'rgb(31, 43, 25)': '#D0F0C0',  // Mint
            'rgb(23, 23, 23)': '#F5F5F5',   // Mist (Empty/Default)
            // Common variants seen in high-zoom or different opacity levels
            'rgb(53, 53, 53)': '#F5F5F5',
            'rgb(41, 42, 45)': '#F5F5F5',
            'rgb(50, 52, 62)': '#F5F5F5', // #32343E - specific untitled dark color
            'rgb(71, 71, 75)': '#EDEFFA'  // #47474B - untitled from lightmode seen in darkmode
        };

        const normalized = colorMap[rgbString];
        if (normalized) return normalized;

        // If not in map, return as is (but convert to hex if possible for storage consistency)
        return this.rgbToHex(rgbString);
    },

    rgbToHex(rgb) {
        if (!rgb || !rgb.startsWith('rgb')) return rgb;
        const [r, g, b] = rgb.match(/\d+/g).map(Number);
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    },

    handleDragEnd(e, notebook) {
        notebook.classList.remove('nlm-notebook-dragging');
        this.draggedElement = null;
        this.draggedNotebookData = null;

        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    },

    setupFolderDropZones() {
        const folders = document.querySelectorAll('.nlm-folder');
        folders.forEach(folder => {
            if (folder.dataset.dropInitialized) return;
            folder.dataset.dropInitialized = 'true';

            folder.addEventListener('dragenter', (e) => {
                e.preventDefault();
                folder.dataset.dragCount = (parseInt(folder.dataset.dragCount) || 0) + 1;
                folder.classList.add('drag-over');
            });

            folder.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            folder.addEventListener('dragleave', (e) => {
                folder.dataset.dragCount = (parseInt(folder.dataset.dragCount) || 0) - 1;
                if (parseInt(folder.dataset.dragCount) <= 0) {
                    folder.dataset.dragCount = 0;
                    folder.classList.remove('drag-over');
                }
            });

            folder.addEventListener('drop', async (e) => {
                e.preventDefault();
                folder.dataset.dragCount = 0;
                folder.classList.remove('drag-over');

                if (this.draggedNotebookData) {
                    const folderId = folder.dataset.folderId;
                    await FolderStorage.addNotebookToFolder(folderId, this.draggedNotebookData);
                    FolderUI.renderFolders();

                    if (this.draggedElement) {
                        this.draggedElement.style.display = 'none';
                    }
                }
            });
        });
    },

    observeNewNotebooks() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.tagName === 'PROJECT-BUTTON' || node.querySelector?.('project-button')) {
                                shouldUpdate = true;
                            }
                            if (node.classList?.contains('nlm-folder')) {
                                shouldUpdate = true;
                            }
                        }
                    });
                }
            });

            if (shouldUpdate) {
                setTimeout(() => {
                    this.makeNotebooksDraggable();
                    this.setupFolderDropZones();
                    this.hideNotebooksInFolders();
                }, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    async hideNotebooksInFolders() {
        const notebookIds = await FolderStorage.getNotebooksInFolders();
        const notebooks = document.querySelectorAll('project-button');

        notebooks.forEach(notebook => {
            const id = notebook.dataset.notebookId ||
                notebook.querySelector('[id*="project-"]')?.id?.replace('project-', '').replace('-title', '').replace('-emoji', '');

            if (id && notebookIds.has(id)) {
                notebook.style.display = 'none';
            } else {
                notebook.style.display = '';
            }
        });
    }
};

window.DragDrop = DragDrop;
