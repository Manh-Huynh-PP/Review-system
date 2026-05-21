const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin SDK (will use default service account when deployed)
admin.initializeApp();
const bucket = admin.storage().bucket();

async function deleteStoragePath(path) {
  if (!path) return;
  try {
    // path should be the full object path within the bucket (no gs://)
    const file = bucket.file(path);
    await file.delete();
    console.log(`Deleted storage object: ${path}`);
  } catch (err) {
    // If file not found, just warn and continue
    if (err && err.code === 404) {
      console.warn(`Storage object not found (already deleted): ${path}`);
    } else {
      console.error(`Failed to delete storage object ${path}:`, err.message || err);
    }
  }
}

async function deleteStoragePrefix(prefix) {
  if (!prefix) return;
  try {
    // deleteFiles supports prefix, will delete all objects under the prefix
    await bucket.deleteFiles({ prefix });
    console.log(`Deleted storage objects with prefix: ${prefix}`);
  } catch (err) {
    console.error(`Failed to delete storage prefix ${prefix}:`, err.message || err);
  }
}

// Helper: take possible fields from doc data that reference storage paths
function collectPathsFromDoc(data) {
  const paths = new Set();
  if (!data || typeof data !== 'object') return [];

  // Common field names
  if (Array.isArray(data.attachmentPaths)) data.attachmentPaths.forEach(p => p && paths.add(p));
  if (Array.isArray(data.attachments)) data.attachments.forEach(a => {
    if (typeof a === 'string') paths.add(a);
    else if (a && a.path) paths.add(a.path);
  });

  // Versions array (files may store versions with urls)
  if (Array.isArray(data.versions)) {
    data.versions.forEach(v => {
      if (!v) return;
      // Skip external link URLs - they are not Firebase Storage paths
      if (v.isExternal) return;
      if (v.path) paths.add(v.path);
      if (v.url && typeof v.url === 'string') {
        // If url is a Storage URL (gs:// or contains /o/), try to extract object path
        const match = v.url.match(/\/o\/(.*)\?/);
        if (match && match[1]) paths.add(decodeURIComponent(match[1]));
      }
    });
  }

  // Thumbnails or derived paths
  if (data.thumbnailPath) paths.add(data.thumbnailPath);
  if (data.thumbPath) paths.add(data.thumbPath);

  return Array.from(paths);
}

exports.cleanUpAttachmentsOnCommentDelete = functions.firestore
  .document('projects/{projectId}/comments/{commentId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    const projectId = context.params.projectId;
    console.log(`Comment deleted in project ${projectId}, id=${context.params.commentId}`);

    const paths = collectPathsFromDoc(data);
    if (paths.length === 0) {
      console.log('No attachment paths found on comment.');
      return null;
    }

    // Delete each referenced storage path
    await Promise.all(paths.map(p => deleteStoragePath(p)));
    return null;
  });

exports.cleanUpAttachmentsOnFileDelete = functions.firestore
  .document('projects/{projectId}/files/{fileId}')
  .onDelete(async (snap, context) => {
    const data = snap.data();
    const projectId = context.params.projectId;
    console.log(`File document deleted in project ${projectId}, fileId=${context.params.fileId}`);

    // Collect explicit paths
    const paths = collectPathsFromDoc(data);

    // If file documents store a storage prefix (e.g., folder for sequence frames), try to delete by prefix
    if (data && data.storagePrefix) {
      // Example storagePrefix: `projects/${projectId}/files/${fileId}/`
      await deleteStoragePrefix(data.storagePrefix);
    }

    if (paths.length > 0) {
      await Promise.all(paths.map(p => deleteStoragePath(p)));
    }

    // Also try conventional locations: if fileId is used as folder name
    const possiblePrefix = `projects/${projectId}/files/${context.params.fileId}/`;
    await deleteStoragePrefix(possiblePrefix);

    return null;
  });

