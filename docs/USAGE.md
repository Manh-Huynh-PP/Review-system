# User Guide

This manual covers the core functionalities of the Review System for both **Creators (Admins)** and **Reviewers (Clients)**.

---

## 👨‍💻 For Creators (Admin)

As an admin, you have full control over projects, files, and versions.

### 1. Admin Account Setup & Login
**Creating an Admin Account:**
Since this system uses Firebase Authentication, you can create the first admin user via the Firebase Console:
1.  Go to **Authentication** > **Users** tab.
2.  Click **"Add user"**.
3.  Enter the email and password you wish to use as Admin.
4.  Click **"Add user"**.
*(Note: If you have enabled "Google Sign-in" only, simply log in with your Google account. The first user typically functions as the owner).*

**Logging In:**
- Navigate to `/login`.
- Sign in using your Google account or Email/Password.

### 2. Managing Projects
- **Create Project**: On the Dashboard, click the **"New Project"** button. Enter a project name and client name.
- **Archive Project**: To hide a completed project from the dashboard without deleting it:
    1.  Open the project details.
    2.  Click the **"Settings"** icon (or "Archive" button in the header).
    3.  Select **"Archive"**.
    4.  To view archived projects, toggle the "Show Archived" filter on the Dashboard.

### 3. Uploading & Managing Files
Inside a project:
- Click **"Upload File"**.
- Drag and drop files or select them from your computer.
- **Lock Comments**: If you want to stop receiving feedback on a specific version:
    1.  Open the file.
    2.  Click the **"Lock"** icon in the toolbar.
    3.  Reviewers will see a "Comments Locked" message.

**Supported Formats**:
- **Images**: PNG, JPG, WebP
- **Videos**: MP4
- **Documents**: PDF
- **3D Models**: GLB (GLTF Binary)
- **Image Sequences**: ZIP file containing numbered images (e.g., `frame_001.png`, `frame_002.png`...).

### 4. Version Control
- To update a file, open it and click the **"Upload New Version"** button (usually in the header or sidebar).
- Previous versions remain accessible via the version dropdown.

### 5. Sharing
- **Share Project**: Click the **"Share"** button in the project header to copy the public link.
- **Share File**: Open a specific file and click **"Share"** to get a direct link to that asset.

---

## 🕵️ For Reviewers (Clients)

You do not need an account to review assets.

### 1. Accessing the Review Link
- Click the link provided by the Creator (e.g., `https://domain.com/review/project-id`).
- You will be asked to enter your **Name**. This name will appear next to your comments.

### 2. Reviewing Assets

#### 🖼️ Images & PDFs
- **Pan/Zoom**: Use mouse wheel or pinch gestures to zoom. Click and drag to pan.
- **Annotations**:
    - Select a tool from the toolbar (Pen, Arrow, Rectangle).
    - Draw directly on the image to highlight areas.
    - Use `Ctrl+Z` (or `Cmd+Z`) to undo.
- **Comments**: Type feedback in the sidebar chat.

#### 🎥 Videos
- **Playback**: Use standard play/pause controls.
- **Frame Step**: Use Left/Right arrow keys to move frame-by-frame.
- **Timestamped Comments**: When you post a comment while the video is paused, it automatically tags the current timestamp. Clicking the timestamp in the comment jumps the video to that exact frame.

#### 🧊 3D Models
- **Orbit**: Left-click and drag to rotate the model.
- **Pan**: Right-click and drag.
- **Zoom**: Mouse wheel.

### 3. Feedback Status
- Admins can mark your comments as **"Resolved"** once they have addressed the feedback.
- Resolved comments are collapsed by default but can be viewed by toggling the filter.

---

## ❓ FAQ

**Q: Can I delete a comment?**
A: Currently, only the author of the comment (or admin) can delete it within the session.

**Q: Are my files private?**
A: Review links are public to anyone who has the URL. Ensure you only share links with intended reviewers.
