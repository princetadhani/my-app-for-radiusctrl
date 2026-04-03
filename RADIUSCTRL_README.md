# 🎨 RADIUSCTRL - FreeRADIUS Management Console

A production-ready, dark-themed, IDE-like web interface for managing FreeRADIUS configuration files with real-time validation and deployment capabilities.

![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black)
![React](https://img.shields.io/badge/React-19.2.4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

### 🏗️ Architecture
- **Next.js 15 App Router** with TypeScript
- **Dark Glassmorphism Theme** with neon blue/purple/green/amber accents
- **Monaco Editor** integration for syntax highlighting
- **Framer Motion** animations throughout
- **Real-time mock API** with conflict detection

### 📐 Main Editor Page (`/`)
- **3-Panel IDE Layout**: Header, Sidebar, Editor, Deploy Console
- **File Tree Navigation**: Animated expand/collapse with chevron rotation
- **Monaco Code Editor**: Full syntax highlighting for INI/config files
- **Deploy Console**: Simulated terminal output with typing effect
- **Command Palette**: Quick file/action search (⌘K / Ctrl+K)
- **Conflict Resolution**: Diff editor for merge conflicts
- **Keyboard Shortcuts**: Ctrl+S (save), ⌘K (command palette), Esc (close modals)

### 📊 Logs Viewer (`/logs`)
- **Auto-scrolling terminal** with syntax-highlighted log levels
- **Play/Pause streaming** toggle
- **Clear logs** functionality
- **Download logs** as text file
- **Color-coded levels**: INFO (blue), DEBUG (muted), WARN (amber), ERROR (red)

### 📡 CoA Manager (`/coa`)
- **Two-panel layout**: Templates sidebar + Request editor
- **Template management**: Save, load, delete CoA/Disconnect templates
- **Form fields**: Request type, NAS IP, NAS Secret, Attributes
- **Live response display**: Terminal-style output with success/error simulation

## 🎨 Design System

### Color Palette (HSL)
```css
--background: 225 25% 6%           /* Deep navy black */
--foreground: 210 40% 92%          /* Near white */
--primary: 210 100% 60%            /* Neon blue */
--secondary: 225 15% 16%           /* Dark grey-blue */
--muted: 225 15% 14%               /* Darker grey */
--border: 225 15% 18%              /* Subtle borders */

/* Neon Accents */
--neon-blue: 210 100% 60%
--neon-purple: 270 80% 65%
--neon-green: 145 80% 55%
--neon-red: 0 85% 60%
--neon-amber: 38 95% 60%
```

### Animations
- **Page entrance**: Smooth fade-in with slide (400ms)
- **File tree expand/collapse**: Height animation (200ms)
- **Deploy console**: Slide up/down (250ms)
- **Command palette**: Modal fade + scale (200ms)
- **Status indicators**: Pulsing neon glow (2s infinite)
- **Terminal output**: Staggered line appearance (150ms)
- **Typing cursor**: Blinking animation (1s)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
cd /tmp/my-app

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Tech Stack

### Core
- **Next.js 16.2.2** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS 4** - Utility-first CSS

### UI Components & Libraries
- **Framer Motion 12.x** - Animation library
- **Monaco Editor (@monaco-editor/react 4.x)** - Code editor
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Development
- **ESLint** - Code linting
- **Next.js Turbopack** - Fast bundler

## 📁 Project Structure

```
/tmp/my-app/
├── app/
│   ├── page.tsx              # Main config editor
│   ├── logs/page.tsx         # Logs viewer
│   ├── coa/page.tsx          # CoA manager
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Global styles + theme
├── components/
│   ├── status-header.tsx     # Top header with status
│   ├── file-tree.tsx         # Recursive file tree
│   ├── editor-panel.tsx      # Monaco editor wrapper
│   ├── deploy-console.tsx    # Terminal console
│   ├── command-palette.tsx   # Quick search (⌘K)
│   └── conflict-dialog.tsx   # Merge conflict resolver
├── lib/
│   ├── mock-data.ts          # File tree & content
│   ├── api.ts                # Mock API functions
│   └── utils.ts              # Utility functions
└── components.json           # Shadcn config
```

## 🎮 Usage

### Main Editor
1. **Select file** from sidebar tree
2. **Edit content** in Monaco editor
3. **Save changes** (Ctrl+S or click Save button)
4. **Deploy** by clicking "Apply & Deploy" in console
5. **Watch validation** output in real-time

### Command Palette
- Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux)
- Type to search files or actions
- Use **↑↓** to navigate, **Enter** to select, **Esc** to close

### Conflict Resolution
- If file changed on disk, conflict dialog appears automatically
- View **side-by-side diff** (disk version vs. local changes)
- Choose to **Cancel** or **Force Overwrite**

### Logs Viewer
- Navigate to `/logs`
- **Pause/Resume** log streaming
- **Clear** all logs
- **Download** logs as text file

### CoA Manager
- Navigate to `/coa`
- **Select template** or create new
- **Configure** NAS IP, secret, and RADIUS attributes
- **Send request** and view response

## 🎯 Key Features Implemented

✅ Dark glassmorphism theme with neon accents  
✅ Monaco Editor with custom dark theme  
✅ Animated file tree with expand/collapse  
✅ Deploy console with simulated terminal output  
✅ Command palette with fuzzy search  
✅ Conflict resolution dialog with diff viewer  
✅ Status indicators with pulsing animations  
✅ Framer Motion entrance animations  
✅ Keyboard shortcuts (Ctrl+S, ⌘K, Esc)  
✅ Three pages: Editor, Logs, CoA Manager  
✅ Toast notifications  
✅ Responsive layout  
✅ Custom scrollbars  
✅ Grid background pattern  
✅ Neon text glows  
✅ Auto-scroll in console/logs  
✅ Mock API with delays and conflict simulation  

## 🔧 Development

### Build for Production
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## 📝 Notes

- **Mock Data**: All file operations and API calls are simulated
- **Conflict Rate**: 10% chance of conflict on save (configurable in `lib/api.ts`)
- **Deploy Success Rate**: 90% (configurable in `lib/api.ts`)
- **Auto-refresh**: Status updates every 5s, new logs every 2s

## 🎨 Design Inspiration

- VSCode dark theme
- Terminal.app aesthetics
- Cyberpunk neon accents
- Professional network admin tools

## 📄 License

This is a demonstration project created for educational purposes.

---

**Built with ❤️ using Next.js 15, React 19, and Tailwind CSS 4**