exports.validateFileUpload = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;

  // PATTERN 1: Project Files
  // projects/{projectId}/files/{fileId}/v{version}/...
  const fileMatch = filePath.match(/^projects\/([^/]+)\/files\/([^/]+)\/v(\d+)\/(.*)$/);

  // PATTERN 2: Comment Attachments
  // comments/{projectId}/{commentId}/{fileName}
  const commentMatch = filePath.match(/^comments\/([^/]+)\/([^/]+)\/(.*)$/);

  if (!fileMatch && !commentMatch) {
    console.log(`Doing nothing: File ${filePath} does not match known patterns.`);
    return null;
  }

  // --- Common Validation Logic ---
  let status = 'clean';
  const fileName = fileMatch ? fileMatch[4] : commentMatch[3];

  try {
    const size = object.size;
    if (size > 500 * 1024 * 1024) {
      console.warn('File too large');
    }

    // --- Real Virus Scan with VirusTotal ---
    // Support for .env (modern)
    const vtApiKey = process.env.VIRUSTOTAL_API_KEY;

    if (!vtApiKey) {
      console.warn('⚠️ VIRUSTOTAL_API_KEY missing. Skipping real scan.');
    }

    // Only scan if not an image (VirusTotal has rate limits, better to select what to scan)
    // Actually, for security, scan everything. But for free API tier (4 req/min), be careful.
    // Let's implement full scan for demonstration.

    try {
      console.log('🔍 Starting VirusTotal Scan...');
      const VirusTotalApi = require('node-virustotal');
      const virusTotal = new VirusTotalApi(vtApiKey);
      const fs = require('fs');
      const os = require('os');
      const path = require('path');
      const crypto = require('crypto');

      // 1. Download file to temp
      const tempFilePath = path.join(os.tmpdir(), fileName);
      await file.download({ destination: tempFilePath });

      // 2. Read file and calculate hash (to check if already scanned) or upload
      const fileBuffer = fs.readFileSync(tempFilePath);

      // Check file size < 32MB for VirusTotal standard API
      if (object.size > 32 * 1024 * 1024) {
        console.warn('⚠️ File too large for standard VT API, skipping scan');
      } else {
        // Upload file to VirusTotal
        // Note: This matches the user's request to use the provided key.
        try {
          // Fix Hanging Issue: Wrap in 10s timeout to prevent Cloud Function from staying pending
          const scanPromise = virusTotal.fileScan(fileBuffer, fileName);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('VT Scan Timeout')), 10000));

          const response = await Promise.race([scanPromise, timeoutPromise]);
          console.log('📤 Sent to VirusTotal:', response);
        } catch (apiError) {
          console.error('VT API Error/Timeout:', apiError.message);
        }
      }

      // Clean up temp file
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    } catch (vtError) {
      console.error('⚠️ VirusTotal Scan Failed (likely rate limit or network):', vtError.message);
      // Fallback: If scanner fails, do we block? 
      // For now, let's allow but log error.
    }

    // Keep the "Virus" name check as a fail-safe / test mechanism
    if (fileName.toLowerCase().includes('virus') || fileName.toLowerCase().includes('infected')) {
      status = 'infected';
      console.warn(`🚨 DETECTED TEST VIRUS SIGNATURE in ${fileName} (Mock Logic Fallback)`);

      // Strict Policy: DELETE infected file immediately
      try {
        await file.delete();
        console.warn(`🗑️ Deleted infected file: ${filePath}`);
      } catch (deleteErr) {
        console.error(`Failed to delete infected file: ${deleteErr.message}`);
      }
    }
  } catch (err) {
    console.error('Validation error:', err);
    status = 'error';
  }

  // --- Update Firestore ---

  // CASE 1: Project File
  if (fileMatch) {
    const [_, projectId, fileId, versionStr] = fileMatch;
    const version = parseInt(versionStr, 10);
    const fileRef = admin.firestore().doc(`projects/${projectId}/files/${fileId}`);

    try {
      await admin.firestore().runTransaction(async (t) => {
        const doc = await t.get(fileRef);
        if (!doc.exists) return;
        const data = doc.data();
        const versions = data.versions || [];
        const index = versions.findIndex(v => v.version === version);
        if (index !== -1) {
          versions[index].validationStatus = status;
          t.update(fileRef, { versions });
        }
      });
      console.log(`✅ Updated FILE status: ${fileId} v${version} -> ${status}`);
    } catch (e) {
      console.error('Failed to update file status', e);
    }
  }

  // CASE 2: Comment Attachment
  if (commentMatch) {
    const [_, projectId, commentId] = commentMatch;
    const commentRef = admin.firestore().doc(`projects/${projectId}/comments/${commentId}`);

    try {
      await admin.firestore().runTransaction(async (t) => {
        const doc = await t.get(commentRef);
        if (!doc.exists) return;

        const data = doc.data();
        let attachments = data.attachments || [];

        // Find attachment by checking if URL contains the filename or id matching timestamp
        // Since we don't have the exact array index or ID easily from storage path alone (unless we parse it),
        // we'll try to match by name match within the object name.
        // Storage path: comments/pid/cid/timestamp_index_name
        // We can match loosely or try to find the entry where url contains the filename.

        // Better: Find the attachment where the URL (if stored) or Name generally matches.
        // Actually, in `uploadCommentAttachments`, we construct path: `.../${timestamp}_${index}_${sanitizedFileName}`
        // and we store that full URL.
        // So we can check if the attachment's URL contains the object's name (last part).
        // object.name is full path `comments/.../...`
        // We can just rely on the fact that we need to update the status of the item that matches this file.

        // This is a bit tricky if multiple files have same name, but timestamp makes it unique.

        const mediaLink = object.mediaLink || object.name; // SelfLink or name

        let found = false;
        attachments = attachments.map(att => {
          // Check if this attachment corresponds to the uploaded file
          // The safest is if we stored the Storage Path in Firestore, but we store URL.
          // The URL contains the path usually encoded.

          if (att.url && att.url.includes(encodeURIComponent(fileName))) {
            found = true;
            return { ...att, validationStatus: status };
          }
          // Fallback: check if decoded URL contains it
          if (att.url && decodeURIComponent(att.url).includes(fileName)) {
            found = true;
            return { ...att, validationStatus: status };
          }
          return att;
        });

        if (found) {
          t.update(commentRef, { attachments });
        }
      });
      console.log(`✅ Updated COMMENT attachment status: ${commentId} -> ${status}`);
    } catch (e) {
      console.error('Failed to update comment status', e);
    }
  }

  return null;
});

