import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, UserCheck, Plus, RefreshCw, Send } from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge, Modal } from '../components/ui'
import { ROLE_LABELS } from '../types'
import type { AccessRequest } from '../types'
import { formatDate } from '../lib/utils'
import { apiFetch } from '../lib/api'
import { useAuth } from '../context/AppContext'

export default function AccessControlPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [requestType, setRequestType] = useState('CASE_ACCESS')
  const [resourceType, setResourceType] = useState('case')
  const [resourceId, setResourceId] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/access-requests')
      const data = (await res.json()) as { requests?: AccessRequest[] }
      setRequests(data.requests || [])
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resourceId || !reason) {
      setErrorMsg('Please specify the resource ID and a valid justification.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      await apiFetch('/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestType,
          resourceType,
          resourceId,
          resourceName: resourceName || resourceId,
          reason,
        }),
      })

      setSuccessMsg('Access request submitted successfully to Administrator for governance approval.')
      setResourceId('')
      setResourceName('')
      setReason('')
      setIsRequestModalOpen(false)
      await fetchRequests()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Smart Access Governance"
        subtitle="Role-based access control with real-time approval workflows for digital evidence"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="cyber-btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Request Access / Permission
            </button>
            <button
              onClick={fetchRequests}
              className="cyber-btn-secondary text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        }
      />

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: requests.filter((r) => r.status === 'PENDING').length, icon: Clock, color: 'text-amber-500' },
          { label: 'Approved Requests', value: requests.filter((r) => r.status === 'APPROVED').length, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Rejected Requests', value: requests.filter((r) => r.status === 'REJECTED').length, icon: XCircle, color: 'text-red-500' },
        ].map((stat) => (
          <GlassCard key={stat.label} className="flex items-center gap-4">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-600">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* MATRIX */}
      <GlassCard>
        <h3 className="text-sm font-bold text-navy-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-navy-800" /> System Role Permissions Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Upload Evidence</th>
                <th>View Cases</th>
                <th>Download Files</th>
                <th>Analyze Evidence</th>
                <th>Verify On-Chain</th>
                <th>Governance & Users</th>
              </tr>
            </thead>
            <tbody>
              {[
                { role: 'Police Officer', perms: [true, true, false, false, false, false] },
                { role: 'Investigating Officer', perms: [true, true, true, false, false, false] },
                { role: 'Forensic Expert', perms: [false, true, true, true, false, false] },
                { role: 'Judge', perms: [false, true, false, false, true, false] },
                { role: 'Administrator', perms: [true, true, true, true, true, true] },
              ].map((row) => (
                <tr key={row.role}>
                  <td className="font-bold text-navy-900">{row.role}</td>
                  {row.perms.map((p, i) => (
                    <td key={i} className="text-center">
                      {p ? <CheckCircle className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-navy-300 inline" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* REQUESTS TABLE */}
      <GlassCard className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-navy-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-navy-800" /> Access Request Ledger
          </h3>
          <span className="text-xs text-navy-500 font-mono">Showing {requests.length} Record(s)</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-navy-600">Loading access requests from PostgreSQL...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-xs text-navy-600">No access requests submitted yet. Click "Request Access" to create one.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Officer</th>
                  <th>Request Type</th>
                  <th>Resource</th>
                  <th>Reason Provided</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                  <th>Reviewer Note</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="text-navy-900 font-bold">
                      {req.officerName}
                      <span className="block text-[10px] text-navy-500 font-mono font-normal">{req.badgeNumber}</span>
                    </td>
                    <td className="text-xs font-semibold text-navy-800">{req.requestType.replace('_', ' ')}</td>
                    <td className="text-xs font-mono text-navy-900">{req.resourceName || req.resourceId}</td>
                    <td className="text-xs text-navy-700 max-w-[200px] truncate">{req.reason}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          req.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="text-xs text-navy-600 font-mono">{formatDate(req.createdAt)}</td>
                    <td className="text-xs text-navy-700">
                      {req.reviewedBy ? `${req.reviewedBy} (${req.decisionReason || 'N/A'})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* OFFICER REQUEST MODAL */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Access / Permission Request"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-navy-900 mb-1">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => {
                setRequestType(e.target.value)
                if (e.target.value === 'CASE_ACCESS') setResourceType('case')
                else if (e.target.value === 'EVIDENCE_ACCESS') setResourceType('evidence')
                else if (e.target.value === 'REPORT_ACCESS') setResourceType('report')
              }}
              className="w-full p-2.5 rounded-lg border border-navy-200 text-navy-900 bg-white font-semibold"
            >
              <option value="CASE_ACCESS">CASE ACCESS — Request authorization for specific Case ID</option>
              <option value="EVIDENCE_ACCESS">EVIDENCE ACCESS — Request permission for restricted Evidence payload</option>
              <option value="DOWNLOAD_PERMISSION">DOWNLOAD PERMISSION — High-resolution evidence download authorization</option>
              <option value="REPORT_ACCESS">REPORT ACCESS — Judicial case report export permission</option>
              <option value="ROLE_PERMISSION">ROLE PERMISSION — Elevated officer permission request</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-navy-900 mb-1">Target Resource ID *</label>
              <input
                type="text"
                required
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                placeholder="e.g. TC-2026-0142 or EVD-001"
                className="w-full p-2.5 rounded-lg border border-navy-200 text-navy-900 bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-navy-900 mb-1">Resource Title / Name</label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. Cyber Fraud Case File"
                className="w-full p-2.5 rounded-lg border border-navy-200 text-navy-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy-900 mb-1">Reason for Access Request *</label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. I require access to this case as part of the assigned cybercrime investigation."
              className="w-full p-3 rounded-lg border border-navy-200 text-navy-900 bg-white"
            />
            <p className="text-[11px] text-navy-500 italic mt-1">
              Your request will be submitted to the Administrator Portal and logged in the append-only audit trail.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-navy-100">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="cyber-btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn-primary text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Submit Access Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
