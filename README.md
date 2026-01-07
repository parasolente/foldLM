<div align="center">
  <img src="icons/icon128.png" alt="logo" width="100"/>
  <h1>foldLM</h1>
  
  <p>
    Seamlessly integrates with NotebookLM, offering native-like aesthetics and functionality for organizing notebooks.
  </p>
</div>

***

## Features

- **Drag and Drop**: Easily move notebooks into folders.
- **Custom Folders**: Create, rename, and delete folders to keep your workspace tidy.
- **Persisted Storage**: Your folder organization is saved automatically.
- **Emoji Support**: Add emojis to your folder names for better visual cueing.
- **Theme Support**: Automatically adapts to Light, Dark, and System themes, with a native-like layered aesthetic in dark mode.

## Screenshots

### 1. Main Interface
| Light Mode | Dark Mode |
|------------|-----------|
| ![Main Interface](screenshots/interface_main.png) | ![Main Interface Dark](screenshots/interface_main_dark.png) |

### 2. Grid View (Folder)
| Light Mode | Dark Mode |
|------------|-----------|
| ![Grid View](screenshots/folder_grid_view.png) | ![Grid View Dark](screenshots/folder_grid_view_dark.png) |

### 3. List View (Folder)
| Light Mode | Dark Mode |
|------------|-----------|
| ![List View](screenshots/folder_list_view.png) | ![List View Dark](screenshots/folder_list_view_dark.png) |

### 4. Edit Folder Title & Emoji
![Edit Folder Title & Emoji](screenshots/edit_folder_title_emoji.png)

### 5. Create Folder
![Create Folder](screenshots/create_folder_card.png)


## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked".
5. Select the folder containing this extension.

## Usage

Navigate to [NotebookLM](https://notebooklm.google.com/) and start dragging your notebooks into the new folder interface!

## Files

- `manifest.json`: Extension configuration.
- `content.js`: Main content script entry point.
- `folder-ui.js`: Handles the UI rendering for folders.
- `drag-drop.js`: Manages drag-and-drop interactions.
- `storage.js`: Handles data persistence.
- `emoji-picker.js`: Helper for emoji selection.
- `styles.css`: Custom styling for the extension.
- `icons/`: Contains extension icons.

## Cómo actualizar la extensión

Para disfrutar de las nuevas actualizaciones y correcciones de errores sin perder tus carpetas creadas, sigue estos pasos:

> [!IMPORTANT]
> **NO elimines la extensión de Chrome.** Si la eliminas, se borrarán todas tus carpetas y configuraciones.

1.  **Descarga la nueva versión**: Descarga el archivo ZIP del repositorio o clona nuevamente el proyecto.
2.  **Identifica tu carpeta actual**: Ubica la carpeta en tu computadora donde tienes guardada la versión actual de la extensión (la que cargaste en Chrome).
3.  **Sobrescribe los archivos**: Extrae el contenido del nuevo ZIP (o copia los archivos del nuevo clon) y **pégalos dentro de tu carpeta actual**, aceptando reemplazar/sobrescribir los archivos existentes.
4.  **Recarga en Chrome**:
    *   Ve a `chrome://extensions`.
    *   Busca la tarjeta de **foldLM**.
    *   Haz clic en el icono de **reargar** (flecha circular) 🔄.
5.  **Listo**: Vuelve a la pestaña de NotebookLM y refresca la página. Tus carpetas seguirán ahí, pero ahora tendrás la versión más reciente.
