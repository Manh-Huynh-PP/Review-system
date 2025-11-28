# Firebase Security Rules Deployment

## Current Status
✅ Firestore Rules configured for public review access
✅ Storage CORS configured via Google Cloud SDK

## Deploy Firestore Rules

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project (if not done)
firebase init firestore

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

## Verify Rules
After deployment, verify in Firebase Console:
- Go to Firestore Database → Rules
- Check that public can:
  - Read all collections
  - Create comments
- Check that only authenticated users can:
  - Create/update/delete projects
  - Create/update/delete files
  - Update/delete comments

## Storage Rules (Already Configured)
Storage CORS was configured using:
```bash
gsutil cors set cors.json gs://review-99901.firebasestorage.app
```

Current CORS config allows:
- Public read access from any origin
- Only authenticated users can write/upload