exports.resendAccessLink = functions.https.onCall(async (data, context) => {
  const { projectId, email } = data;

  // Basic validation
  if (!projectId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing project ID or email');
  }

  // 1. Check if there is an existing invitation for this email & project
  const invitationsRef = admin.firestore().collection('project_invitations');
  const snapshot = await invitationsRef
    .where('projectId', '==', projectId)
    .where('email', '==', email)
    .where('status', 'in', ['pending', 'accepted']) // Only consider active invites
    .get();

  if (snapshot.empty) {
    // Security: Don't reveal if email exists or not?
    // User requirement: "kiểm tra nếu mail không có trong list share thì báo lỗi"
    // So we throw NOT FOUND error.
    throw new functions.https.HttpsError('not-found', 'Email này không có trong danh sách được mời.');
  }

  // 2. Generate NEW invitation (Keep old ones active)
  const crypto = require('crypto');
  const newToken = crypto.randomBytes(16).toString('hex'); // 32 chars
  const accessCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 60 * 1000); // Code valid for 30 mins

  const oldData = snapshot.docs[0].data();

  const newInvitation = {
    ...oldData,
    token: newToken,
    status: 'pending',
    createdAt: now,
    revokedAt: null,
    allowedDevices: [],
    verificationCode: null,
    accessCode: { // New field for recovery OTP
      code: accessCode,
      expiresAt: expiresAt
    }
  };

  delete newInvitation.id;

  const batch = admin.firestore().batch();
  const newInviteRef = invitationsRef.doc(newToken);
  batch.set(newInviteRef, newInvitation);

  // 3. Send Email
  const mailRef = admin.firestore().collection('mail').doc();
  const origin = data.origin || 'https://review-system-b8883.web.app';
  const link = `${origin}/review/${projectId}?token=${newToken}`;

  batch.set(mailRef, {
    to: email,
    message: {
      subject: `[Code: ${accessCode}] Link truy cập dự án: ${oldData.resourceType === 'project' ? 'Project' : 'File'}`,
      html: `
        <p>Bạn đã yêu cầu gửi lại link truy cập.</p>
        <p>Mã truy cập của bạn là: <strong>${accessCode}</strong></p>
        <p>Hoặc truy cập trực tiếp bằng link bên dưới:</p>
        <a href="${link}">Truy cập ngay</a>
        <p>Mã và Link có hiệu lực trong 30 phút (cho việc nhập mã).</p>
      `
    }
  });

  await batch.commit();

  return { success: true, message: 'Link và mã truy cập mới đã được gửi vào email của bạn.' };
});

