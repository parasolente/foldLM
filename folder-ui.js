/**
 * NotebookLM Folders - UI Module
 * Handles rendering folders and modals
 */

const FolderUI = {
  modalOverlay: null,
  contextMenu: null,
  createDialog: null,
  deleteDialog: null,
  renameDialog: null,
  currentView: 'list', // 'list' or 'grid'
  isInitialized: false,
  isInjecting: false,

  // Available emojis for folders
  emojis: ['📁', '📂', '🗂️', '📚', '💼', '🎯', '⭐', '💡', '🔥', '💎', '🌟', '📌', '🚀', '🎨', '🎵', '🎬', '🧩', '🌈', '🌍', '🛠️'],

  // Available colors for folders
  colors: [
    { name: 'pink', value: '#F8CCC8' },
    { name: 'blue', value: '#C2E7FF' },
    { name: 'green', value: '#C4EED0' },
    { name: 'yellow', value: '#FFF3CD' },
    { name: 'purple', value: '#E8D5F9' },
    { name: 'cyan', value: '#A8F0F0' },
    { name: 'orange', value: '#FFE5CC' },
    { name: 'mint', value: '#D0F0C0' },
    { name: 'lavender', value: '#E6E6FA' },
    { name: 'rose', value: '#FFE4E1' },
    { name: 'sky', value: '#E0F7FA' },
    { name: 'peach', value: '#FFDAB9' },
    { name: 'lime', value: '#F0FFF0' },
    { name: 'lilac', value: '#F3E5F5' },
    { name: 'apricot', value: '#FFF5EE' },
    { name: 'mist', value: '#F5F5F5' }
  ],

  /**
   * Initialize the UI module
   */
  async init() {
    if (!this.isInitialized) {
      await this.loadViewPreference(); // Load saved preference
      this.createModalOverlay();
      this.createContextMenu();
      this.createCreateDialog();
      this.createDeleteDialog();
      this.createRenameDialog();
      this.isInitialized = true;
    }

    // Always attempt to inject the folders section if it is missing from DOM
    this.injectFoldersSection();
  },

  /**
   * Load view preference from storage
   */
  async loadViewPreference() {
    try {
      this.currentView = await FolderStorage.getViewPreference();
    } catch (e) {
      console.error('Error loading view preference:', e);
      this.currentView = 'list'; // Default fallback
    }
  },

  /**
   * Create the modal overlay for viewing folder contents
   */
  createModalOverlay() {
    if (this.modalOverlay && document.body.contains(this.modalOverlay)) return;

    if (!this.modalOverlay) {
      this.modalOverlay = document.createElement('div');
      this.modalOverlay.className = 'nlm-folder-modal-overlay';
      this.modalOverlay.innerHTML = `
        <div class="nlm-folder-modal">
          <div class="nlm-folder-modal-header">
            <div class="nlm-folder-modal-title">
              <span class="nlm-folder-modal-emoji">📁</span>
              <span class="nlm-folder-modal-name">Folder Name</span>
            </div>
            <button class="nlm-folder-modal-close" aria-label="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          <div class="nlm-folder-modal-content">
            <div class="nlm-folder-modal-grid"></div>
          </div>
        </div>
      `;

      // Close on overlay click
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) {
          this.hideModal();
        }
      });

      // Close button
      this.modalOverlay.querySelector('.nlm-folder-modal-close').addEventListener('click', () => {
        this.hideModal();
      });
    }

    if (!document.body.contains(this.modalOverlay)) {
      document.body.appendChild(this.modalOverlay);
    }
  },

  /**
   * Create the context menu for folder actions
   */
  createContextMenu() {
    if (this.contextMenu) return;

    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'nlm-folder-context-menu';
    this.contextMenu.style.display = 'none';
    this.contextMenu.innerHTML = `
      <button class="nlm-context-menu-item" data-action="delete">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
        </svg>
        <span class="nlm-context-menu-item-text">Delete</span>
      </button>

      <button class="nlm-context-menu-item" data-action="rename">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
        </svg>
        <span class="nlm-context-menu-item-text">Edit title</span>
      </button>
    `;

    // Hide on click outside
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    document.body.appendChild(this.contextMenu);
  },

  /**
   * Create the dialog for creating new folders
   */
  createCreateDialog() {
    if (this.createDialog && document.body.contains(this.createDialog)) return;

    if (!this.createDialog) {
      const overlay = document.createElement('div');
      overlay.className = 'nlm-folder-modal-overlay';
      overlay.innerHTML = `
        <div class="nlm-create-folder-dialog">
          <div class="nlm-dialog-title">Create new folder</div>
          
          <div class="nlm-dialog-field">
            <label class="nlm-dialog-label">Folder name</label>
            <input type="text" class="nlm-dialog-input" placeholder="Enter folder name" maxlength="50">
          </div>
          
          <div class="nlm-dialog-field">
            <label class="nlm-dialog-label">Icon</label>
            <div class="nlm-emoji-selection-wrapper">
              <button type="button" class="nlm-emoji-trigger-btn ripple-btn">
                <span class="nlm-selected-emoji">📁</span>
              </button>
              <div class="nlm-advanced-picker-popover" style="display: none;"></div>
            </div>
          </div>
          
          <div class="nlm-dialog-field">
            <label class="nlm-dialog-label">Color</label>
            <div class="nlm-color-picker"></div>
          </div>
          
          <div class="nlm-dialog-actions">
            <button class="nlm-btn ripple-btn nlm-dialog-btn-cancel">
              <span class="btn-label">Cancel</span>
            </button>
            <button class="nlm-btn ripple-btn nlm-dialog-btn-create">
              <span class="btn-label">Create</span>
            </button>
          </div>
        </div>
      `;

      // Advanced Emoji Picker Integration
      const emojiWrapper = overlay.querySelector('.nlm-emoji-selection-wrapper');
      const emojiTrigger = emojiWrapper.querySelector('.nlm-emoji-trigger-btn');
      const emojiDisplay = emojiWrapper.querySelector('.nlm-selected-emoji');
      const popover = emojiWrapper.querySelector('.nlm-advanced-picker-popover');

      let selectedEmoji = '📁';

      const picker = AdvancedEmojiPicker.create((emoji) => {
        selectedEmoji = emoji;
        emojiDisplay.textContent = emoji;
        popover.style.display = 'none';
      });
      popover.appendChild(picker);

      emojiTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = popover.style.display === 'block';
        popover.style.display = isVisible ? 'none' : 'block';
      });

      // Close popover when clicking outside
      document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !emojiTrigger.contains(e.target)) {
          popover.style.display = 'none';
        }
      });

      // Populate color picker
      const colorPicker = overlay.querySelector('.nlm-color-picker');
      this.colors.forEach((color, index) => {
        const btn = document.createElement('button');
        btn.className = 'nlm-color-option' + (index === 0 ? ' selected' : '');
        btn.style.backgroundColor = color.value;
        btn.dataset.color = color.value;
        btn.addEventListener('click', () => {
          colorPicker.querySelectorAll('.nlm-color-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
        colorPicker.appendChild(btn);
      });

      // Cancel button
      overlay.querySelector('.nlm-dialog-btn-cancel').addEventListener('click', () => {
        this.hideCreateDialog();
      });

      // Create button
      overlay.querySelector('.nlm-dialog-btn-create').addEventListener('click', async () => {
        const name = overlay.querySelector('.nlm-dialog-input').value.trim();
        const emoji = selectedEmoji || '📁';
        const color = overlay.querySelector('.nlm-color-option.selected')?.dataset.color || '#F8CCC8';

        if (name) {
          await FolderStorage.createFolder({ name, emoji, color });
          this.hideCreateDialog();
          this.renderFolders();
        }
      });

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideCreateDialog();
        }
      });

      // Ripple effects
      overlay.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          this.createRipple(e, btn);
        });
      });

      this.createDialog = overlay;
    }

    if (!document.body.contains(this.createDialog)) {
      document.body.appendChild(this.createDialog);
    }
  },

  /**
   * Create the custom delete confirmation dialog
   */
  createDeleteDialog() {
    if (this.deleteDialog && document.body.contains(this.deleteDialog)) return;

    if (!this.deleteDialog) {
      const overlay = document.createElement('div');
      overlay.className = 'nlm-folder-modal-overlay';
      overlay.innerHTML = `
        <div class="nlm-delete-dialog-card">
          <div class="nlm-delete-dialog-content">
            <h2 class="nlm-delete-dialog-title">
              Delete <span class="nlm-emoji-icon">📁</span> <span class="nlm-delete-folder-name">Folder</span>?
            </h2>
          </div>
          <div class="nlm-delete-dialog-actions">
            <button type="button" class="nlm-btn ripple-btn nlm-delete-cancel">
              <span class="nlm-btn-label">Cancel</span>
            </button>
            <button type="button" class="nlm-btn ripple-btn nlm-delete-confirm">
              <span class="nlm-btn-label">Delete</span>
            </button>
          </div>
        </div>
      `;

      // Ripple effect for buttons
      overlay.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          this.createRipple(e, btn);
        });
      });

      // Cancel button
      overlay.querySelector('.nlm-delete-cancel').addEventListener('click', () => {
        setTimeout(() => {
          this.hideDeleteDialog();
        }, 50);
      });

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideDeleteDialog();
        }
      });

      this.deleteDialog = overlay;
    }

    if (!document.body.contains(this.deleteDialog)) {
      document.body.appendChild(this.deleteDialog);
    }
  },

  /**
   * Create the custom rename dialog (Material 3 Style)
   */
  createRenameDialog() {
    if (this.renameDialog && document.body.contains(this.renameDialog)) return;

    if (!this.renameDialog) {
      const overlay = document.createElement('div');
      overlay.className = 'nlm-folder-modal-overlay';
      overlay.innerHTML = `
        <div class="nlm-rename-dialog-card">
          <div class="nlm-rename-icon-container">
            <div class="nlm-rename-icon-circle ripple-btn">📁</div>
            <div class="nlm-advanced-picker-popover" style="display: none;"></div>
          </div>

          <div class="nlm-input-group">
            <input type="text" class="nlm-custom-input" placeholder=" " maxlength="50" spellcheck="false">
            <label class="nlm-floating-label">Folder title *</label>
          </div>

          <div class="nlm-rename-actions">
            <button type="button" class="nlm-btn ripple-btn nlm-rename-cancel">
              <span class="btn-label">Cancel</span>
            </button>
            <button type="button" class="nlm-btn ripple-btn nlm-rename-save">
              <span class="btn-label">Save</span>
            </button>
          </div>
        </div>
      `;

      const emojiCircle = overlay.querySelector('.nlm-rename-icon-circle');
      const popover = overlay.querySelector('.nlm-advanced-picker-popover');

      const picker = AdvancedEmojiPicker.create((emoji) => {
        emojiCircle.textContent = emoji;
        emojiCircle.dataset.emoji = emoji;
        popover.style.display = 'none';
      });
      popover.appendChild(picker);

      emojiCircle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = popover.style.display === 'block';
        popover.style.display = isVisible ? 'none' : 'block';
      });

      // Close popover when clicking outside
      document.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !emojiCircle.contains(e.target)) {
          popover.style.display = 'none';
        }
      });

      // Ripple effects
      overlay.querySelectorAll('.ripple-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          this.createRipple(e, btn);
        });
      });

      // Cancel button
      overlay.querySelector('.nlm-rename-cancel').addEventListener('click', () => {
        setTimeout(() => this.hideRenameDialog(), 50);
      });

      // Save button logic is handled in showRenameDialog due to folder closure

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideRenameDialog();
        }
      });

      this.renameDialog = overlay;
    }

    if (!document.body.contains(this.renameDialog)) {
      document.body.appendChild(this.renameDialog);
    }
  },

  /**
   * Inject the folders section into the page
   */
  async injectFoldersSection() {
    // Wait for the projects container to exist
    const waitForContainer = () => {
      return new Promise((resolve) => {
        const check = () => {
          const container = document.querySelector('.my-projects-container, .all-projects-container, .project-buttons-flow');
          if (container) {
            resolve(container);
          } else {
            setTimeout(check, 500);
          }
        };
        check();
      });
    };

    const container = await waitForContainer();

    // Check if we already injected or are in the process of injecting
    if (document.querySelector('.nlm-folders-section') || this.isInjecting) return;
    this.isInjecting = true;

    try {
      // --- NEW LOGIC: Tab-aware injection ---

      // 1. Detect Active Tab
      const activeToggle = document.querySelector('mat-button-toggle-group .mat-button-toggle-checked');

      // If we can't determine the active tab, the DOM might not be ready.
      // Return and let MutationObserver retry later.
      if (!activeToggle) {
        return;
      }

      const tabName = activeToggle.textContent.trim().toLowerCase();

      // 2. Hide on "Featured notebooks"
      if (tabName.includes('featured')) {
        return;
      }

      // Create folders section
      const section = document.createElement('div');
      section.className = 'nlm-folders-section';
      section.innerHTML = `
        <h2 class="nlm-folders-header projects-header mat-headline-small">My folders</h2>
        <div class="nlm-folders-grid"></div>
      `;

      // 3. Determine Insertion Point
      // In "All" view, we want to insert AFTER the "See all" button (which ends the Featured section)
      const seeAllBtnContainer = container.querySelector('.see-all-button-container');

      if (seeAllBtnContainer) {
        // We are likely in "All" view
        // Use parentNode to ensure we are inserting into the correct container
        if (seeAllBtnContainer.nextSibling) {
          seeAllBtnContainer.parentNode.insertBefore(section, seeAllBtnContainer.nextSibling);
        } else {
          seeAllBtnContainer.parentNode.appendChild(section);
        }
      } else {
        // We are likely in "My notebooks" view (or logic fallback)
        // Insert at the top, before the first header (usually "Recent notebooks" or list)
        // Make sure we don't accidentally insert before "Featured" title if we somehow missed the see-all button
        const recentHeader = container.querySelector('.projects-header');
        if (recentHeader) {
          recentHeader.parentNode.insertBefore(section, recentHeader);
        } else {
          container.insertBefore(section, container.firstChild);
        }
      }

      this.renderFolders();
    } catch (e) {
      console.error('🗂️ Error injecting folder section:', e);
    } finally {
      this.isInjecting = false;
    }
  },

  /**
   * Render all folders
   */
  async renderFolders() {
    const grid = document.querySelector('.nlm-folders-grid');
    if (!grid) return;

    grid.innerHTML = '';

    // Add "Create folder" button
    const createBtn = document.createElement('div');
    createBtn.className = 'nlm-create-folder-btn';
    createBtn.innerHTML = `
      <div class="nlm-create-folder-content">
        <div class="nlm-create-folder-icon">
          <svg class="nlm-create-folder-icon-plus" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
        <span class="nlm-create-folder-text">Create new folder</span>
      </div>
    `;
    createBtn.addEventListener('click', () => this.showCreateDialog());
    grid.appendChild(createBtn);

    // Render existing folders
    try {
      const folders = await FolderStorage.getFolders();
      folders.forEach(folder => {
        try {
          const folderEl = this.createFolderElement(folder);
          grid.appendChild(folderEl);
        } catch (err) {
          console.error('Error creating folder element:', err, folder);
        }
      });
    } catch (e) {
      console.error('Error fetching folders in renderFolders:', e);
    }
  },

  /**
   * Create a folder element
   * @param {Object} folder - Folder data
   * @returns {HTMLElement}
   */
  createFolderElement(folder) {
    const el = document.createElement('div');
    el.className = 'nlm-folder';
    el.dataset.folderId = folder.id;
    el.style.backgroundColor = folder.color;

    const date = new Date(folder.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    el.innerHTML = `

      <div class="nlm-folder-content">
        <div class="nlm-folder-header">
          <span class="nlm-folder-emoji">${folder.emoji}</span>
          <button class="nlm-folder-more-btn" aria-label="Folder actions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
        <div class="nlm-folder-title">${folder.name}</div>
        <div class="nlm-folder-subtitle">
          ${date} · <span class="nlm-folder-subtitle-count">${folder.notebooks.length} items</span>
        </div>
      </div>
    `;

    // Click to open folder
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.nlm-folder-more-btn')) {
        this.showFolderModal(folder);
      }
    });

    // More button click
    el.querySelector('.nlm-folder-more-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.showContextMenu(e, folder);
    });

    return el;
  },

  /**
 * Show the folder modal with contents
 * @param {Object} folder - Folder data
 */
  async showFolderModal(folder) {
    if (!folder) {
      console.warn('Attempted to open modal for undefined folder');
      return;
    }

    if (!this.modalOverlay || !document.body.contains(this.modalOverlay)) {
      this.createModalOverlay();
    }
    const modal = this.modalOverlay;

    const emojiEl = modal.querySelector('.nlm-folder-modal-emoji');
    const nameEl = modal.querySelector('.nlm-folder-modal-name');
    const modalContent = modal.querySelector('.nlm-folder-modal');

    if (!emojiEl || !nameEl || !modalContent) {
      this.modalOverlay.remove();
      this.modalOverlay = null;
      this.createModalOverlay();
      return this.showFolderModal(folder);
    }

    emojiEl.textContent = folder.emoji;
    nameEl.textContent = folder.name;

    const contentArea = modal.querySelector('.nlm-folder-modal-content');
    if (!contentArea) return;

    contentArea.innerHTML = '';

    // Header Actions (Heading + Toggle)
    const headerActions = document.createElement('div');
    headerActions.className = 'nlm-modal-header-actions';

    const heading = document.createElement('h2');
    heading.className = 'nlm-modal-heading';
    heading.textContent = 'Notebooks in this folder';
    headerActions.appendChild(heading);

    // Toggle Group
    const toggleGroup = document.createElement('div');
    toggleGroup.className = 'nlm-toggle-group';
    toggleGroup.setAttribute('role', 'radiogroup');

    const gridSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-120v-320h320v320H120Zm0-400v-320h320v320H120Zm400 400v-320h320v320H520Zm0-400v-320h320v320H520ZM200-200h160v-160H200v160Zm0-400h160v-160H200v160Zm400 400h160v-160H600v160Zm0-400h160v-160H600v160Z"/></svg>`;
    const listSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-240v-80h720v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Zm0-160v-80h720v80H120Z"/></svg>`;

    const btnGrid = this.createToggleButton('grid', gridSvg, 'Grid view', folder);
    const btnList = this.createToggleButton('list', listSvg, 'List view', folder);

    toggleGroup.appendChild(btnGrid);
    toggleGroup.appendChild(btnList);
    headerActions.appendChild(toggleGroup);

    contentArea.appendChild(headerActions);

    // Render contents based on initial view
    this.renderFolderContents(folder, contentArea);

    modal.classList.add('visible');

    // Global click listener for context menus
    if (!this._dropdownListenerAdded) {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.menu-container') && !e.target.closest('.nlm-folder-more-btn')) {
          document.querySelectorAll('.nlm-notebook-dropdown').forEach(d => d.remove());
        }
      });
      this._dropdownListenerAdded = true;
    }
  },

  /**
   * Create a toggle button for the view group
   */
  createToggleButton(view, svgContent, label, folder) {
    const btn = document.createElement('button');
    btn.className = `nlm-toggle-btn ${this.currentView === view ? 'active' : ''}`;
    btn.setAttribute('aria-label', label);

    btn.innerHTML = `
      <span class="check-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
      </span>
      ${svgContent}
    `;

    btn.addEventListener('click', (e) => {
      if (this.currentView === view) return;

      this.currentView = view;
      FolderStorage.saveViewPreference(view); // Save preference

      // Update active state in UI
      btn.parentElement.querySelectorAll('.nlm-toggle-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
      });

      this.createRipple(e, btn);

      // Re-render only contents
      const contentArea = this.modalOverlay.querySelector('.nlm-folder-modal-content');
      const container = contentArea.querySelector('.notebook-table, .nlm-folder-modal-grid, .nlm-folder-modal-empty');
      if (container) container.remove();

      this.renderFolderContents(folder, contentArea);
    });

    return btn;
  },

  /**
   * Render the notebooks in the selected view
   */
  renderFolderContents(folder, container) {
    if (folder.notebooks.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'nlm-folder-modal-empty';
      emptyMsg.innerHTML = 'No notebooks in this folder yet.<br>Drag notebooks here to add them.';
      container.appendChild(emptyMsg);
      return;
    }

    if (this.currentView === 'list') {
      const table = document.createElement('div');
      table.className = 'notebook-table';
      table.innerHTML = `
        <div class="header-row">
          <div class="header-cell">Title</div>
          <div class="header-cell">Sources</div>
          <div class="header-cell">Date</div>
          <div class="header-cell">Role</div>
          <div class="header-cell"></div>
        </div>
      `;
      folder.notebooks.forEach(notebook => {
        this.createNotebookRow(notebook, folder.id, table);
      });
      container.appendChild(table);
    } else {
      const grid = document.createElement('div');
      grid.className = 'nlm-folder-modal-grid';
      folder.notebooks.forEach(notebook => {
        grid.appendChild(this.createNotebookCard(notebook, folder.id));
      });
      container.appendChild(grid);
    }
  },

  /**
   * Create the ripple effect for toggle buttons
   */
  createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x - radius}px`;
    circle.style.top = `${y - radius}px`;
    circle.classList.add('nlm-ripple');

    const ripple = button.getElementsByClassName('nlm-ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, 600);
  },

  /**
   * Create a notebook card for the grid view
   */
  createNotebookCard(notebook, folderId) {
    const el = document.createElement('div');
    el.className = 'nlm-notebook-card';
    const color = notebook.color || '#F5F5F5';
    el.style.setProperty('--nlm-card-color', color);

    // Check if this is a default/neutral colored notebook
    if (color.toUpperCase() === '#F5F5F5' || color.toUpperCase() === '#EDEFFA') {
      el.classList.add('nlm-default-color');
    }

    const date = notebook.date || 'No date';
    const sources = notebook.sources || '0 sources';

    el.innerHTML = `
      <div class="nlm-folder-content">
        <div class="nlm-folder-header">
          <span class="nlm-folder-emoji">${notebook.emoji || '📓'}</span>
          <button class="nlm-folder-more-btn" aria-label="Notebook actions">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
            </svg>
          </button>
        </div>
        <div class="nlm-folder-title">${notebook.title}</div>
        <div class="nlm-folder-subtitle">
          ${date} · <span class="nlm-folder-subtitle-count">${sources}</span>
        </div>
      </div>
    `;

    // Click to open notebook
    el.addEventListener('click', (e) => {
      if (!e.target.closest('.nlm-folder-more-btn')) {
        window.location.href = `https://notebooklm.google.com/notebook/${notebook.id}`;
      }
    });

    // More button click
    const moreBtn = el.querySelector('.nlm-folder-more-btn');
    moreBtn.addEventListener('click', (e) => {
      this.showNotebookMenu(e, notebook, folderId, moreBtn);
    });

    return el;
  },

  /**
   * Create a notebook row for the table
   * @param {Object} notebook - Notebook data
   * @param {string} folderId - Parent folder ID
   * @param {HTMLElement} tableContainer - Table to append to
   */
  createNotebookRow(notebook, folderId, tableContainer) {
    const row = document.createElement('div');
    row.className = 'data-row';

    // Cell 1: Title & Icon
    const titleCell = document.createElement('div');
    titleCell.className = 'cell';
    titleCell.innerHTML = `<span class="icon-wrapper">${notebook.emoji || '📓'}</span><span class="title-text">${notebook.title || 'Untitled'}</span>`;
    titleCell.addEventListener('click', () => {
      window.location.href = `https://notebooklm.google.com/notebook/${notebook.id}`;
    });

    // Cell 2: Sources
    const sourcesCell = document.createElement('div');
    sourcesCell.className = 'cell meta';
    sourcesCell.textContent = notebook.sources || '0 Sources';
    sourcesCell.addEventListener('click', () => {
      window.location.href = `https://notebooklm.google.com/notebook/${notebook.id}`;
    });

    // Cell 3: Date
    const dateCell = document.createElement('div');
    dateCell.className = 'cell meta';
    dateCell.textContent = notebook.date || '';
    dateCell.addEventListener('click', () => {
      window.location.href = `https://notebooklm.google.com/notebook/${notebook.id}`;
    });

    // Cell 4: Role
    const roleCell = document.createElement('div');
    roleCell.className = 'cell meta';
    roleCell.textContent = 'Owner';
    roleCell.addEventListener('click', () => {
      window.location.href = `https://notebooklm.google.com/notebook/${notebook.id}`;
    });

    // Cell 5: Actions Menu
    const actionCell = document.createElement('div');
    actionCell.className = 'cell';

    const menuContainer = document.createElement('div');
    menuContainer.className = 'menu-container';

    const menuBtn = document.createElement('button');
    menuBtn.className = 'menu-trigger';
    menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>`;

    menuBtn.addEventListener('click', (e) => {
      this.showNotebookMenu(e, notebook, folderId, menuBtn);
    });

    menuContainer.appendChild(menuBtn);
    actionCell.appendChild(menuContainer);

    row.appendChild(titleCell);
    row.appendChild(sourcesCell);
    row.appendChild(dateCell);
    row.appendChild(roleCell);
    row.appendChild(actionCell);

    tableContainer.appendChild(row);
  },

  /**
   * Show the notebook action menu
   */
  showNotebookMenu(e, notebook, folderId, menuBtn) {
    e.stopPropagation();

    // Remove existing dropdowns
    document.querySelectorAll('.nlm-notebook-dropdown').forEach(el => el.remove());

    const rect = menuBtn.getBoundingClientRect();

    const dropdownPortal = document.createElement('div');
    dropdownPortal.className = 'nlm-folder-context-menu show nlm-notebook-dropdown';
    dropdownPortal.style.top = (rect.bottom + 4) + 'px';
    dropdownPortal.style.left = rect.left + 'px';

    const createItem = (svgContent, text, onClick) => {
      const item = document.createElement('button');
      item.className = 'nlm-context-menu-item';
      item.innerHTML = `${svgContent}<span class="nlm-context-menu-item-text">${text}</span>`;
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        dropdownPortal.remove();
        onClick();
      });
      return item;
    };

    // Remove from folder
    dropdownPortal.appendChild(createItem(
      `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m871-202-71-71v-367H434l-80-80-80-80h114l80 80h332q33 0 56.5 23.5T880-640v400q0 11-2 20.5t-7 17.5ZM819-28 687-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800l80 80h-80v480h447L28-820l56-56L876-84l-57 56ZM368-480Zm209-17Z"/></svg>`,
      'Remove from folder',
      async () => {
        await FolderStorage.removeNotebookFromFolder(folderId, notebook.id);
        const updatedFolder = (await FolderStorage.getFolders()).find(f => f.id === folderId);
        this.showFolderModal(updatedFolder);
        this.renderFolders();
        DragDrop.hideNotebooksInFolders();
        DragDrop.init();
      }));

    document.body.appendChild(dropdownPortal);

    const closeHandler = (ev) => {
      if (!dropdownPortal.contains(ev.target) && ev.target !== menuBtn) {
        dropdownPortal.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  },

  /**
   * Hide the folder modal
   */
  hideModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('visible');
    }
  },

  /**
   * Show context menu for folder
   * @param {Event} e - Click event
   * @param {Object} folder - Folder data
   */
  showContextMenu(e, folder) {
    if (!this.contextMenu || !document.body.contains(this.contextMenu)) {
      this.createContextMenu();
    }

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    this.contextMenu.style.display = 'block';
    // Position below the button, aligned to the right (similar to native)
    // Or left-aligned if constrained. Let's try aligning top-right of menu to bottom-right of button?
    // User image showed menu somewhat right-aligned.
    // Let's settle for functional anchoring:
    this.contextMenu.style.top = (rect.bottom + 4) + 'px';
    this.contextMenu.style.left = rect.left + 'px'; // Left align for simplicity

    // Better: Ensure it doesn't go off screen
    // Simple approach: Left align to button


    // Set up action handlers
    this.contextMenu.querySelectorAll('.nlm-context-menu-item').forEach(item => {
      item.onclick = async () => {
        const action = item.dataset.action;
        if (action === 'delete') {
          this.showDeleteFolderDialog(folder);
        } else if (action === 'rename') {
          this.showRenameDialog(folder);
        }
        this.hideContextMenu();
      };
    });
  },

  /**
   * Hide context menu
   */
  hideContextMenu() {
    this.contextMenu.style.display = 'none';
  },

  /**
   * Show the custom delete dialog for a folder
   * @param {Object} folder - Folder data
   */
  showDeleteFolderDialog(folder) {
    if (!this.deleteDialog || !document.body.contains(this.deleteDialog)) {
      this.createDeleteDialog();
    }
    const dialog = this.deleteDialog;

    const emojiEl = dialog.querySelector('.nlm-emoji-icon');
    const nameEl = dialog.querySelector('.nlm-delete-folder-name');
    const confirmBtn = dialog.querySelector('.nlm-delete-confirm');

    if (!emojiEl || !nameEl || !confirmBtn) {
      console.warn('🗂️ Delete dialog structure corrupted, rebuilding...');
      this.deleteDialog.remove();
      this.deleteDialog = null;
      this.createDeleteDialog();
      return this.showDeleteFolderDialog(folder);
    }

    emojiEl.textContent = folder.emoji;
    nameEl.textContent = folder.name;

    // Remove old listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // Re-add ripple and add delete logic
    newConfirmBtn.addEventListener('click', (e) => {
      this.createRipple(e, newConfirmBtn);
    });

    newConfirmBtn.addEventListener('click', async () => {
      await FolderStorage.deleteFolder(folder.id);
      this.hideDeleteDialog();
      this.renderFolders();
    });

    dialog.classList.add('visible');
  },

  /**
   * Hide the delete dialog
   */
  hideDeleteDialog() {
    if (this.deleteDialog) {
      this.deleteDialog.classList.remove('visible');
    }
  },

  /**
   * Show create folder dialog
   */
  showCreateDialog() {
    if (!this.createDialog || !document.body.contains(this.createDialog)) {
      this.createCreateDialog();
    }

    const dialog = this.createDialog;
    const input = dialog.querySelector('.nlm-dialog-input');
    const popover = dialog.querySelector('.nlm-advanced-picker-popover');
    const colorOptions = dialog.querySelectorAll('.nlm-color-option');

    if (!input || !popover || colorOptions.length === 0) {
      console.warn('🗂️ Create dialog structure corrupted, rebuilding...');
      this.createDialog.remove();
      this.createDialog = null;
      this.createCreateDialog();
      return this.showCreateDialog();
    }

    // Reset form
    input.value = '';
    popover.style.display = 'none';

    colorOptions.forEach((b, i) => {
      b.classList.toggle('selected', i === 0);
    });

    this.createDialog.classList.add('visible');
    setTimeout(() => input.focus(), 100);
  },

  /**
   * Hide create folder dialog
   */
  /**
   * Show custom rename dialog
   * @param {Object} folder - Folder data
   */
  showRenameDialog(folder) {
    if (!this.renameDialog || !document.body.contains(this.renameDialog)) {
      this.createRenameDialog();
    }
    const dialog = this.renameDialog;
    const input = dialog.querySelector('.nlm-custom-input');
    const emojiCircle = dialog.querySelector('.nlm-rename-icon-circle');
    const saveBtn = dialog.querySelector('.nlm-rename-save');
    const popover = dialog.querySelector('.nlm-advanced-picker-popover');

    if (!input || !emojiCircle || !saveBtn || !popover) {
      console.warn('🗂️ Rename dialog structure corrupted, rebuilding...');
      this.renameDialog.remove();
      this.renameDialog = null;
      this.createRenameDialog();
      return this.showRenameDialog(folder);
    }

    // Reset state
    input.value = folder.name;
    emojiCircle.textContent = folder.emoji;
    emojiCircle.dataset.emoji = folder.emoji;
    popover.style.display = 'none';

    // Remove old save listeners by cloning
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    // Re-add ripple to new button
    newSaveBtn.addEventListener('mousedown', (e) => this.createRipple(e, newSaveBtn));

    // Handle save
    const handleSave = async () => {
      const newName = input.value.trim();
      const newEmoji = emojiCircle.dataset.emoji || folder.emoji;

      if (!newName) {
        input.value = ''; // Ensure placeholder shows for red state
        input.focus();
        return;
      }

      await FolderStorage.updateFolder(folder.id, {
        name: newName,
        emoji: newEmoji
      });
      this.hideRenameDialog();
      this.renderFolders();
    };

    newSaveBtn.addEventListener('click', () => {
      handleSave();
    });

    // Handle Enter key
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        handleSave();
      }
    };

    dialog.classList.add('visible');
    setTimeout(() => input.focus(), 100);
  },

  /**
   * Hide rename dialog
   */
  hideRenameDialog() {
    if (this.renameDialog) {
      this.renameDialog.classList.remove('visible');
    }
  },

  /**
   * Hide create folder dialog
   */
  hideCreateDialog() {
    this.createDialog.classList.remove('visible');
  }
};

// Make available globally
window.FolderUI = FolderUI;
