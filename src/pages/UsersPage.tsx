import { useEffect, useState } from 'react'
import { Plus, UserX, Key, History, Shield } from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, Modal } from '../components/ui'
import { ROLE_LABELS } from '../types'
import type { User, UserRole } from '../types'

type CreateForm = {
  name: string; email: string; username: string; role: UserRole
  department: string; badgeNumber: string; password: string
}

const emptyForm: CreateForm = {
  name: '', email: '', username: '', role: 'police_officer', department: '', badgeNumber: '', password: '',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [formError, setFormError] = useState('')

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('evidence-portal-token') ?? ''}`,
  })
  const fromApi = (user: User): User => ({ ...user, assignedCases: 0, evidenceUploaded: 0 })

  useEffect(() => {
    fetch('/api/users', { headers: headers() })
      .then(async (response) => {
        const body = await response.json() as { users?: User[] }
        if (response.ok && body.users) setUsers(body.users.map(fromApi))
      })
      .catch(() => undefined)
  }, [])

  const filtered = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.username.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = async (id: string) => {
    const current = users.find((user) => user.id === id)
    if (!current) return
    const response = await fetch(`/api/users/${id}/status`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ isActive: !current.isActive }),
    })
    if (response.ok) setUsers(users.map((user) => user.id === id ? { ...user, isActive: !user.isActive } : user))
  }

  const handleCreate = async () => {
    setFormError('')
    const response = await fetch('/api/users', { method: 'POST', headers: headers(), body: JSON.stringify(form) })
    const body = await response.json() as { user?: User; message?: string }
    if (!response.ok || !body.user) return setFormError(body.message ?? 'Unable to create the authorised account.')
    setUsers([fromApi(body.user), ...users])
    setShowCreate(false)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="User Management" subtitle="Create trusted officer accounts and control their access" actions={
        <button onClick={() => { setFormError(''); setShowCreate(true) }} className="cyber-btn-primary"><Plus className="w-4 h-4" /> Create User</button>
      } />

      <GlassCard className="!p-4"><SearchInput value={search} onChange={setSearch} placeholder="Search authorised users..." /></GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto"><table className="data-table"><thead><tr>
          <th>User</th><th>Username</th><th>Role</th><th>Department</th><th>Badge</th><th>Cases</th><th>Evidence</th><th>Status</th><th>Actions</th>
        </tr></thead><tbody>{filtered.map((user) => <tr key={user.id}>
          <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-xs font-bold text-white">{user.name.charAt(0)}</div><div><p className="text-sm text-navy-900">{user.name}</p><p className="text-[10px] text-navy-600">{user.email}</p></div></div></td>
          <td className="text-xs font-mono">{user.username}</td><td><StatusBadge status={ROLE_LABELS[user.role]} variant="info" /></td><td className="text-xs max-w-[150px] truncate">{user.department}</td><td className="text-xs font-mono">{user.badgeNumber}</td><td className="text-center">{user.assignedCases}</td><td className="text-center">{user.evidenceUploaded}</td><td><StatusBadge status={user.isActive ? 'Active' : 'Inactive'} variant={user.isActive ? 'success' : 'danger'} /></td>
          <td><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-cyber-800 text-navy-700 hover:text-navy-800" title="Passwords are set only when an administrator creates an account"><Key className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-cyber-800 text-navy-700 hover:text-navy-800" title="Login History"><History className="w-4 h-4" /></button><button onClick={() => toggleActive(user.id)} className="p-1.5 rounded hover:bg-red-500/10 text-navy-700 hover:text-red-400" title={user.isActive ? 'Deactivate' : 'Activate'}><UserX className="w-4 h-4" /></button></div></td>
        </tr>)}</tbody></table></div>
      </GlassCard>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Trusted Officer Account">
        <div className="space-y-4">
          {([
            { label: 'Full Name', key: 'name', type: 'text' }, { label: 'Official Email', key: 'email', type: 'email' },
            { label: 'Force ID / Username', key: 'username', type: 'text' }, { label: 'Department', key: 'department', type: 'text' },
            { label: 'Badge Number', key: 'badgeNumber', type: 'text' }, { label: 'Officer Password (share privately)', key: 'password', type: 'password' },
          ] as const).map((field) => <div key={field.key}><label className="block text-xs text-navy-700 mb-1">{field.label}</label><input type={field.type} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} className="cyber-input" /></div>)}
          <div><label className="block text-xs text-navy-700 mb-1">Role</label><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })} className="cyber-input">{Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3"><button onClick={() => setShowCreate(false)} className="cyber-btn-secondary">Cancel</button><button onClick={handleCreate} className="cyber-btn-primary"><Shield className="w-4 h-4" /> Create User</button></div>
        </div>
      </Modal>
    </div>
  )
}
