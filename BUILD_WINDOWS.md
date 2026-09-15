# Building AI Product Studio for Windows

This guide explains how to obtain the Windows installer for AI Product Studio.

## Quick Start - Download the Installer

### Option 1: Download from GitHub Actions (Recommended)

1. **Open GitHub**
   - Go to the AI Product Studio repository on GitHub

2. **Open Actions**
   - Click on the "Actions" tab at the top of the repository

3. **Open "Build Windows Installer"**
   - Click on the workflow named "Build Windows Installer" in the left sidebar

4. **Run the workflow**
   - Click the "Run workflow" button (if manually triggering)
   - Or select a recent workflow run from the list

5. **Wait for the workflow to finish**
   - The build typically takes 5-10 minutes
   - Wait for all steps to show green checkmarks

6. **Open Artifacts**
   - Scroll down to the "Artifacts" section at the bottom of the workflow run
   - You'll see: `ai-product-studio-windows-installer`

7. **Download the artifact**
   - Click on the artifact name to download
   - This will download a ZIP file containing the installer

8. **Extract the artifact**
   - Extract the downloaded ZIP file
   - Inside you'll find: `AI Product Studio_0.1.0_x64-setup.exe` (or similar)

9. **Run the installer**
   - Double-click the `.exe` file
   - Follow the installation wizard
   - The application will be installed to your system

10. **Launch the application**
    - After installation, launch AI Product Studio from the Start Menu
    - Or find it in your installed programs

### Option 2: Download from GitHub Releases

If a release has been created (when a version tag like `v0.1.0` is pushed):

1. Go to the repository's "Releases" page
2. Find the latest release
3. Download the Windows installer `.exe` file
4. Run the installer

## Manual Trigger

You can manually trigger a build at any time:

1. Go to **Actions** → **Build Windows Installer**
2. Click **Run workflow**
3. Select the branch (usually `main`)
4. Click **Run workflow**
5. Wait for the build to complete
6. Download the artifact as described above

## What Gets Built

The GitHub Actions workflow:

1. Checks out the repository
2. Installs Node.js 20
3. Installs Rust stable toolchain
4. Installs npm dependencies
5. Builds the React frontend
6. Compiles the Tauri desktop application
7. Creates a Windows NSIS installer
8. Uploads the installer as an artifact

## System Requirements

### For Running the Installer
- Windows 10 or Windows 11 (64-bit)
- 4GB RAM minimum
- 500MB disk space
- Internet connection (for AI features)

### For Building (Not Required for Users)
If you want to build locally (not recommended for most users):
- Windows 10/11
- Node.js 20+
- Rust stable toolchain
- Visual Studio Build Tools
- ~2GB disk space for build artifacts

## First Launch

After installation:

1. **Launch AI Product Studio**
   - From Start Menu or desktop shortcut

2. **Configure AI Provider**
   - Go to Settings → AI Provider
   - Enter your OpenRouter API key
   - Click "Test Connection" to verify

3. **Create Your First Project**
   - Click "New Project" on the Dashboard
   - Import product images
   - Start generating content!

## Troubleshooting

### Installer Won't Run
- Make sure you're on Windows 10/11 64-bit
- Try running as Administrator
- Check Windows SmartScreen (click "More info" → "Run anyway")

### Build Failed in GitHub Actions
- Check the workflow logs for specific errors
- Common issues:
  - Rust compilation errors → check Cargo.toml
  - Frontend build errors → check npm dependencies
  - Icon errors → run `npm run icons`

### Application Crashes on Launch
- Check Windows Event Viewer for error details
- Try reinstalling the application
- Report issues on GitHub with error logs

## Security Notes

- **API Keys**: Stored securely in Windows Credential Manager
- **No Data Collection**: All data stays on your computer
- **No Telemetry**: No automatic data sending to servers
- **Open Source**: Code is available for inspection on GitHub

## Development vs Production

### Development Mode
- Run `npm run dev` for browser-based development
- Hot reload enabled
- Uses browser localStorage for data

### Production Mode
- Built with `npm run tauri:build`
- Creates native Windows application
- Uses Windows Credential Manager for secrets
- Uses local file system for data storage

## File Locations

After installation, your data is stored in:
```
C:\Users\<YourUsername>\Documents\AI Product Studio\
├── database\          # SQLite database
├── projects\          # Project files
├── library\           # Asset library
├── cache\             # Temporary cache
├── exports\           # Exported files
└── logs\              # Application logs
```

## Uninstalling

1. Open Windows Settings → Apps
2. Find "AI Product Studio"
3. Click Uninstall
4. Optionally delete user data folder

## Support

- **Documentation**: See README.md
- **Issues**: Report on GitHub Issues
- **Discussions**: Use GitHub Discussions

## Version Information

- Current Version: 0.1.0
- Build System: Tauri 2 + React + Vite
- Target Platform: Windows 10/11 (x64)

---

**Note**: You do NOT need to install Node.js, Rust, or any development tools to use the application. The installer contains everything needed to run AI Product Studio.
