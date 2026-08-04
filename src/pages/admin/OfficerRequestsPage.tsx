import { useState, useEffect } from 'react'
import {
  FileCheck, CheckCircle2, XCircle, Clock, Shield, Search, Filter,
  RefreshCw, Eye, AlertCircle, ArrowUpRight, User, Building, BadgeCheck
} from 'lucide-react'
import { PageHeader, GlassCard, Modal, StatusBadge } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { apiFetch } from '../../lib/api'
import type { AccessRequest } from '../../types'

export default function OfficerRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/access-requests')
      const data = (await res.json()) as { requests?: AccessRequest[] }
      setRequests(data.requests || [])
    } catch (err: any) {
      console.error('Failed to fetch access requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (id: string) => {
    setSubmitting(true)
    setActionError(null)
    try {
      await apiFetch(`/api/access-requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ decisionReason }),
      })
      setSelectedRequest(null)
      setDecisionReason('')
      await fetchRequests()
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (id: string) => {
    setSubmitting(true)
    setActionError(null)
    try {
      await apiFetch(`/api/access-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ decisionReason }),
      })
      setSelectedRequest(null)
      setDecisionReason('')
      await fetchRequests()
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject request.')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredRequests = requests.filter((r) => {
    const matchesTab = activeTab === 'ALL' || r.status === activeTab
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      r.officerName.toLowerCase().includes(q) ||
      r.badgeNumber.toLowerCase().includes(q) ||
      (r.resourceName && r.resourceName.toLowerCase().includes(q)) ||
      r.requestType.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'CASE_ACCESS':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">CASE ACCESS</span>
      case 'EVIDENCE_ACCESS':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-800">EVIDENCE ACCESS</span>
      case 'DOWNLOAD_PERMISSION':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">DOWNLOAD PERMISSION</span>
      case 'REPORT_ACCESS':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-100 text-teal-800">REPORT ACCESS</span>
      case 'ACCOUNT_ACTIVATION':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">ACCOUNT ACTIVATION</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-navy-100 text-navy-800">{type}</span>
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Officer Access Requests"
        subtitle="Access Governance & Permission Management — Review real officer authorization requests from PostgreSQL"
        actions={
          <button
            onClick={fetchRequests}
            className="cyber-btn-secondary text-xs flex items-center gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Requests
          </button>
        }
      />

      {/* TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-white rounded-xl border border-navy-100 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'PENDING' ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'APPROVED' ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approved ({approvedCount})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'REJECTED' ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-500" /> Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ALL' ? 'bg-navy-900 text-white shadow' : 'text-navy-600 hover:bg-navy-50'
            }`}
          >
            All ({requests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search officer, badge, resource..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white"
          />
        </div>
      </div>

      {/* REQUESTS LIST */}
      <GlassCard className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-navy-600 font-semibold space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-navy-800" />
            <p className="text-xs">Loading officer access requests from PostgreSQL...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCheck className="w-12 h-12 text-navy-300 mx-auto" />
            <h3 className="text-sm font-bold text-navy-900">No Access Requests Found</h3>
            <p className="text-xs text-navy-600 max-w-sm mx-auto">
              {activeTab === 'PENDING'
                ? 'There are currently no pending officer access requests awaiting administrator review.'
                : 'No access requests matching the selected filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy-100">
            {filteredRequests.map((req) => (
              <div key={req.id} className="p-4 sm:p-5 hover:bg-navy-50/50 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                      {req.officerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-navy-900">{req.officerName}</h4>
                        <span className="text-[11px] font-mono font-semibold text-navy-600 bg-navy-100 px-1.5 py-0.5 rounded">
                          {req.badgeNumber}
                        </span>
                        {getRequestTypeBadge(req.requestType)}
                      </div>
                      <p className="text-xs text-navy-600">
                        {req.rank || 'Officer'} • {req.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                        req.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {req.status}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedRequest(req)
                        setDecisionReason('')
                        setActionError(null)
                      }}
                      className="cyber-btn-secondary text-xs flex items-center gap-1 py-1.5 px-3"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                </div>

                {/* Resource & Reason preview */}
                <div className="bg-navy-50/60 p-3 rounded-lg border border-navy-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy-900">
                      Requested Resource: <span className="font-mono text-navy-800">{req.resourceName || req.resourceId}</span>
                    </span>
                    <span className="text-[11px] text-navy-500 font-mono">{formatDate(req.createdAt)}</span>
                  </div>
                  <p className="text-navy-700 italic">"{req.reason}"</p>

                  {req.reviewedBy && (
                    <div className="pt-2 border-t border-navy-200 text-[11px] text-navy-600 flex items-center justify-between">
                      <span>Reviewed by: <strong>{req.reviewedBy}</strong></span>
                      <span>Decision: <strong className="text-navy-900">{req.decisionReason || 'N/A'}</strong></span>
                    </div>
                  )}
                </div>

                {/* Direct Actions for Pending */}
                {req.status === 'PENDING' && (
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Request
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={submitting}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1 shadow transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Grant Access
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* DETAILS & DECISION MODAL */}
      {selectedRequest && (
        <Modal
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          title="Access Governance Request Review"
        >
          <div className="space-y-5 text-xs text-navy-900">
            {actionError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Officer Meta Card */}
            <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 space-y-2">
              <h4 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-navy-700" /> Officer Profile
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><span className="text-navy-600">Name:</span> <strong>{selectedRequest.officerName}</strong></div>
                <div><span className="text-navy-600">Badge ID:</span> <strong className="font-mono">{selectedRequest.badgeNumber}</strong></div>
                <div><span className="text-navy-600">Rank:</span> <strong>{selectedRequest.rank || 'Officer'}</strong></div>
                <div><span className="text-navy-600">Department:</span> <strong>{selectedRequest.department}</strong></div>
              </div>
            </div>

            {/* Request Payload */}
            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-2">
              <h4 className="font-bold text-navy-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-700" /> Requested Authorization
              </h4>
              <div className="space-y-1">
                <p><span className="text-navy-600">Request Type:</span> <strong className="font-mono text-sky-900">{selectedRequest.requestType}</strong></p>
                <p><span className="text-navy-600">Target Resource:</span> <strong className="font-mono text-navy-900">{selectedRequest.resourceName || selectedRequest.resourceId}</strong></p>
                <p><span className="text-navy-600">Request Date:</span> <strong>{formatDate(selectedRequest.createdAt)}</strong></p>
              </div>
            </div>

            {/* Officer Justification */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1.5">
              <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">
                Officer Justification / Reason
              </h4>
              <p className="whitespace-pre-wrap leading-relaxed text-navy-900 font-medium">
                {selectedRequest.reason}
              </p>
            </div>

            {/* Decision Reason Input for Pending */}
            {selectedRequest.status === 'PENDING' ? (
              <div className="space-y-1.5 pt-2">
                <label className="block font-bold text-navy-900 text-xs">
                  Decision Notes / Reason (Optional)
                </label>
                <textarea
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Add administrative notes regarding this approval or rejection..."
                  className="w-full p-2.5 text-xs rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-navy-800 bg-white"
                />
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-navy-100 text-navy-800 space-y-1">
                <p><strong>Review Status:</strong> {selectedRequest.status}</p>
                <p><strong>Reviewed By:</strong> {selectedRequest.reviewedBy || 'Administrator'}</p>
                <p><strong>Review Decision Note:</strong> {selectedRequest.decisionReason || 'None'}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-navy-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="cyber-btn-secondary text-xs"
              >
                Close
              </button>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleReject(selectedRequest.id)}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Reject Request
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleApprove(selectedRequest.id)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs flex items-center gap-1.5 shadow transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Grant Access
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