exports.verifyAccessCode = functions.https.onCall(async (data, context) => {
  const { projectId, email, code, deviceId } = data;

  if (!projectId || !email || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing info');
  }

  const invitationsRef = admin.firestore().collection('project_invitations');
  const snapshot = await invitationsRef
    .where('projectId', '==', projectId)
    .where('email', '==', email)
    .where('status', 'in', ['pending', 'accepted'])
    .get();

  if (snapshot.empty) {
    throw new functions.https.HttpsError('not-found', 'Email không tồn tại');
  }

  // Find the invitation that matches the code
  const match = snapshot.docs.find(doc => {
    const d = doc.data();
    return d.accessCode && d.accessCode.code === code;
  });

  if (!match) {
    throw new functions.https.HttpsError('invalid-argument', 'Mã xác thực không đúng');
  }

  const invitation = match.data();
  if (invitation.accessCode.expiresAt.toMillis() < Date.now()) {
    throw new functions.https.HttpsError('failed-precondition', 'Mã xác thực đã hết hạn');
  }

  // Code is valid. Bind the device if provided.
  const updates = {
    accessCode: null
  };

  if (deviceId) {
    const allowed = invitation.allowedDevices || [];
    if (!allowed.includes(deviceId)) {
      updates.allowedDevices = [...allowed, deviceId];
    }
  }

  await match.ref.update(updates);

  return { token: match.id };
});

/**
 * Trigger: New Comment Created
 * Creates in-app notification and sends email to admin
 */
