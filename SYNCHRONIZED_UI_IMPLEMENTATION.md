# Đồng Bộ Hóa UI Giữa Admin và Review Pages

## Tổng Quan
Đã hoàn thành việc đồng bộ hóa thiết kế file list giữa trang admin (`/app/projects/:id`) và trang review công khai (`/review/:id`). Bây giờ cả hai trang sử dụng **cùng một bộ component được chia sẻ**, đảm bảo mọi thay đổi UI sẽ tự động được áp dụng cho cả hai trang.

## Kiến Trúc Mới

### Shared Components (src/components/shared/)

#### 1. FileCardShared.tsx
**Mục đích:** Component card hiển thị file trong grid layout

**Props:**
```typescript
interface FileCardSharedProps {
  file: File
  resolvedUrl?: string
  commentCount: number
  onClick: () => void
  compact?: boolean
}
```

**Tính năng:**
- Thumbnail preview (image/video/icon fallback)
- Hover overlay với text "Nhấn để xem chi tiết"
- Type badge (Hình ảnh/Video/Mô hình 3D)
- Comment count badge
- Responsive sizing
- Compact mode (optional)

---

#### 2. FileViewDialogShared.tsx
**Mục đích:** Full-screen dialog để xem chi tiết file và comment

**Props:**
```typescript
interface Props {
  file: FileType | null
  projectId: string
  resolvedUrl?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchVersion?: (fileId: string, version: number) => void
  comments: any[]
  currentUserName: string
  onUserNameChange: (name: string) => void
  onAddComment: (userName: string, content: string, timestamp?: number) => Promise<void>
  onResolveToggle?: (commentId: string, isResolved: boolean) => void
  isAdmin?: boolean
}
```

**Tính năng:**
- Split layout: Preview (70vh) bên trái, Comments sidebar bên phải
- Version dropdown selector (nếu có nhiều version)
- Download button
- Comment list với empty state
- Add comment form
- Video timestamp support (click vào timestamp để jump đến thời điểm đó)
- Admin controls (resolve/unresolve) khi `isAdmin=true`
- Responsive layout với proper spacing

**Layout Fixes Included:**
- `gap-0` - Không gap giữa các phần
- `shrink-0` - Fixed header và form không bị shrink
- `min-h-0` - Flex children có thể scroll
- `pr-8` - Padding right cho header để tránh overlap với close button
- `h-[calc(95vh-100px)]` - Height calculation cho comments area

---

## Cách Sử Dụng

### Admin Page (src/components/files/FilesList.tsx)

```typescript
import { FileCardShared } from '@/components/shared/FileCardShared'
import { FileViewDialogShared } from '@/components/shared/FileViewDialogShared'

// Trong render:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {files.map(file => (
    <FileCardShared
      key={file.id}
      file={file}
      resolvedUrl={effectiveUrl}
      commentCount={commentCount}
      onClick={() => handleFileClick(file)}
    />
  ))}
</div>

{selectedFile && (
  <FileViewDialogShared
    file={selectedFile}
    projectId={projectId}
    resolvedUrl={resolvedUrl}
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    onSwitchVersion={handleSwitchVersion}
    comments={comments}
    currentUserName={currentUserName}
    onUserNameChange={handleUserNameChange}
    onAddComment={handleAddComment}
    onResolveToggle={user ? handleResolveToggle : undefined}
    isAdmin={!!user}
  />
)}
```

### Review Page (src/pages/ReviewPage.tsx)

```typescript
import { FileCardShared } from '@/components/shared/FileCardShared'
import { FileViewDialogShared } from '@/components/shared/FileViewDialogShared'

// Trong render (tương tự admin nhưng isAdmin=false):
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {projectFiles.map(file => (
    <FileCardShared
      key={file.id}
      file={file}
      resolvedUrl={effectiveUrl}
      commentCount={commentCount}
      onClick={() => handleFileClick(file)}
    />
  ))}
</div>

{selectedFile && (
  <FileViewDialogShared
    file={selectedFile}
    projectId={projectId!}
    resolvedUrl={resolvedUrl}
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    comments={comments}
    currentUserName={currentUserName}
    onUserNameChange={handleUserNameChange}
    onAddComment={handleAddComment}
    isAdmin={false}
  />
)}
```

---

## Lợi Ích

### ✅ Single Source of Truth
Mọi thay đổi UI chỉ cần sửa ở `src/components/shared/`, tự động áp dụng cho cả admin và review pages.

### ✅ Consistency
Đảm bảo UX nhất quán giữa admin và public review.

### ✅ Maintainability
Giảm code duplication, dễ maintain và test.

### ✅ Flexibility
Shared components được parameterized đầy đủ:
- `isAdmin` flag để bật/tắt admin features
- Optional callbacks (`onSwitchVersion`, `onResolveToggle`)
- Customizable display (`compact` mode)

---

## Files Thay Đổi

### New Files
- ✨ `src/components/shared/FileCardShared.tsx` (122 lines)
- ✨ `src/components/shared/FileViewDialogShared.tsx` (270 lines)

### Modified Files
- 🔄 `src/components/files/FilesList.tsx` - Updated to use shared components
- 🔄 `src/pages/ReviewPage.tsx` - Refactored from inline UI to grid layout with shared components
- 🔄 `src/components/files/FileViewDialog.tsx` - Fixed AddComment props (removed videoRef, added currentTime tracking)

### Deprecated (Still Exists But Not Used by FilesList/ReviewPage)
- `src/components/files/FileCard.tsx` - Could be deleted or kept as fallback
- Old inline UI code in ReviewPage (replaced)

---

## Testing Checklist

### Admin Page (/app/projects/:id)
- [ ] Files display in grid layout
- [ ] Click file card opens dialog
- [ ] Dialog shows preview correctly (image/video/model)
- [ ] Version selector works (if multiple versions)
- [ ] Download button works
- [ ] Comments display with timestamp click (for videos)
- [ ] Add comment form works
- [ ] Resolve/unresolve toggle works (admin only)

### Review Page (/review/:id)
- [ ] Files display in grid layout (matching admin)
- [ ] Click file card opens dialog
- [ ] Dialog shows preview correctly
- [ ] No version selector shown
- [ ] Download button works
- [ ] Comments display with timestamp click (for videos)
- [ ] Add comment form works
- [ ] User name prompt appears first time
- [ ] No resolve toggle (non-admin)

### Visual Consistency
- [ ] Grid layout identical on both pages
- [ ] Card design identical
- [ ] Dialog layout identical
- [ ] Responsive breakpoints work on both pages

---

## Ghi Chú Kỹ Thuật

### Video Timestamp Support
- FileViewDialogShared tracks video `currentTime` via `onTimeUpdate` event
- Passes to AddComment as `currentTimestamp`
- CommentsList renders timestamps as clickable links
- Clicking timestamp seeks video and plays

### URL Resolution
Both pages use same `ensureDownloadUrl` logic to fix Firebase Storage URLs that use `firebasestorage.app` domain (legacy issue).

### Comment State
- Admin: Uses `toggleResolve` from useCommentStore
- Review: No resolve functionality (isAdmin=false)

### Empty States
Shared components include proper empty states:
- FileCardShared: N/A (handled by parent)
- FileViewDialogShared: "Chưa có bình luận nào" when no comments

---

## Dev Server
Application running at: http://localhost:5174
