# Contributing to AltOptimizer

Thank you for your interest in contributing to **AltOptimizer**!

## Development Setup

1. **Prerequisites**:
   - Node.js 20+ (Node.js 22 recommended)
   - .NET 9 SDK
   - Windows 10 / Windows 11 (with PowerShell)

2. **Clone and Install**:
   ```bash
   git clone https://github.com/your-username/AltOptimizer.git
   cd AltOptimizer
   npm install
   ```

3. **Build Native Engine**:
   ```bash
   npm run build:native
   ```

4. **Run in Development**:
   ```bash
   # In terminal 1 (starts local API & telemetry server):
   npm run server

   # In terminal 2 (starts Vite frontend with HMR):
   npm run dev

   # Or run as Electron desktop window:
   npm run app
   ```

## Pull Request Guidelines
- Ensure all native builds succeed without warnings.
- Verify that `npm run build` generates a clean bundle without errors.
- Test both user-level and elevated admin features.