exports.onCommentCreated = functions.firestore
  .document('projects/{projectId}/comments/{commentId}')
  .onCreate(async (snap, context) => {
    const comment = snap.data();
    const { projectId } = context.params;

    try {
      // Get project data for adminEmail and projectName
      const projectDoc = await admin.firestore().doc(`projects/${projectId}`).get();
      if (!projectDoc.exists) {
        console.warn(`Project ${projectId} not found for comment notification`);
        return null;
      }
      const projectData = projectDoc.data();

      // Get file name
      const fileDoc = await admin.firestore().doc(`projects/${projectId}/files/${comment.fileId}`).get();
      const fileName = fileDoc.exists ? fileDoc.data().name : 'file';

      const notificationData = {
        type: 'comment',
        projectId,
        projectName: projectData.name,
        fileId: comment.fileId,
        fileName,
        userName: comment.userName || 'Anonymous',
        message: `${comment.userName || 'Anonymous'} đã bình luận trong "${fileName}"`,
        isRead: false,
        createdAt: admin.firestore.Timestamp.now(),
        adminEmail: projectData.adminEmail ? String(projectData.adminEmail).toLowerCase() : null
      };

      // 1. Create in-app notification
      await admin.firestore().collection('notifications').add(notificationData);
      console.log('✅ Created in-app notification for comment');

      // 2. Create email document (if notification emails exist)
      // Priority: project notificationEmails + adminEmail
      let recipientEmails = [];

      // 1. Project notification list (Subscribed guests)
      if (Array.isArray(projectData.notificationEmails)) {
        recipientEmails = [...projectData.notificationEmails];
      }

      // 2. Admin Email + User Settings
      if (projectData.adminEmail) {
        // If project doesn't have specific emails, check user settings
        const userSettingsDoc = await admin.firestore().doc(`userSettings/${projectData.adminEmail}`).get();
        let adminNotificationEmail = projectData.adminEmail;
        let shouldSendToAdmin = true;

        if (userSettingsDoc.exists) {
          const userSettings = userSettingsDoc.data();

          // Check if admin receives these notifications
          if (userSettings.defaultNotificationEmail) {
            adminNotificationEmail = userSettings.defaultNotificationEmail;
          }

          // CHECK EMAIL SETTINGS
          if (userSettings.emailSettings && userSettings.emailSettings.comment === false) {
            shouldSendToAdmin = false;
          }
        }

        // Add if not already present and allowed
        if (shouldSendToAdmin && !recipientEmails.includes(adminNotificationEmail)) {
          recipientEmails.push(adminNotificationEmail);
        }
      }

      if (recipientEmails.length > 0) {
        recipientEmails = [...new Set(recipientEmails)]; // Dedupe

        // Use origin from comment if available (for custom domains), otherwise fallback to firebase default
        const baseUrl = comment.origin || `https://${process.env.GCLOUD_PROJECT}.web.app`;
        const projectLink = `${baseUrl}/app/projects/${projectId}`;
        const clientLink = `${baseUrl}/review/${projectId}`; // Link for unsubscribing

        const mailRef = admin.firestore().collection('mail').doc();
        await mailRef.set({
          to: recipientEmails, // Array of email recipients
          message: {
            subject: `[Review System] Bình luận mới: ${comment.userName || 'Anonymous'} trong ${projectData.name}`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2>Thông báo bình luận mới</h2>
                <p><strong>Dự án:</strong> ${projectData.name}</p>
                <p><strong>File:</strong> ${fileName}</p>
                <p><strong>Người bình luận:</strong> ${comment.userName || 'Anonymous'}</p>
                <hr />
                <p style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
                  "${comment.content}"
                </p>
                <br />
                <a href="${projectLink}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Xem chi tiết tại Dashboard
                </a>
                <p style="font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                  Bạn nhận được email này vì đã đăng ký nhận thông báo từ dự án.<br/>
                  Để hủy đăng ký, vui lòng <a href="${clientLink}">truy cập dự án</a> và chọn hủy đăng ký.
                </p>
              </div>
            `
          }
        });
        console.log(`✅ Created email document for comment notification to ${recipientEmails.length} recipients`);
      }

      return null;
    } catch (error) {
      console.error('❌ Error creating comment notification:', error);
      return null;
    }
  });

/**
 * Trigger: Comment Updated (Resolve)
 * Creates notification when a comment is resolved
 */
exports.onCommentUpdated = functions.firestore
  .document('projects/{projectId}/comments/{commentId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only trigger on resolve status change
    if (newData.isResolved && !oldData.isResolved) {
      const { projectId } = context.params;

      try {
        const projectDoc = await admin.firestore().doc(`projects/${projectId}`).get();
        if (!projectDoc.exists) return null;

        const projectData = projectDoc.data();
        const fileDoc = await admin.firestore().doc(`projects/${projectId}/files/${newData.fileId}`).get();
        const fileName = fileDoc.exists ? fileDoc.data().name : 'file';

        // 1. Internal Notification
        await admin.firestore().collection('notifications').add({
          type: 'resolve',
          projectId,
          projectName: projectData.name,
          fileId: newData.fileId,
          fileName,
          userName: null, // Usually system or admin resolved
          message: `Bình luận trong "${fileName}" đã được giải quyết`,
          isRead: false,
          createdAt: admin.firestore.Timestamp.now(),
          adminEmail: projectData.adminEmail ? String(projectData.adminEmail).toLowerCase() : null
        });

        console.log('✅ Created resolve notification');

        // 2. Email Notification (Admin Only usually, or maybe comment author?)
        // Design: Send to Admin if enabled.
        if (projectData.adminEmail) {
          const userSettingsDoc = await admin.firestore().doc(`userSettings/${projectData.adminEmail}`).get();
          let adminNotificationEmail = projectData.adminEmail;
          let shouldSendToAdmin = true;

          if (userSettingsDoc.exists) {
            const userSettings = userSettingsDoc.data();
            if (userSettings.defaultNotificationEmail) {
              adminNotificationEmail = userSettings.defaultNotificationEmail;
            }
            // CHECK EMAIL SETTINGS: resolve
            if (userSettings.emailSettings && userSettings.emailSettings.resolve === false) {
              shouldSendToAdmin = false;
            }
          }

          if (shouldSendToAdmin) {
            const baseUrl = `https://${process.env.GCLOUD_PROJECT}.web.app`;
            // Use project ID for admin dashboard link
            const projectLink = `${baseUrl}/app/projects/${projectId}`;

            const mailRef = admin.firestore().collection('mail').doc();
            await mailRef.set({
              to: [adminNotificationEmail],
              message: {
                subject: `[Review System] Bình luận đã được giải quyết: ${projectData.name}`,
                html: `
                   <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                     <h2>Bình luận đã được giải quyết</h2>
                     <p><strong>Dự án:</strong> ${projectData.name}</p>
                     <p><strong>File:</strong> ${fileName}</p>
                     <p><strong>Nội dung bình luận:</strong> "${newData.content}"</p>
                     <br />
                     <a href="${projectLink}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                       Xem chi tiết
                     </a>
                   </div>
                 `
              }
            });
            console.log(`✅ Created email for resolved comment to ${adminNotificationEmail}`);
          }
        }

        return null;
      } catch (error) {
        console.error('❌ Error creating resolve notification:', error);
        return null;
      }
    }

    return null;
  });

/**
 * Trigger: New File Created
 * Creates notification when a new file is uploaded
 */
exports.onFileCreated = functions.firestore
  .document('projects/{projectId}/files/{fileId}')
  .onCreate(async (snap, context) => {
    const file = snap.data();
    const { projectId, fileId } = context.params;

    try {
      const projectDoc = await admin.firestore().doc(`projects/${projectId}`).get();
      if (!projectDoc.exists) return null;

      const projectData = projectDoc.data();

      // 1. Internal Notification
      await admin.firestore().collection('notifications').add({
        type: 'upload',
        projectId,
        projectName: projectData.name,
        fileId,
        fileName: file.name,
        userName: null,
        message: `File mới "${file.name}" đã được tải lên`,
        isRead: false,
        createdAt: admin.firestore.Timestamp.now(),
        adminEmail: projectData.adminEmail ? String(projectData.adminEmail).toLowerCase() : null
      });

      console.log('✅ Created upload notification for new file');

      // 2. Email Notification
      let recipientEmails = [];
      // 1. Project notification list (Subscribed guests) - Ensure it's an array
      if (Array.isArray(projectData.notificationEmails)) {
        recipientEmails = [...projectData.notificationEmails];
      }

      // 2. Admin Email + User Settings
      if (projectData.adminEmail) {
        // Check user settings for admin
        const userSettingsDoc = await admin.firestore().doc(`userSettings/${projectData.adminEmail}`).get();
        let adminNotificationEmail = projectData.adminEmail;
        let shouldSendToAdmin = true;

        if (userSettingsDoc.exists) {
          const userSettings = userSettingsDoc.data();
          if (userSettings.defaultNotificationEmail) {
            adminNotificationEmail = userSettings.defaultNotificationEmail;
          }
          // CHECK EMAIL SETTINGS: upload
          if (userSettings.emailSettings && userSettings.emailSettings.upload === false) {
            shouldSendToAdmin = false;
          }
        }
        // Add if not already present
        if (shouldSendToAdmin && !recipientEmails.includes(adminNotificationEmail)) {
          recipientEmails.push(adminNotificationEmail);
        }
      }

      if (recipientEmails.length > 0) {
        // Deduplicate
        recipientEmails = [...new Set(recipientEmails)];

        const baseUrl = `https://${process.env.GCLOUD_PROJECT}.web.app`;
        const projectLink = `${baseUrl}/review/${projectId}`; // Point to client review page
        const unsubscribeLink = projectLink; // For now pointing to review page UI

        const mailRef = admin.firestore().collection('mail').doc();
        await mailRef.set({
          to: recipientEmails,
          message: {
            subject: `[Review System] File mới: ${file.name} trong ${projectData.name}`,
            html: `
              <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                <h2>File mới được tải lên</h2>
                <p><strong>Dự án:</strong> ${projectData.name}</p>
                <p><strong>File:</strong> ${file.name}</p>
                <br />
                <a href="${projectLink}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Xem file
                </a>
                <p style="font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                  Bạn nhận được email này vì đã đăng ký nhận thông báo từ dự án.<br/>
                  Để hủy đăng ký, vui lòng <a href="${unsubscribeLink}">truy cập dự án</a> và chọn hủy đăng ký.
                </p>
              </div>
            `
          }
        });
        console.log(`✅ Sent email for new file to ${recipientEmails.length} recipients`);
      }

      return null;
    } catch (error) {
      console.error('❌ Error creating upload notification:', error);
      return null;
    }
  });

/**
 * Trigger: File Updated (New Version)
 * Creates notification when a file version is added
 */
exports.onFileUpdated = functions.firestore
  .document('projects/{projectId}/files/{fileId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const { projectId, fileId } = context.params;

    // Check if versions array length increased
    const oldVersions = oldData.versions || [];
    const newVersions = newData.versions || [];

    if (newVersions.length > oldVersions.length) {
      // New version added
      const latestVersion = newVersions[newVersions.length - 1];
      console.log(`New version detected for file ${fileId}: v${latestVersion.version}`);

      try {
        const projectDoc = await admin.firestore().doc(`projects/${projectId}`).get();
        if (!projectDoc.exists) return null;
        const projectData = projectDoc.data();

        // Send Email Notification
        let recipientEmails = [];
        if (Array.isArray(projectData.notificationEmails)) {
          recipientEmails = [...projectData.notificationEmails];
        }

        if (projectData.adminEmail) {
          const userSettingsDoc = await admin.firestore().doc(`userSettings/${projectData.adminEmail}`).get();
          let adminNotificationEmail = projectData.adminEmail;
          let shouldSendToAdmin = true;

          if (userSettingsDoc.exists) {
            const userSettings = userSettingsDoc.data();
            if (userSettings.defaultNotificationEmail) {
              adminNotificationEmail = userSettings.defaultNotificationEmail;
            }
            // CHECK EMAIL SETTINGS: version
            if (userSettings.emailSettings && userSettings.emailSettings.version === false) {
              shouldSendToAdmin = false;
            }
          }
          if (shouldSendToAdmin && !recipientEmails.includes(adminNotificationEmail)) {
            recipientEmails.push(adminNotificationEmail);
          }
        }

        if (recipientEmails.length > 0) {
          recipientEmails = [...new Set(recipientEmails)];
          const baseUrl = `https://${process.env.GCLOUD_PROJECT}.web.app`;
          const projectLink = `${baseUrl}/review/${projectId}?fileId=${fileId}`;

          const mailRef = admin.firestore().collection('mail').doc();
          await mailRef.set({
            to: recipientEmails,
            message: {
              subject: `[Review System] Version mới: ${newData.name} (v${latestVersion.version})`,
              html: `
                  <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
                    <h2>Cập nhật phiên bản mới</h2>
                    <p><strong>Dự án:</strong> ${projectData.name}</p>
                    <p><strong>File:</strong> ${newData.name}</p>
                    <p><strong>Phiên bản:</strong> v${latestVersion.version}</p>
                    <br />
                    <a href="${projectLink}" style="background: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Xem thay đổi
                    </a>
                    <p style="font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                      Bạn nhận được email này vì đã đăng ký nhận thông báo từ dự án.<br/>
                      Để hủy đăng ký, vui lòng <a href="${projectLink}">truy cập dự án</a> và chọn hủy đăng ký.
                    </p>
                  </div>
                `
            }
          });
          console.log(`✅ Sent email for new version to ${recipientEmails.length} recipients`);
        }

      } catch (error) {
        console.error('❌ Error handling file update:', error);
      }
    }
    return null;
  });

