import { useEffect, useState } from 'react'
import { Plus, UserX, Pencil, Shield } from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, Modal } from '../../components/ui'
import { ROLE_LABELS } from '../../types'
import type { User, UserRole } from '../../types'
import { formatDate } from '../../lib/utils'

type Officer = User & { createdAt?: string }

type CreateForm = {
  name: string
  username: string
  department: string
  badgeNumber: string
  password: string
  role: UserRole
}

type EditForm = {
  name: string
  department: string
  badgeNumber: string
  role: UserRole
}

const emptyForm: CreateForm = {
  name: '', username: '', department: '', badgeNumber: '', password: '', role: 'police_officer',
}

export default function AdminOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateForm>(emptyForm)
  const [editForm, setEditForm] = useState<EditForm>({ name: '', department: '', badgeNumber: '', role: 'police_officer' })
  const [formError, setFormError] = useState('')

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('evidence-portal-token') ?? ''}`,
  })

  const fromApi = (officer: Officer): Officer => ({
    ...officer,
    assignedCases: officer.assignedCases ?? 0,
    evidenceUploaded: officer.evidenceUploaded ?? 0,
  })

  const loadOfficers = () => {
    fetch('/api/admin/officers', { headers: headers() })
      .then(async (response) => {
        const body = await response.json() as { officers?: Officer[] }
        if (response.ok && body.officers) setOfficers(body.officers.map(fromApi))
      })
      .catch(() => undefined)
  }

  useEffect(() => { loadOfficers() }, [])

  const filtered = officers.filter((officer) =>
    officer.name.toLowerCase().includes(search.toLowerCase()) ||
    officer.username.toLowerCase().includes(search.toLowerCase()) ||
    officer.department.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = async (id: string) => {
    const current = officers.find((officer) => officer.id === id)
    if (!current) return
    const response = await fetch(`/api/admin/officers/${id}/status`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ isActive: !current.isActive }),
    })
    if (response.ok) {
      setOfficers(officers.map((officer) =>
        officer.id === id ? { ...officer, isActive: !officer.isActive } : officer
      ))
    }
  }

  const handleCreate = async () => {
    setFormError('')
    const response = await fetch('/api/admin/officers', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(form),
    })
    const body = await response.json() as { officer?: Officer; message?: string }
    if (!response.ok || !body.officer) {
      return setFormError(body.message ?? 'Unable to create officer account.')
    }
    setOfficers([fromApi(body.officer), ...officers])
    setShowCreate(false)
    setForm(emptyForm)
  }

  const openEdit = (officer: Officer) => {
    setEditingId(officer.id)
    setEditForm({
      name: officer.name,
      department: officer.department,
      badgeNumber: officer.badgeNumber,
      role: officer.role,
    })
    setFormError('')
    setShowEdit(true)
  }

  const handleEdit = async () => {
    if (!editingId) return
    setFormError('')
    const response = await fetch(`/api/admin/officers/${editingId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify(editForm),
    })
    const body = await response.json() as { officer?: Officer; message?: string }
    if (!response.ok || !body.officer) {
      return setFormError(body.message ?? 'Unable to update officer.')
    }
    setOfficers(officers.map((officer) =>
      officer.id === editingId ? fromApi(body.officer!) : officer
    ))
    setShowEdit(false)
    setEditingId(null)
  }

  const officerRoles: UserRole[] = ['police_officer', 'investigating_officer', 'forensic_expert']

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Officer Management"
        subtitle="Create and manage authorised officer accounts — no public registration"
        actions={
          <button
            onClick={() => { setFormError(''); setShowCreate(true) }}
            className="cyber-btn-primary"
          >
            <Plus className="w-4 h-4" /> Create Officer
          </button>
        }
      />

      <GlassCard className="!p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search officers by name, ID, or department..." />
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Officer Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Account Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((officer) => (
                <tr key={officer.id}>
                  <td className="text-xs font-mono">{officer.username}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center text-xs font-bold text-white">
                        {officer.name.charAt(0)}
                      </div>
                      <p className="text-sm text-navy-900">{officer.name}</p>
                    </div>
                  </td>
                  <td className="text-xs max-w-[180px] truncate">{officer.department}</td>
                  <td>
                    <StatusBadge
                      status={officer.isActive ? 'Active' : 'Inactive'}
                      variant={officer.isActive ? 'success' : 'danger'}
                    />
                  </td>
                  <td className="text-xs text-navy-600 whitespace-nowrap">
                    {officer.lastLogin ? formatDate(officer.lastLogin) : 'Never'}
                  </td>
                  <td className="text-xs text-navy-600 whitespace-nowrap">
                    {officer.createdAt ? formatDate(officer.createdAt) : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(officer)}
                        className="p-1.5 rounded hover:bg-cyber-800 text-navy-700 hover:text-navy-800"
                        title="Edit Officer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(officer.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-navy-700 hover:text-red-400"
                        title={officer.isActive ? 'Deactivate Officer' : 'Activate Officer'}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Officer Account">
        <div className="space-y-4">
          {([
            { label: 'Officer Name', key: 'name', type: 'text' },
            { label: 'Officer ID', key: 'username', type: 'text' },
            { label: 'Department', key: 'department', type: 'text' },
            { label: 'Badge Number', key: 'badgeNumber', type: 'text' },
            { label: 'Temporary Password', key: 'password', type: 'password' },
          ] as const).map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-navy-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                className="cyber-input"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-navy-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
              className="cyber-input"
            >
              {officerRoles.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="cyber-btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="cyber-btn-primary">
              <Shield className="w-4 h-4" /> Create Officer
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Officer">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-navy-700 mb-1">Officer Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              className="cyber-input"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-700 mb-1">Department</label>
            <input
              type="text"
              value={editForm.department}
              onChange={(event) => setEditForm({ ...editForm, department: event.target.value })}
              className="cyber-input"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-700 mb-1">Badge Number</label>
            <input
              type="text"
              value={editForm.badgeNumber}
              onChange={(event) => setEditForm({ ...editForm, badgeNumber: event.target.value })}
              className="cyber-input"
            />
          </div>
          <div>
            <label className="block text-xs text-navy-700 mb-1">Role</label>
            <select
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value as UserRole })}
              className="cyber-input"
            >
              {officerRoles.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role]}</option>
              ))}
            </select>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowEdit(false)} className="cyber-btn-secondary">Cancel</button>
            <button onClick={handleEdit} className="cyber-btn-primary">Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
