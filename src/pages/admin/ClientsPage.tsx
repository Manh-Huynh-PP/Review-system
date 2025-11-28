import { useEffect, useState, useMemo } from 'react'
import { useClientStore } from '@/stores/clients'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientDialog } from '@/components/clients/ClientDialog'
import { ClientCard } from '@/components/clients/ClientCard'
import { Search, UserPlus } from 'lucide-react'

export default function ClientsPage() {
  const { clients, subscribeToClients } = useClientStore()
  const user = useAuthStore(s => s.user)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user?.email) {
      subscribeToClients(user.email)
    }
  }, [user?.email, subscribeToClients])

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(c => {
      const matchName = c.name.toLowerCase().includes(query)
      const matchEmail = c.email?.toLowerCase().includes(query)
      const matchCompany = c.company?.toLowerCase().includes(query)
      const matchPhone = c.phone?.toLowerCase().includes(query)
      return matchName || matchEmail || matchCompany || matchPhone
    })
  }, [clients, searchQuery])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Khách hàng</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Thêm khách hàng
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên, email, công ty, số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map(client => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>

      {filteredClients.length === 0 && clients.length > 0 && (
        <p className="text-muted-foreground text-center py-12">
          Không tìm thấy khách hàng phù hợp
        </p>
      )}

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Chưa có khách hàng nào. Hãy thêm khách hàng mới.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Thêm khách hàng đầu tiên
          </Button>
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