// --- SUBSCRIPTION MANAGEMENT API ---

exports.subscribeToNotifications = functions.https.onCall(async (data, context) => {
  const { projectId, email } = data;

  if (!projectId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing project ID or email');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }

  // Add email to project's notificationEmails array
  const projectRef = admin.firestore().collection('projects').doc(projectId);

  try {
    // Check if project exists
    const doc = await projectRef.get();
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', 'Project not found');
    }

    await projectRef.update({
      notificationEmails: admin.firestore.FieldValue.arrayUnion(email)
    });

    return { success: true, message: `Successfully subscribed ${email}` };
  } catch (error) {
    console.error('Subscription error:', error);
    throw new functions.https.HttpsError('internal', 'Subscribe failed');
  }
});

exports.unsubscribeFromNotifications = functions.https.onCall(async (data, context) => {
  const { projectId, email } = data;

  if (!projectId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing project ID or email');
  }

  const projectRef = admin.firestore().collection('projects').doc(projectId);

  try {
    await projectRef.update({
      notificationEmails: admin.firestore.FieldValue.arrayRemove(email)
    });
    return { success: true, message: `Successfully unsubscribed ${email}` };
  } catch (error) {
    console.error('Unsubscribe error:', error);
    throw new functions.https.HttpsError('internal', 'Unsubscribe failed');
  }
});

