import { useState, useEffect } from 'react'
import { useProjectStore } from '@/stores/projects'
import { useClientStore } from '@/stores/clients'
import { useAuthStore } from '@/stores/auth'
import { PRESET_COLORS } from '@/constants/colors'
import type { Project, ArchiveLink } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, X, UserPlus, Link2, Mail, Plus, Trash2 } from 'lucide-react'
import { Timestamp } from 'firebase/firestore'
import { ClientDialog } from '@/components/clients/ClientDialog'

interface Props {
  project: Project
  triggerAsMenuItem?: boolean
}

export function ProjectEditDialog({ project, triggerAsMenuItem = false }: Props) {
  const [open, setOpen] = useState(false)
  const [clientDialogOpen, setClientDialogOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [clientId, setClientId] = useState(project.clientId || '')
  const [deadline, setDeadline] = useState(
    project.deadline ? new Date(project.deadline.toMillis()).toISOString().split('T')[0] : ''
  )
  const [tags, setTags] = useState(project.tags?.join(', ') || '')
  const [archiveLinks, setArchiveLinks] = useState<ArchiveLink[]>(
    project.archiveLinks || (project.archiveUrl ? [{ url: project.archiveUrl, title: project.archiveTitle }] : [])
  )
  const [notificationEmails, setNotificationEmails] = useState(project.notificationEmails?.join(', ') || '')
  const [colorLabels, setColorLabels] = useState<Record<string, string>>(project.colorLabels || {})

  const { updateProject, loading } = useProjectStore()
  const { clients, subscribeToClients } = useClientStore()
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    if (user?.email && open) {
      subscribeToClients(user.email)
    }
  }, [user?.email, open, subscribeToClients])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const selectedClient = clientId && clientId !== 'none' ? clients.find(c => c.id === clientId) : null

      const updateData: Partial<Project> = {
        name: name.trim(),
        description: description.trim() || undefined,
        clientId: selectedClient ? clientId : undefined,
        clientName: selectedClient?.name || undefined,
        clientEmail: selectedClient?.email || undefined,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        archiveLinks: archiveLinks.filter(l => l.url.trim()),
        notificationEmails: notificationEmails.trim()
          ? notificationEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
          : undefined,
        colorLabels
      }

      await updateProject(project.id, updateData)
      setOpen(false)
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {triggerAsMenuItem ? (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setOpen(true)
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </DropdownMenuItem>
          ) : (
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa dự án</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dự án *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên dự án"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả <span className="text-xs text-muted-foreground">(Tùy chọn)</span></Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết về dự án..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Khách hàng <span className="text-xs text-muted-foreground">(Tùy chọn)</span></Label>
              <div className="flex gap-2">
                <Select value={clientId || 'none'} onValueChange={setClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{client.name}</span>
                          {client.company && (
                            <span className="text-xs text-muted-foreground">{client.company}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setClientDialogOpen(true)}
                  title="Thêm khách hàng mới"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline <span className="text-xs text-muted-foreground">(Tùy chọn)</span></Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags <span className="text-xs text-muted-foreground">(Tùy chọn)</span></Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="animation, 3d, urgent (phân tách bằng dấu phẩy)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Email nhận thông báo <span className="text-xs text-muted-foreground">(Tùy chọn - mặc định dùng email đăng nhập)</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="notificationEmail"
                  type="text"
                  value={notificationEmails}
                  onChange={(e) => setNotificationEmails(e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nhập nhiều email cách nhau bằng dấu phẩy. Để trống = dùng email mặc định trong cài đặt tài khoản.
              </p>
            </div>

            <div className="space-y-4">
              <Label>Link lưu trữ <span className="text-xs text-muted-foreground">(Hiển thị ở trang view client)</span></Label>
              <div className="space-y-3">
                {archiveLinks.map((link, index) => (
                  <div key={index} className="flex gap-2 items-start bg-muted/30 p-3 rounded-lg border">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...archiveLinks]
                            newLinks[index].url = e.target.value
                            setArchiveLinks(newLinks)
                          }}
                          placeholder="https://drive.google.com/..."
                          className="pl-9 bg-background"
                        />
                      </div>
                      <Input
                        value={link.title}
                        onChange={(e) => {
                          const newLinks = [...archiveLinks]
                          newLinks[index].title = e.target.value
                          setArchiveLinks(newLinks)
                        }}
                        placeholder="Tiêu đề link (VD: Folder hoàn thành...)"
                        className="text-xs h-8 bg-background"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setArchiveLinks(archiveLinks.filter((_, i) => i !== index))
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveLinks([...archiveLinks, { url: '', title: '' }])}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm link lưu trữ
                </Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tùy chỉnh nhãn màu sắc</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Thay đổi tên hiển thị của các màu nền để phân loại file (VD: Màu Emerald &rarr; "Đã duyệt").
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRESET_COLORS.map((color) => {
                  const colorKey = color.value || 'default';
                  return (
                    <div key={colorKey} className="flex items-center gap-3 bg-muted/20 p-2 rounded-md border">
                      <div 
                        className="w-6 h-6 rounded-full border shadow-sm shrink-0" 
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`color-${colorKey}`} className="text-[10px] uppercase text-muted-foreground">
                          {color.label}
                        </Label>
                        <Input
                          id={`color-${colorKey}`}
                          value={colorLabels[colorKey] || ''}
                          onChange={(e) => setColorLabels(prev => ({
                            ...prev,
                            [colorKey]: e.target.value
                          }))}
                          placeholder={color.label}
                          className="h-8 text-sm bg-background"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
      />
    </>
  )
}
