# Installation Guide

 This guide provides step-by-step instructions to set up the **Review System** locally for development or deployment.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher): [Download here](https://nodejs.org/)
*   **Git**: [Download here](https://git-scm.com/)
*   A **Google Account** for Firebase.

## 1. Clone the Repository

Open your terminal and clone the project repository:

```bash
git clone https://github.com/Manh-Huynh-Opensource/Review-system.git
cd Review-system
```

## 2. Install Dependencies

Install the required Node.js packages using `npm`:

```bash
npm install
```

## 3. Configure Firebase

The application uses **Firebase** for Authentication, Database (Firestore), and File Storage. You need to set up your own Firebase project.

### 3.1 Create a Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"** and follow the setup wizard.
3.  (Optional) Disable Google Analytics for this project if you don't need it.

### 3.2 Enable Authentication
1.  In the Firebase Console sidebar, navigate to **Build > Authentication**.
2.  Click **"Get started"**.
3.  Select **"Google"** as the sign-in method, enable it, and save.
4.  (Optional) Enable **"Email/Password"** if you want to support email logins.

### 3.3 Enable Firestore Database
1.  Navigate to **Build > Firestore Database**.
2.  Click **"Create database"**.
3.  Choose a location (e.g., `asia-southeast1` or `us-central1`).
4.  Start in **Test mode** (we will update rules later).

### 3.4 Enable Storage
1.  Navigate to **Build > Storage**.
2.  Click **"Get started"**.
3.  Start in **Test mode**.

### 3.5 specific Security Rules (Important!)

**Firestore Rules:**
Go to **Firestore Database > Rules** and replace the content with:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAdmin() {
      return request.auth != null && request.auth.token.email == "your-admin-email@gmail.com";
      // OR implement a more robust role-based system
    }

    match /projects/{projectId} {
      allow read: if true; // Public can view project details for review
      allow write: if request.auth != null; // Only authenticated users can edit
      
      match /files/{fileId} {
        allow read: if true;
        allow write: if request.auth != null;
        
        match /comments/{commentId} {
          allow read: if true;
          allow write: if true; // Public reviewers can add comments
        }
      }
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Storage Rules:**
Go to **Storage > Rules** and replace the content with:

```firestore
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Public read access for reviews
      allow write: if request.auth != null; // Only authenticated users can upload
    }
  }
}
```

## 4. Environment Variables

1.  In the Firebase Console, go to **Project settings** (gear icon).
2.  Scroll down to "Your apps" and select the Web app `</>`.
3.  Register the app (nickname: "Review System").
4.  Copy the `firebaseConfig` object values.

Create a file named `.env` in the root of your project:

```bash
cp .env.example .env
```

Open `.env` and fill in your keys:

```ini
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4.1 Obtaining Firebase Configuration Keys
To find the keys required for your `.env` file:
1.  Go to **Project settings** (gear icon at the top left of the Firebase Console).
2.  Scroll down to the **"Your apps"** card.
3.  Select your Web App (if you haven't created one, click the `</>` icon to register).
4.  Look for the `SDK setup and configuration` section.
5.  Select **"Config"** radio button.
6.  You will see a JavaScript object named `firebaseConfig`.
    - `apiKey` -> `VITE_FIREBASE_API_KEY`
    - `authDomain` -> `VITE_FIREBASE_AUTH_DOMAIN`
    - `projectId` -> `VITE_FIREBASE_PROJECT_ID`
    - `storageBucket` -> `VITE_FIREBASE_STORAGE_BUCKET`
    - `messagingSenderId` -> `VITE_FIREBASE_MESSAGING_SENDER_ID`
    - `appId` -> `VITE_FIREBASE_APP_ID`

## 5. Run Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 6. Build for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## 7. Deployment Guide

We recommend **Vercel** for the easiest deployment experience with this Vite project.

### 7.1 Deploying to Vercel
1.  Push your code to a Git repository (GitHub/GitLab/Bitbucket).
2.  Log in to [Vercel](https://vercel.com/) and click **"Add New..."** > **"Project"**.
3.  Import your repository.
4.  **Framework Preset**: Select `Vite`.
5.  **Environment Variables**:
    - Expand the "Environment Variables" section.
    - Add each key-value pair from your `.env` file (e.g., `VITE_FIREBASE_API_KEY`, etc.).
    - **Important**: Do not skip this step, or your app will not be able to connect to Firebase.
6.  Click **"Deploy"**.

### 7.2 Manual Deployment (Firebase Hosting)
1.  Install Firebase CLI: `npm install -g firebase-tools`
2.  Login: `firebase login`
3.  Initialize: `firebase init hosting`
    - Select your project.
    - Public directory: `dist`
    - Configure as SPA: `Yes`
4.  Build and Deploy:
    ```bash
    npm run build
    firebase deploy
    ```

## 8. Troubleshooting & Support

If you encounter any issues during installation or deployment, please verify:
- You have created the `.env` file with correct values.
- Your Firebase Security Rules are set to Test Mode or correctly configured as per Step 3.5.

**Contact Support:**
For further assistance, please contact the administrator via email: **admin@mahhuynh.work**