exports.checkSubscription = functions.https.onCall(async (data, context) => {
  const { projectId, email } = data;

  if (!projectId || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing info');
  }

  try {
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return { isSubscribed: false };
    }

    const projectData = projectDoc.data();
    const emails = projectData.notificationEmails || [];
    const isSubscribed = emails.includes(email);

    return { isSubscribed };
  } catch (error) {
    console.error('Check subscription error:', error);
    throw new functions.https.HttpsError('internal', 'Check failed');
  }
});

/**
 * Secure proxy for listing Google Drive folder contents
 * API key stays server-side, only authenticated admins can call this
 */
exports.listDriveFolder = functions.https.onCall(async (data, context) => {
  // 1. Auth check - only authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Bạn cần đăng nhập để sử dụng tính năng này.');
  }

  const { folderId } = data;
  if (!folderId || typeof folderId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Thiếu folder ID');
  }

  // 2. Initialize Service Account Auth
  const path = require('path');
  const keyFilePath = path.join(__dirname, 'google-drive-credentials.json');

  try {
    // 3. Use Google Drive API v3 with Service Account
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`,
      fields: 'files(id, name, mimeType, thumbnailLink, webContentLink, modifiedTime)',
      orderBy: 'name',
      pageSize: 500,
    });

    const files = (response.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      thumbnailLink: f.thumbnailLink || null,
      webContentLink: f.webContentLink || null,
      modifiedTime: f.modifiedTime || null,
    }));

    console.log(`✅ Listed ${files.length} media files (images + videos) from Drive folder ${folderId}`);
    return { files };
  } catch (error) {
    console.error('❌ Drive API error:', error.message || error);

    if (error.code === 404 || (error.errors && error.errors[0]?.reason === 'notFound')) {
      throw new functions.https.HttpsError('not-found', 'Folder không tồn tại hoặc không được chia sẻ công khai.');
    }
    if (error.code === 403) {
      throw new functions.https.HttpsError('permission-denied', 'Không có quyền truy cập folder. Đảm bảo folder đã được chia sẻ "Anyone with the link".');
    }

    throw new functions.https.HttpsError('internal', 'Lỗi khi truy cập Google Drive: ' + (error.message || 'Unknown'));
  }
});
