
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

        const id = notebook.dataset.notebookId || notebook.querySelector('[id*="project-"]')?.id?.replace('project-', '').replace('-title', '').replace('-emoji', '').replace('-sharing-status', '');
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
        if (!rgbString || !rgbString.startsWith('rgb')) return rgbString;
        const [r, g, b] = rgbString.match(/\d+/g).map(Number);
        const [h, s, l] = this.rgbToHsl(r, g, b);

        // Official Light Palette (Anchor colors)
        const palette = [
            '#F8CCC8', '#C2E7FF', '#C4EED0', '#FFF3CD',
            '#E8D5F9', '#A8F0F0', '#FFE5CC', '#D0F0C0',
            '#E6E6FA', '#FFE4E1', '#E0F7FA', '#FFDAB9',
            '#F0FFF0', '#F3E5F5', '#FFF5EE', '#F5F5F5',
            '#EDEFFA'
        ];

        // 1. NEUTRAL DETECTION (Grays/Untitled)
        // If saturation is very low, it's a gray/neutral item.
        if (s < 2) {
            // Return either default mist or the slightly blue untitled based on lightness
            return (l > 95) ? '#F5F5F5' : '#EDEFFA';
        }

        // 2. COLOR SNAPPING (Hue matching)
        let closestHex = palette[0];
        let minHueDiff = Infinity;

        for (const hex of palette) {
            const [tr, tg, tb] = this.hexToRgb(hex);
            const [th, ts, tl] = this.rgbToHsl(tr, tg, tb);

            // Skip neutrals in the palette for hue matching
            if (ts < 5) continue;

            // Calculate circular Hue difference (0-360)
            let diff = Math.abs(h - th);
            if (diff > 180) diff = 360 - diff;

            if (diff < minHueDiff) {
                minHueDiff = diff;
                closestHex = hex;
            }
        }

        return closestHex;
    },

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 360, s * 100, l * 100];
    },

    hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
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
                notebook.querySelector('[id*="project-"]')?.id?.replace('project-', '').replace('-title', '').replace('-emoji', '').replace('-sharing-status', '');

            if (id && notebookIds.has(id)) {
                notebook.style.display = 'none';
            } else {
                notebook.style.display = '';
            }
        });
    }
};

window.DragDrop = DragDrop;
