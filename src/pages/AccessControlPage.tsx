import { useState } from 'react'
import { Shield, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge, Modal } from '../components/ui'
import { accessRequests as initialRequests } from '../data/mockData'
import { ROLE_LABELS } from '../types'
import type { AccessRequest, AccessRequestStatus } from '../types'
import { formatDate } from '../lib/utils'

export default function AccessControlPage() {
  const [requests, setRequests] = useState(initialRequests)
  const [reviewModal, setReviewModal] = useState<{ request: AccessRequest; action: 'approve' | 'reject' } | null>(null)
  const [reason, setReason] = useState('')

  const handleReview = () => {
    if (!reviewModal) return
    setRequests(requests.map((r) =>
      r.id === reviewModal.request.id
        ? {
            ...r,
            status: (reviewModal.action === 'approve' ? 'approved' : 'rejected') as AccessRequestStatus,
            reviewedBy: 'Rajesh Kumar',
            reviewedAt: new Date().toISOString(),
            reviewReason: reason,
          }
        : r
    ))
    setReviewModal(null)
    setReason('')
  }

  const statusVariant = (s: AccessRequestStatus) => {
    const map = { pending: 'warning' as const, approved: 'success' as const, rejected: 'danger' as const }
    return map[s]
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Smart Access Control"
        subtitle="Role-based access control with approval workflows for sensitive evidence"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: requests.filter((r) => r.status === 'pending').length, icon: Clock, color: 'text-amber-400' },
          { label: 'Approved', value: requests.filter((r) => r.status === 'approved').length, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Rejected', value: requests.filter((r) => r.status === 'rejected').length, icon: XCircle, color: 'text-red-400' },
        ].map((stat) => (
          <GlassCard key={stat.label} className="flex items-center gap-4">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-xs text-navy-700">{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <h3 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-navy-800" /> Role Permissions Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Upload</th>
                <th>View</th>
                <th>Download</th>
                <th>Analyze</th>
                <th>Verify</th>
                <th>Manage Users</th>
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
                  <td className="font-medium text-navy-900">{row.role}</td>
                  {row.perms.map((p, i) => (
                    <td key={i} className="text-center">
                      {p ? <CheckCircle className="w-4 h-4 text-emerald-400 inline" /> : <XCircle className="w-4 h-4 text-navy-700 inline" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="p-4 border-b border-glass-border">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-navy-800" /> Access Requests
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Role</th>
                <th>Evidence</th>
                <th>Case</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="text-navy-900">{req.requester}</td>
                  <td className="text-xs">{ROLE_LABELS[req.requesterRole]}</td>
                  <td className="text-xs font-mono text-navy-800">{req.evidenceId}</td>
                  <td className="text-xs font-mono">{req.caseId}</td>
                  <td className="text-xs text-navy-700 max-w-[150px] truncate">{req.reason}</td>
                  <td><StatusBadge status={req.status} variant={statusVariant(req.status)} /></td>
                  <td className="text-xs text-navy-600">{formatDate(req.requestedAt)}</td>
                  <td>
                    {req.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setReviewModal({ request: req, action: 'approve' })}
                          className="cyber-btn-success text-xs py-1 px-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setReviewModal({ request: req, action: 'reject' })}
                          className="cyber-btn-danger text-xs py-1 px-2"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {req.reviewedBy && (
                      <p className="text-[10px] text-navy-600">By {req.reviewedBy}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal
        isOpen={!!reviewModal}
        onClose={() => { setReviewModal(null); setReason('') }}
        title={reviewModal?.action === 'approve' ? 'Approve Access Request' : 'Reject Access Request'}
      >
        {reviewModal && (
          <div className="space-y-4">
            <p className="text-sm text-navy-800">
              {reviewModal.request.requester} requesting access to {reviewModal.request.evidenceId}
            </p>
            <div>
              <label className="block text-xs text-navy-700 mb-1">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="cyber-input min-h-[80px] resize-none"
                placeholder="Enter review reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReviewModal(null)} className="cyber-btn-secondary">Cancel</button>
              <button
                onClick={handleReview}
                className={reviewModal.action === 'approve' ? 'cyber-btn-success' : 'cyber-btn-danger'}
              >
                {reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
