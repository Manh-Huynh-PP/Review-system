{
  "projectTitle": "Creative Asset Review Web Application",
  "corePhilosophy": "Minimalism, High Performance, and Dark Mode by default.",
  "implementationProgress": {
    "completed": [
      "✅ Project setup: React + Vite + TypeScript + Tailwind CSS",
      "✅ Firebase integration: Auth, Firestore, Storage with security rules",
      "✅ Admin authentication: Email/Password login via Firebase Auth",
      "✅ Project CRUD: Create, list, view projects with real-time updates",
      "✅ File upload system: Drag & drop for images, videos, GLB models (200MB limit)",
      "✅ Versioning system: Add new versions to existing files, switch between versions",
      "✅ Version management UI: Improved dropdown with history, upload new version, version count badge",
      "✅ Storage management: Firebase Storage bucket with CORS configuration",
      "✅ File preview: Images (lazy load), Videos (HTML5 player with poster), 3D Models (react-three-fiber GLB viewer)",
      "✅ UI components: Shadcn/UI (button, input, dialog, dropdown, badge, progress, separator)",
      "✅ Upload dialog: Compact dialog-based uploader with validation and progress",
      "✅ File management: Card-based layout with metadata, version dropdown, download links",
      "✅ Search & Sort: Real-time search + 4 sort options (name, date, type, size)",
      "✅ State management: Zustand stores for auth, projects, files, comments, theme with Firebase subscriptions",
      "✅ Routing: React Router v6 with admin layout and nested routes",
      "✅ Comment system: Real-time comments with timestamp linking for videos",
      "✅ Client review page: Public access via /review/:projectId without authentication",
      "✅ User name prompt: Display name entry dialog for clients on first visit (required, cannot close)",
      "✅ Comment resolution: Admin can mark comments as resolved",
      "✅ Video comment integration: Seek to timestamp when clicking comment",
      "✅ Share link generation: Copy public review link with toast notification",
      "✅ Role-based UI: Admin (full access) vs Client (view + comment only)",
      "✅ Firebase Security Rules: Public read + create comments, authenticated write",
      "✅ Client management system: CRUD operations with optional fields (only name required)",
      "✅ Project management enhancements: Description, deadline, tags, client selection",
      "✅ Synchronized UI: Shared components between admin and review pages",
      "✅ Activity notifications: Real-time bell icon with unread count, dropdown menu",
      "✅ Firestore rules deployed: Including notifications collection security",
      "✅ Performance optimization: Code splitting with lazy loading for pages and GLBViewer",
      "✅ Project archive system: Archive/Unarchive with dropdown menu UI",
      "✅ File delete functionality: Admin can delete files with cascade deletion (storage + comments + document)",
      "✅ File pagination: Load More button for displaying files in batches of 20",
      "✅ Comment threading: Reply to comments with nested indentation display",
      "✅ Theme system: Light/Dark mode toggle with localStorage persistence",
      "✅ Custom scrollbar: Themed scrollbar styling for consistent UI"
    ],
    "inProgress": [],
    "pending": []
  },
  "actors": {
    "admin": {
      "role": "The Creator",
      "features": [
        "Login via Firebase Auth (Email/Password).",
        "Create 'Projects', view list of projects, manage files, and versioning.",
        "Drag & drop upload for Images (PNG, JPG, WebP), Videos (MP4, MOV), and 3D Models (GLB).",
        "Handle versioning (v1 -> v2 -> v3) for re-uploaded files.",
        "View all client comments in real-time, resolve threads ('isResolved: boolean').",
        "Generate a generic public 'Review Link' (`/review/:projectId`)."
      ]
    },
    "client": {
      "role": "The Reviewer",
      "features": [
        "No Login: Access via shared unique link.",
        "Requires entering a display 'userName' upon first visit (stored in session/localStorage).",
        "High-quality, distraction-free viewer for assets.",
        "Smart Comments: Video comments linked to playback 'timestamp'. Clicking comment seeks video.",
        "Real-time updates via Firestore."
      ]
    }
  },
  "techStack": {
    "framework": "React + Vite + TypeScript (Strict mode)",
    "styling": "Tailwind CSS + clsx + tailwind-merge (Dark mode mandatory)",
    "uiComponents": "Shadcn/UI (mimic styles) or standard HTML/CSS",
    "3dEngine": "react-three-fiber, @react-three/drei (with <Stage>)",
    "stateManagement": "Zustand",
    "routing": "React Router v6 (createBrowserRouter)",
    "backend": "Firebase v9 (Auth, Firestore, Storage)",
    "utils": ["date-fns", "react-hot-toast", "uuid"]
  },
  "dataSchema": {
    "collections": [
      {
        "name": "projects",
        "documentId": "projectId",
        "fields": ["name: string", "createdAt: Timestamp", "status: 'active' | 'archived'", "adminEmail: string"]
      },
      {
        "name": "files",
        "parentCollection": "projects",
        "documentId": "fileId",
        "fields": [
          "name: string",
          "type: 'image' | 'video' | 'model'",
          "versions: Array<{ url: string, version: number, uploadedAt: Timestamp, metadata: { ... } }>",
          "currentVersion: number"
        ]
      },
      {
        "name": "comments",
        "parentCollection": "projects",
        "documentId": "commentId",
        "fields": [
          "fileId: string",
          "version: number",
          "userName: string",
          "content: string",
          "timestamp: number | null",
          "parentCommentId: string | null",
          "isResolved: boolean (Default false)",
          "createdAt: Timestamp"
        ]
      }
    ]
  },
  "securityRules": {
    "firestore": "Authenticated users are Admins. Public read on all collections. Public create on comments.",
    "storage": "Public read. Only authenticated users (Admins) can write/upload files."
  }
}