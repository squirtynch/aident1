# AI Product Studio

A comprehensive AI-powered product content creation studio for Windows.

## Features

### Core Features
- **Project Management**: Create, organize, and manage product projects
- **Asset Management**: Import and manage product images with drag-and-drop
- **AI Analysis**: Analyze products using vision AI
- **Image Generation**: Generate product photos using AI
- **Image Improvement**: Enhance and edit images with AI
- **AI Text Generation**: Generate product descriptions, marketing copy, and more
- **Product Cards**: Create professional product cards
- **Batch Processing**: Process multiple items in bulk
- **Library System**: Organize models, environments, styles, and references
- **Result Viewer**: View generated images with zoom, fullscreen, and navigation
- **Queue System**: Persistent job queue with retry logic
- **Version Control**: Track all generations and improvements

### Creative Features
- **Try-On**: Virtual try-on for products
- **Lifestyle**: Create lifestyle product images
- **Advertising**: Generate advertising content
- **Replace Product**: Replace products in designs
- **Video Generation**: Generate product videos (where supported)
- **AI Scenarios**: Create multi-scene content workflows
- **Card Funnels**: Automated product card generation workflows
- **Editor**: Basic image editing capabilities

### System Features
- **Theme Support**: Light, dark, and system themes
- **Command Palette**: Quick access to all features (Ctrl+K)
- **Diagnostics**: System health checks and reporting
- **Logging**: Structured logging system
- **Export/Import**: Project backup and restoration
- **Settings**: Comprehensive configuration options

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Lucide React** for icons

### AI Integration
- **OpenRouter** API support
- **Mock Provider** for testing
- **Capability Detection** for model features
- **Prompt Engine** for structured prompts

### Storage
- **LocalStorage** for web version
- **SQLite** planned for Tauri desktop version
- **Credential Store** for secure API key storage

## Installation

### Web Version (Development)
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

The production build will be in the `dist/` directory.

### Desktop Version (Tauri)
The desktop version requires Tauri 2 and is built separately. See `docs/build-windows.md` for details.

## Usage

### Getting Started
1. Launch the application
2. Configure your AI provider in Settings → AI Provider
3. Enter your OpenRouter API key
4. Create a new project
5. Import product images
6. Start generating content

### Keyboard Shortcuts
- `Ctrl+K` - Open command palette
- `Ctrl+S` - Save (in editor)
- `Escape` - Close dialogs/viewers
- `Arrow Keys` - Navigate in result viewer

### Project Workflow
1. **Create Project**: Start with a new project
2. **Import Assets**: Add product images
3. **Analyze Product**: Let AI analyze your product
4. **Generate Content**: Create photos, cards, text
5. **Improve & Iterate**: Refine results with AI
6. **Export**: Export your project for backup

## Configuration

### AI Provider Settings
- **Provider**: OpenRouter (default)
- **API Key**: Securely stored in credential manager
- **Models**: Configure default, text, vision, image, and video models
- **Capabilities**: Automatic detection of model features

### Storage
- **Web Version**: Uses browser localStorage
- **Desktop Version**: Uses local file system
- **Default Location**: `Documents/AI Product Studio/`

### Security
- API keys are never stored in plain text
- No secrets in logs or exports
- Secure credential storage
- No network exposure in production

## Testing

### Run Tests
```bash
# Open the application and navigate to Test Runner
# Or use the command palette: "Run AI Engine Tests"
```

### Test Coverage
- AI Engine tests (35+ tests)
- Creative Studio tests (30+ tests)
- Integration tests
- Mock provider scenarios

## Documentation

- [Architecture](docs/architecture.md) - System architecture overview
- [Build Windows](docs/build-windows.md) - Building for Windows
- [Testing](docs/testing.md) - Testing guide
- [Provider Development](docs/provider-development.md) - Adding new AI providers

## System Requirements

### Web Version
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- LocalStorage support

### Desktop Version (Planned)
- Windows 10/11
- 4GB RAM minimum
- 500MB disk space
- Internet connection for AI features

## Known Limitations

### Web Version
- Limited to browser storage (~5-10MB)
- No native file system access
- No system notifications
- No true ZIP export (uses JSON)

### AI Features
- Requires valid OpenRouter API key
- Image generation not yet available through OpenRouter
- Video generation requires specific model support
- Some features depend on provider capabilities

### Desktop Version
- Tauri integration not yet complete
- Python Core backend not yet implemented
- Native installer not yet available

## Troubleshooting

### API Key Issues
- Verify your OpenRouter API key is valid
- Check Settings → AI Provider → Test Connection
- Ensure you have sufficient API credits

### Storage Issues
- Web version: Clear browser cache if storage is full
- Check browser console for errors
- Export projects regularly for backup

### Performance Issues
- Reduce number of concurrent generations
- Clear generation history periodically
- Use thumbnails instead of full images

## Support

For issues and questions:
- Check the diagnostics page (Settings → Diagnostics)
- Review logs in the application
- Consult the documentation

## License

Proprietary - All rights reserved

## Version

Current version: 0.1.0

## Changelog

### 0.1.0 (Initial Release)
- Complete AI Product Studio implementation
- Project management system
- Asset import and management
- AI analysis and generation
- Image improvement
- Text generation
- Product cards
- Batch processing
- Library system
- Result viewer
- Queue system
- Version control
- Creative features (Try-On, Lifestyle, Advertising, etc.)
- Diagnostics and logging
- Export/Import functionality
- Comprehensive test suite
