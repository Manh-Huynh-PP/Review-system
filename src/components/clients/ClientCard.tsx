import { useState } from 'react'
import type { Client } from '@/types'
import { useClientStore } from '@/stores/clients'
import { Button } from '@/components/ui/button'
import { ClientDialog } from './ClientDialog'
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Pencil, 
  Trash2,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  client: Client
}

export function ClientCard({ client }: Props) {
  const { deleteClient } = useClientStore()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteClient(client.id)
      setDeleteOpen(false)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              {client.company && (
                <p className="text-sm text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeleteOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {client.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`mailto:${client.email}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {client.email}
              </a>
            </div>
          )}

          {client.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`tel:${client.phone}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {client.phone}
              </a>
            </div>
          )}

          {client.notes && (
            <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground text-xs line-clamp-2">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <ClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khách hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa khách hàng <strong>{client.name}</strong>? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
