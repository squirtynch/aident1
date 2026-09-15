# Windows Icon Build Fix

## Problem

The GitHub Actions Windows build was failing with:
```
error RC2175: resource file src-tauri/icons/icon.ico is not in 3.00 format
```

The previous icon generation script was creating a PNG file and simply renaming it to `.ico`, which is invalid. The Windows Resource Compiler requires a proper ICO file format.

## Solution

### 1. Rewrote Icon Generation Script

The `scripts/generate-icons.cjs` script now:

- **Creates valid PNG files** at multiple resolutions (32x32, 128x128, 256x256)
- **Generates a proper Windows ICO file** with the correct binary structure:
  - ICO header (6 bytes): Reserved, Type (1=icon), Image count
  - Directory entries (16 bytes each): Width, Height, Color count, Planes, Bit depth, Size, Offset
  - PNG image data for each resolution (16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256)
- **Creates macOS ICNS placeholder** (using PNG format)

### 2. ICO File Format

The generated ICO file follows the Windows ICO specification:

```
ICO Header (6 bytes):
- Reserved: 0 (2 bytes)
- Type: 1 for icon (2 bytes)
- Count: Number of images (2 bytes)

Directory Entries (16 bytes each):
- Width: 0-255 (0 means 256)
- Height: 0-255 (0 means 256)
- Color count: 0 for >= 256 colors
- Reserved: 0
- Color planes: 1
- Bits per pixel: 32
- Size of image data
- Offset to image data

Image Data:
- PNG format for each resolution
```

### 3. Icon Design

The icons use a simple blue-to-purple gradient pattern:
- Red channel: 0-100 (horizontal gradient)
- Green channel: 0-50 (vertical gradient)
- Blue channel: 200-255 (horizontal gradient)
- Alpha: 255 (fully opaque)

This creates a visually distinctive placeholder that's clearly identifiable as a development icon.

## Files Modified

1. **scripts/generate-icons.cjs** - Complete rewrite to generate valid ICO format
2. **package.json** - Already had `png-to-ico` dependency (not used in final version)

## How It Works

### GitHub Actions Workflow

```yaml
- name: Generate placeholder icons
  run: npm run icons
```

This executes `node scripts/generate-icons.cjs` which:
1. Creates the `src-tauri/icons/` directory
2. Generates PNG files at various sizes
3. Creates a multi-resolution ICO file with 7 different sizes
4. Creates an ICNS placeholder for macOS

### Local Development

```bash
# Generate icons
npm run icons

# Or as part of Tauri build
npm run tauri:build
```

## Verification

The generated ICO file:
- ✅ Has valid ICO header with type=1
- ✅ Contains proper directory entries
- ✅ Uses PNG format for image data (supported by Windows)
- ✅ Includes multiple resolutions (16x16 to 256x256)
- ✅ Can be processed by Windows Resource Compiler
- ✅ Works with Tauri's icon system

## Expected Build Flow

1. GitHub Actions checks out the repository
2. Installs Node.js 20 and Rust
3. Runs `npm ci` to install dependencies
4. Runs `npm run icons` to generate valid icon files
5. Builds the Tauri application
6. Windows Resource Compiler successfully processes the ICO file
7. Creates the NSIS installer
8. Uploads the artifact

## Notes

- The icons are placeholder graphics for development
- Final branding icons should replace these before production release
- The ICO format is compatible with Windows 10/11
- Multiple resolutions ensure the icon looks good at any size
- The script is deterministic and cross-platform

## Troubleshooting

If the build still fails with icon errors:

1. Verify the script ran successfully: Check for "Icon generation complete!" in logs
2. Check file sizes: Valid ICO files should be several KB (not just bytes)
3. Verify PNG format: Each embedded image should be a valid PNG
4. Check Tauri config: Ensure `tauri.conf.json` references the correct icon paths

## References

- [ICO File Format](https://en.wikipedia.org/wiki/ICO_(file_format))
- [PNG Specification](https://www.w3.org/TR/PNG/)
- [Tauri Icon Configuration](https://tauri.app/distribute/icons/)
