import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, FileCheck, CheckCircle2, XCircle, ShieldCheck, Activity, ArrowRight, Clock, Eye } from 'lucide-react'
import { PageHeader, StatCard, GlassCard } from '../../components/ui'
import { formatDate } from '../../lib/utils'
import { apiFetch } from '../../lib/api'
import type { AccessRequest, AccessRecord } from '../../types'

export default function AdminDashboardPage() {
  const [officerCount, setOfficerCount] = useState(0)
  const [activeOfficers, setActiveOfficers] = useState(0)
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [recentRecords, setRecentRecords] = useState<AccessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadGovernanceData() {
      setLoading(true)
      try {
        const [officersRes, requestsRes, recordsRes] = await Promise.all([
          apiFetch('/api/admin/officers').catch(() => null),
          apiFetch('/api/access-requests').catch(() => null),
          apiFetch('/api/access-records').catch(() => null),
        ])

        if (officersRes && officersRes.ok) {
          const body = (await officersRes.json()) as { officers?: any[] }
          if (body.officers) {
            setOfficerCount(body.officers.length)
            setActiveOfficers(body.officers.filter((o: any) => o.isActive).length)
          }
        }

        if (requestsRes && requestsRes.ok) {
          const body = (await requestsRes.json()) as { requests?: AccessRequest[] }
          if (body.requests) {
            setRequests(body.requests)
          }
        }

        if (recordsRes && recordsRes.ok) {
          const body = (await recordsRes.json()) as { records?: AccessRecord[] }
          if (body.records) {
            setRecentRecords(body.records.slice(0, 6))
          }
        }
      } finally {
        setLoading(false)
      }
    }

    loadGovernanceData()
  }, [])

  const pendingRequests = requests.filter((r) => r.status === 'PENDING')
  const approvedRequests = requests.filter((r) => r.status === 'APPROVED')
  const rejectedRequests = requests.filter((r) => r.status === 'REJECTED')

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Access Governance Dashboard"
        subtitle="Administrator Overview — Review officer access activity, manage pending access requests, and oversee system permissions"
      />

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Pending Requests"
          value={pendingRequests.length}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          label="Active Officers"
          value={activeOfficers}
          icon={<Users className="w-5 h-5 text-navy-800" />}
          color="cyan"
        />
        <StatCard
          label="Approved Requests"
          value={approvedRequests.length}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          label="Rejected Requests"
          value={rejectedRequests.length}
          icon={<XCircle className="w-5 h-5 text-red-600" />}
          color="red"
        />
        <StatCard
          label="Access Events"
          value={recentRecords.length}
          icon={<ShieldCheck className="w-5 h-5 text-violet-600" />}
          color="purple"
        />
      </div>

      {/* RECENT REQUESTS SECTION */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-navy-800" /> Recent Officer Access Requests
            </h3>
            <p className="text-xs text-navy-600">Pending and recent authorization requests from active officers</p>
          </div>
          <Link to="/admin/requests" className="cyber-btn-secondary text-xs flex items-center gap-1">
            View All Requests <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <p className="text-xs text-navy-600 py-6 text-center">No officer access requests found in PostgreSQL database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-50 text-navy-900 font-bold border-b border-navy-100">
                <tr>
                  <th className="p-3">Officer</th>
                  <th className="p-3">Request Type</th>
                  <th className="p-3">Requested Resource</th>
                  <th className="p-3">Requested Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100 font-sans">
                {requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-navy-900">{req.officerName}</div>
                      <div className="text-[10px] text-navy-600 font-mono">{req.badgeNumber}</div>
                    </td>
                    <td className="p-3 font-semibold text-navy-800">
                      {req.requestType.replace('_', ' ')}
                    </td>
                    <td className="p-3 font-mono text-navy-900">
                      {req.resourceName || req.resourceId}
                    </td>
                    <td className="p-3 font-mono text-navy-600">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="p-3">
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
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate('/admin/requests')}
                        className="cyber-btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Review Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* RECENT ACCESS EVENTS */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-navy-800" /> Recent System Access Ledger
            </h3>
            <p className="text-xs text-navy-600">Live audit stream of officer accesses, downloads, and verifications</p>
          </div>
          <Link to="/admin/access-records" className="cyber-btn-secondary text-xs flex items-center gap-1">
            Access Ledger <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentRecords.length === 0 ? (
          <p className="text-xs text-navy-600 py-6 text-center">No recent access records logged.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentRecords.map((rec) => (
              <div key={rec.id} className="p-3 rounded-xl bg-navy-50/60 border border-navy-100 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-navy-900">{rec.officer}</span>
                  <span className="text-[10px] text-navy-500 font-mono">{formatDate(rec.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-navy-700 font-semibold">{rec.action}</span>
                  <span className="font-mono text-navy-800">{rec.accessType}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-navy-600 pt-1 border-t border-navy-100">
                  <span>IP: {rec.ipAddress}</span>
                  <span className="font-semibold text-emerald-700">{rec.result}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
