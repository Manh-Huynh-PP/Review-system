import { format } from 'date-fns'
import { useFileStore } from '@/stores/files'
import { FileUploader } from './FileUploader'
import { formatFileSize } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Eye, Download, Clock } from 'lucide-react'

export function FilesList({ projectId }: { projectId: string }) {
  const { files, switchVersion, uploading } = useFileStore()

  return (
    <div className="space-y-4">
      {files.map((f) => {
        const current = f.versions.find(v => v.version === f.currentVersion) || f.versions[0]
        const uploadDate = current?.uploadedAt?.toDate ? current.uploadedAt.toDate() : new Date()
        
        return (
          <div key={f.id} className="rounded-lg border p-4 space-y-3 bg-card">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-medium text-lg">{f.name}</div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      f.type === 'image' ? 'bg-green-500' : 
                      f.type === 'video' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    {f.type === 'image' ? 'Hình ảnh' : f.type === 'video' ? 'Video' : 'Mô hình 3D'}
                  </span>
                  <span>{formatFileSize(current?.metadata?.size || 0)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(uploadDate, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {f.versions.length > 1 && (
                  <>
                    <label className="text-sm font-medium">Phiên bản:</label>
                    <select
                      className="text-sm rounded-md border px-3 py-1 bg-background min-w-20"
                      value={f.currentVersion}
                      title="Chọn phiên bản"
                      onChange={(e) => switchVersion(f.id, Number(e.target.value))}
                    >
                      {f.versions.sort((a,b)=>b.version-a.version).map(v => (
                        <option key={v.version} value={v.version}>
                          v{v.version} {v.version === f.currentVersion ? '(hiện tại)' : ''}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                {current?.url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={current.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Xem
                    </a>
                  </Button>
                )}
                {current?.url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={current.url} download={f.name} className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      Tải
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Preview */}
            {f.type === 'image' && current?.url && (
              <div className="relative group">
                <img 
                  src={current.url} 
                  alt={f.name} 
                  className="max-h-80 w-full object-contain rounded-md border bg-muted cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => window.open(current.url, '_blank')}
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Click để phóng to
                </div>
              </div>
            )}
            {f.type === 'video' && current?.url && (
              <video 
                src={current.url} 
                controls 
                preload="metadata"
                className="max-h-80 w-full rounded-md border bg-black" 
                controlsList="nodownload"
              />
            )}
            {f.type === 'model' && (
              <div className="bg-muted/50 rounded-md p-6 text-center border-2 border-dashed">
                <div className="text-2xl mb-2">🎲</div>
                <div className="text-sm font-medium mb-1">Mô hình 3D GLB</div>
                <div className="text-xs text-muted-foreground">Viewer 3D sẽ được thêm ở bước tiếp theo</div>
              </div>
            )}

            {/* Upload new version */}
            <div className="pt-2 border-t">
              <FileUploader projectId={projectId} existingFileId={f.id} />
            </div>
          </div>
        )
      })}

      {uploading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          <div className="animate-pulse">Đang xử lý file...</div>
        </div>
      )}

      {files.length === 0 && !uploading && (
        <div className="text-center text-muted-foreground text-sm py-8">
          <div className="text-4xl mb-2">📁</div>
          <div>Chưa có file nào trong dự án này</div>
        </div>
      )}
    </div>
  )
}
