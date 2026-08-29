<!-- Claude AI Ready Module - Systematic Reorganization -->
<!-- Category: documentation -->
<!-- Processed: 2026-08-28 14:27:18 -->
<!-- Status: AI Integration Ready -->
<!-- File: README-DESKTOP.md -->

# AFRERA Desktop Application

This document describes the desktop application setup for AFRERA using Tauri.

## Desktop App Status

**Status:** ✅ Configuration Complete

The desktop application uses Tauri to wrap the existing React web application, providing a native desktop experience for Windows, macOS, and Linux users.

## Setup Instructions

### Prerequisites

1. **Node.js** (>=18.0.0)
2. **Rust** and Cargo (for Tauri)
3. **System dependencies:**
   - **Windows:** Microsoft Visual Studio C++ Build Tools
   - **macOS:** Xcode Command Line Tools
   - **Linux:** webkit2gtk, librust-ssl, libappindicator, librsvg2

### Installation

1. Install Rust (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Install Tauri CLI:
   ```bash
   npm install -g @tauri-apps/cli
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

### Development

Run the desktop app in development mode:
```bash
cd frontend
npm run tauri:dev
```

This will:
- Start the Vite dev server
- Launch the Tauri window
- Enable hot-reloading for both frontend and Rust code

### Building

Build for production:
```bash
cd frontend
npm run tauri:build
```

The built application will be in `frontend/src-tauri/target/release/bundle/`

## Platform-Specific Builds

### Windows
```bash
npm run tauri:build
```
Output: `src-tauri/target/release/bundle/msi/` and `src-tauri/target/release/bundle/nsis/`

### macOS
```bash
npm run tauri:build
```
Output: `src-tauri/target/release/bundle/dmg/` and `src-tauri/target/release/bundle/macos/`

### Linux
```bash
npm run tauri:build
```
Output: `src-tauri/target/release/bundle/deb/` and `src-tauri/target/release/bundle/appimage/`

## Features

The desktop application includes:

- **Native Window Controls:** Minimize, maximize, close
- **System Tray Integration:** Background operation with tray icon
- **Desktop Notifications:** Native OS notifications
- **File System Access:** Save/load files from local system
- **Local Storage:** Persistent offline data storage
- **Auto-updates:** Future support for automatic updates

## Security Considerations

The Tauri configuration includes:
- Content Security Policy (CSP) restrictions
- Limited filesystem access scope
- HTTP request scoping to allowed domains
- No dangerous code execution capabilities

## Architecture

The desktop app follows the "one codebase" principle:
- **Frontend:** Same React SPA used for web
- **Backend:** Same Express/Node.js API server
- **Desktop:** Tauri wrapper provides native shell

All business logic remains server-side in `/api/v1/decision-support`, ensuring consistency across web, mobile, and desktop platforms.

## Icons

Icons need to be added to the `frontend/src-tauri/icons/` directory:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

## Troubleshooting

### Build fails on Windows
Ensure Microsoft Visual Studio C++ Build Tools are installed with "C++ build tools" workload.

### Build fails on macOS
Ensure Xcode Command Line Tools are installed:
```bash
xcode-select --install
```

### Build fails on Linux
Install required dependencies:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libappindicator3-dev \
  librsvg2-dev
```

## Development Notes

- The desktop app uses the same build output as the web app
- Hot-reloading works for both React and Rust changes
- DevTools can be opened with the standard keyboard shortcuts
- The app window size is configurable in `tauri.conf.json`

## Future Enhancements

Potential desktop-specific features:
- Native menu bar integration
- Keyboard shortcuts for common actions
- System-wide search integration
- Desktop widgets/gadgets
- Native file drag-and-drop
- Printer integration for reports