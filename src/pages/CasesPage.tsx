import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Filter, ArrowUpDown, Eye, XCircle, Camera, Fingerprint,
  CheckCircle, AlertCircle, RefreshCw, ScanFace, MapPin, Navigation2,
  Landmark, Building2,
} from 'lucide-react'
import { PageHeader, GlassCard, SearchInput, StatusBadge, Modal } from '../components/ui'
import { cases as initialCases } from '../data/mockData'
import { formatDate } from '../lib/utils'
import type { Case, CasePriority, CaseStatus } from '../types'

const emptyForm = {
  title: '',
  firNumber: '',
  crimeType: '',
  description: '',
  crimeSceneMode: 'address' as 'address' | 'gps' | 'landmark' | 'jurisdiction',
  crimeSceneAddress: '',
  crimeSceneLatitude: '',
  crimeSceneLongitude: '',
  crimeSceneLandmark: '',
  crimeSceneJurisdiction: '',
  dateTime: '',
  officerAssigned: '',
  priority: '' as CasePriority | '',
  status: 'open' as CaseStatus,
}

type FormErrors = Partial<Record<keyof typeof emptyForm | 'livePhoto' | 'biometric', string>>

const priorityVariant = (p: CasePriority) => {
  const map: Record<CasePriority, 'danger' | 'warning' | 'info' | 'default'> = {
    critical: 'danger', high: 'warning', medium: 'info', low: 'default',
  }
  return map[p]
}

const statusVariant = (s: CaseStatus) => {
  const map: Record<CaseStatus, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
    open: 'info', active: 'success', under_review: 'warning', closed: 'default', archived: 'default',
  }
  return map[s]
}

export default function CasesPage() {
  const [cases, setCases] = useState(initialCases)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState(false)

  // Live photo / camera
  const [livePhoto, setLivePhoto] = useState<string | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Biometric
  const [biometricMethod, setBiometricMethod] = useState<'fingerprint' | 'face' | 'iris'>('fingerprint')
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'verified' | 'failed'>('idle')
  const [scanProgress, setScanProgress] = useState(0)

  const filtered = cases
    .filter((c) => statusFilter === 'all' || c.status === statusFilter)
    .filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.caseId.toLowerCase().includes(search.toLowerCase()) ||
      c.firNumber.toLowerCase().includes(search.toLowerCase())
    )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const startCamera = async () => {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch {
      setCameraError('Camera access denied or unavailable. Try again or use a different device.')
      setCameraOn(false)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setLivePhoto(dataUrl)
    stopCamera()
    setErrors((e) => ({ ...e, livePhoto: undefined }))
  }


  const runBiometricScan = () => {
    if (biometricStatus === 'scanning') return
    setBiometricStatus('scanning')
    setScanProgress(0)
    setErrors((e) => ({ ...e, biometric: undefined }))

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setBiometricStatus('verified')
          return 100
        }
        return p + 8
      })
    }, 120)
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {}
    if (!form.title.trim()) next.title = 'Case title is required'
    if (!form.firNumber.trim()) next.firNumber = 'FIR number is required'
    if (!form.crimeType.trim()) next.crimeType = 'Crime type is required'
    if (!form.description.trim()) next.description = 'Description is required'
    if (form.crimeSceneMode === 'address' && !form.crimeSceneAddress.trim()) next.crimeSceneAddress = 'Crime scene address is required'
    if (form.crimeSceneMode === 'gps') {
      if (!form.crimeSceneLatitude.trim()) next.crimeSceneLatitude = 'Latitude is required'
      if (!form.crimeSceneLongitude.trim()) next.crimeSceneLongitude = 'Longitude is required'
      if (form.crimeSceneLatitude && Number.isNaN(Number(form.crimeSceneLatitude))) next.crimeSceneLatitude = 'Latitude must be a number'
      if (form.crimeSceneLongitude && Number.isNaN(Number(form.crimeSceneLongitude))) next.crimeSceneLongitude = 'Longitude must be a number'
    }
    if (form.crimeSceneMode === 'landmark' && !form.crimeSceneLandmark.trim()) next.crimeSceneLandmark = 'Nearby landmark is required'
    if (form.crimeSceneMode === 'jurisdiction' && !form.crimeSceneJurisdiction.trim()) next.crimeSceneJurisdiction = 'Jurisdiction or police station is required'
    if (!form.dateTime) next.dateTime = 'Date & time is required'
    if (!form.officerAssigned.trim()) next.officerAssigned = 'Officer assigned is required'
    if (!form.priority) next.priority = 'Priority is required'
    if (!form.status) next.status = 'Status is required'
    if (!livePhoto) next.livePhoto = 'Live officer photo is mandatory'
    if (biometricStatus !== 'verified') next.biometric = 'Biometric verification is mandatory'
    return next
  }

  const resetCreateForm = () => {
    stopCamera()
    setForm(emptyForm)
    setErrors({})
    setTouched(false)
    setLivePhoto(null)
    setCameraError('')
    setBiometricStatus('idle')
    setScanProgress(0)
    setBiometricMethod('fingerprint')
  }

  const handleCloseModal = () => {
    resetCreateForm()
    setShowCreate(false)
  }

  const handleCreate = () => {
    setTouched(true)
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const newCase: Case = {
      id: `CASE-${String(cases.length + 1).padStart(3, '0')}`,
      caseId: `TC-2026-${String(160 + cases.length).padStart(4, '0')}`,
      title: form.title.trim(),
      firNumber: form.firNumber.trim(),
      crimeType: form.crimeType.trim(),
      description: form.description.trim(),
      location: (() => {
        if (form.crimeSceneMode === 'gps') {
          return `GPS Coordinates: ${form.crimeSceneLatitude.trim()}, ${form.crimeSceneLongitude.trim()}`
        }
        if (form.crimeSceneMode === 'landmark') {
          return `Nearby Landmark: ${form.crimeSceneLandmark.trim()}`
        }
        if (form.crimeSceneMode === 'jurisdiction') {
          return `Jurisdiction: ${form.crimeSceneJurisdiction.trim()}`
        }
        return `Crime Scene Address: ${form.crimeSceneAddress.trim()}`
      })(),
      dateTime: new Date(form.dateTime).toISOString(),
      officerAssigned: form.officerAssigned.trim(),
      officerId: 'USR-001',
      priority: form.priority as CasePriority,
      status: form.status,
      evidenceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      livePhoto: livePhoto || undefined,
      biometricVerified: true,
      biometricMethod,
    }
    setCases([newCase, ...cases])
    handleCloseModal()
  }

  const closeCase = (id: string) => {
    setCases(cases.map((c) =>
      c.id === id ? { ...c, status: 'closed' as CaseStatus, updatedAt: new Date().toISOString() } : c
    ))
  }

  const fieldClass = (key: keyof FormErrors) =>
    `cyber-input ${touched && errors[key] ? '!border-red-400 focus:ring-red-300' : ''}`

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Case Management"
        subtitle="Create, track, and manage investigation cases with crime-scene location, live photo, and biometric verification"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowCreate(true)}
          className="cyber-btn-primary relative z-10 shadow-glow"
        >
          <Plus className="w-4 h-4" /> New Case
        </button>
      </div>

      <GlassCard className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by case ID, title, or FIR..." className="flex-1" />
          <div className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cyber-input w-auto">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="active">Active</option>
              <option value="under_review">Under Review</option>
              <option value="closed">Closed</option>
            </select>
            <button className="cyber-btn-secondary"><Filter className="w-4 h-4" /></button>
            <button className="cyber-btn-secondary"><ArrowUpDown className="w-4 h-4" /></button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Title</th>
                <th>FIR Number</th>
                <th>Crime Type</th>
                <th>Officer</th>
                <th>Biometric</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Evidence</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-navy-700 text-xs font-semibold">{c.caseId}</td>
                  <td className="font-medium text-navy-900 max-w-[200px] truncate">{c.title}</td>
                  <td className="text-xs text-navy-700">{c.firNumber}</td>
                  <td className="text-xs text-navy-700">{c.crimeType}</td>
                  <td className="text-xs text-navy-700">{c.officerAssigned}</td>
                  <td>
                    {c.biometricVerified ? (
                      <StatusBadge status="Verified" variant="success" />
                    ) : (
                      <StatusBadge status="Legacy" variant="default" />
                    )}
                  </td>
                  <td><StatusBadge status={c.priority} variant={priorityVariant(c.priority)} /></td>
                  <td><StatusBadge status={c.status.replace('_', ' ')} variant={statusVariant(c.status)} /></td>
                  <td className="text-center text-navy-800">{c.evidenceCount}</td>
                  <td className="text-xs text-navy-700">{formatDate(c.updatedAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/evidence?case=${c.caseId}`} className="p-1.5 rounded hover:bg-navy-50 text-navy-700 hover:text-navy-800" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {c.status !== 'closed' && (
                        <button onClick={() => closeCase(c.id)} className="p-1.5 rounded hover:bg-red-50 text-navy-700 hover:text-red-600" title="Close Case">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal isOpen={showCreate} onClose={handleCloseModal} title="Create New Case" size="lg">
        <p className="text-xs text-navy-700 mb-4 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-saffron-600" />
          All fields are mandatory. Location, live photo, and biometric verification are required before case registration.
        </p>

        <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Case Title', key: 'title' as const, type: 'text', placeholder: 'e.g. Cyber Fraud – UPI Scam' },
              { label: 'FIR Number', key: 'firNumber' as const, type: 'text', placeholder: 'e.g. FIR/2026/0892' },
              { label: 'Crime Type', key: 'crimeType' as const, type: 'text', placeholder: 'e.g. Cyber Fraud' },

              { label: 'Date & Time of Crime', key: 'dateTime' as const, type: 'datetime-local', placeholder: '' },
              { label: 'Officer Assigned', key: 'officerAssigned' as const, type: 'text', placeholder: 'Full name of IO / Officer' },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type={field.type}
                  value={form[field.key]}
                  placeholder={field.placeholder}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={fieldClass(field.key)}
                  required
                />
                {touched && errors[field.key] && (
                  <p className="text-[11px] text-red-600 mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as CasePriority })}
                className={fieldClass('priority')}
                required
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {touched && errors.priority && (
                <p className="text-[11px] text-red-600 mt-1">{errors.priority}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CaseStatus })}
                className={fieldClass('status')}
                required
              >
                <option value="open">Open</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
              </select>
              {touched && errors.status && (
                <p className="text-[11px] text-red-600 mt-1">{errors.status}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-navy-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={`${fieldClass('description')} min-h-[90px] resize-none`}
                placeholder="Brief facts of the case (mandatory)"
                required
              />
              {touched && errors.description && (
                <p className="text-[11px] text-red-600 mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-navy-200 bg-white/80 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-navy-800" />
              <h4 className="text-sm font-bold text-navy-900">
                Set Crime Scene Location <span className="text-red-500">*</span>
              </h4>
            </div>
            <p className="text-xs text-navy-700">
              Choose how you want to record the crime scene location. You can enter a full address, GPS coordinates, a landmark, or the local jurisdiction.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { id: 'address' as const, label: 'Full Address', icon: MapPin, desc: 'Street, city, and area' },
                { id: 'gps' as const, label: 'GPS Coordinates', icon: Navigation2, desc: 'Latitude and longitude' },
                { id: 'landmark' as const, label: 'Nearby Landmark', icon: Landmark, desc: 'Known place or point' },
                { id: 'jurisdiction' as const, label: 'Jurisdiction', icon: Building2, desc: 'Police station or beat' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setForm({ ...form, crimeSceneMode: mode.id })}
                  className={`rounded-lg border p-3 text-left transition ${
                    form.crimeSceneMode === mode.id
                      ? 'border-navy-800 bg-navy-900 text-white shadow-glow'
                      : 'border-navy-200 bg-navy-50/60 text-navy-800 hover:border-navy-300'
                  }`}
                >
                  <mode.icon className="w-4 h-4 mb-2" />
                  <div className="text-xs font-semibold">{mode.label}</div>
                  <div className={`text-[11px] ${form.crimeSceneMode === mode.id ? 'text-white/75' : 'text-navy-600'}`}>
                    {mode.desc}
                  </div>
                </button>
              ))}
            </div>

            {form.crimeSceneMode === 'address' && (
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Crime Scene Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.crimeSceneAddress}
                  onChange={(e) => setForm({ ...form, crimeSceneAddress: e.target.value })}
                  className={`${fieldClass('crimeSceneAddress')} min-h-[88px] resize-none`}
                  placeholder="Enter the complete crime scene address"
                  required
                />
                {touched && errors.crimeSceneAddress && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.crimeSceneAddress}</p>
                )}
              </div>
            )}

            {form.crimeSceneMode === 'gps' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.crimeSceneLatitude}
                    onChange={(e) => setForm({ ...form, crimeSceneLatitude: e.target.value })}
                    className={fieldClass('crimeSceneLatitude')}
                    placeholder="e.g. 28.6139"
                    required
                  />
                  {touched && errors.crimeSceneLatitude && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.crimeSceneLatitude}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.crimeSceneLongitude}
                    onChange={(e) => setForm({ ...form, crimeSceneLongitude: e.target.value })}
                    className={fieldClass('crimeSceneLongitude')}
                    placeholder="e.g. 77.2090"
                    required
                  />
                  {touched && errors.crimeSceneLongitude && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.crimeSceneLongitude}</p>
                  )}
                </div>
              </div>
            )}

            {form.crimeSceneMode === 'landmark' && (
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Nearby Landmark <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.crimeSceneLandmark}
                  onChange={(e) => setForm({ ...form, crimeSceneLandmark: e.target.value })}
                  className={fieldClass('crimeSceneLandmark')}
                  placeholder="e.g. District Court Gate, Metro Station, Mall"
                  required
                />
                {touched && errors.crimeSceneLandmark && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.crimeSceneLandmark}</p>
                )}
              </div>
            )}

            {form.crimeSceneMode === 'jurisdiction' && (
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Jurisdiction / Police Station <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.crimeSceneJurisdiction}
                  onChange={(e) => setForm({ ...form, crimeSceneJurisdiction: e.target.value })}
                  className={fieldClass('crimeSceneJurisdiction')}
                  placeholder="e.g. Chanakyapuri Police Station"
                  required
                />
                {touched && errors.crimeSceneJurisdiction && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.crimeSceneJurisdiction}</p>
                )}
              </div>
            )}
          </div>

          {/* Live Photo Section */}
          <div className="rounded-xl border border-navy-200 bg-navy-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-navy-800" />
              <h4 className="text-sm font-bold text-navy-900">
                Live Officer Photo <span className="text-red-500">*</span>
              </h4>
            </div>
            <p className="text-xs text-navy-700 mb-3">
              Capture a live photo via webcam for identity binding to this case.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-navy-200 bg-white overflow-hidden min-h-[200px] flex items-center justify-center relative">
                {cameraOn ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-[200px] object-cover" />
                ) : livePhoto ? (
                  <img src={livePhoto} alt="Live officer photo" className="w-full h-[200px] object-cover" />
                ) : (
                  <div className="text-center p-4 text-navy-700">
                    <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No photo captured yet</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 justify-center">
                {!cameraOn ? (
                  <button type="button" onClick={startCamera} className="cyber-btn-primary text-sm">
                    <Camera className="w-4 h-4" /> Open Live Camera
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={capturePhoto} className="cyber-btn-primary text-sm">
                      <CheckCircle className="w-4 h-4" /> Capture Photo
                    </button>
                    <button type="button" onClick={stopCamera} className="cyber-btn-secondary text-sm">
                      Cancel Camera
                    </button>
                  </>
                )}


                {livePhoto && (
                  <button
                    type="button"
                    onClick={() => { setLivePhoto(null); setBiometricStatus('idle'); setScanProgress(0) }}
                    className="cyber-btn-secondary text-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake / Clear
                  </button>
                )}

                {cameraError && <p className="text-[11px] text-amber-700">{cameraError}</p>}
                {touched && errors.livePhoto && (
                  <p className="text-[11px] text-red-600">{errors.livePhoto}</p>
                )}
                {livePhoto && (
                  <p className="text-[11px] text-india-green flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Live photo attached
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Biometric Section */}
          <div className="rounded-xl border border-navy-200 bg-navy-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="w-4 h-4 text-navy-800" />
              <h4 className="text-sm font-bold text-navy-900">
                Biometric Verification <span className="text-red-500">*</span>
              </h4>
            </div>
            <p className="text-xs text-navy-700 mb-3">
              Verify officer identity using fingerprint, face match, or iris scan before registering the case.
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { id: 'fingerprint' as const, label: 'Fingerprint', icon: Fingerprint },
                { id: 'face' as const, label: 'Face Match', icon: ScanFace },
                { id: 'iris' as const, label: 'Iris Scan', icon: Eye },
              ]).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setBiometricMethod(m.id)
                    setBiometricStatus('idle')
                    setScanProgress(0)
                  }}
                  className={`cyber-btn text-xs py-2 ${
                    biometricMethod === m.id
                      ? 'bg-navy-900 text-white border-navy-900'
                      : 'cyber-btn-secondary'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-navy-300 bg-white flex items-center justify-center relative">
                {biometricMethod === 'fingerprint' && <Fingerprint className={`w-12 h-12 ${biometricStatus === 'verified' ? 'text-india-green' : 'text-navy-300'}`} />}
                {biometricMethod === 'face' && <ScanFace className={`w-12 h-12 ${biometricStatus === 'verified' ? 'text-india-green' : 'text-navy-300'}`} />}
                {biometricMethod === 'iris' && <Eye className={`w-12 h-12 ${biometricStatus === 'verified' ? 'text-india-green' : 'text-navy-300'}`} />}
                {biometricStatus === 'scanning' && (
                  <div className="absolute inset-2 rounded-full border-2 border-saffron-500 border-t-transparent animate-spin" />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between text-xs text-navy-600">
                  <span>
                    {biometricStatus === 'idle' && 'Ready to scan'}
                    {biometricStatus === 'scanning' && `Scanning ${biometricMethod}…`}
                    {biometricStatus === 'verified' && 'Biometric match confirmed'}
                    {biometricStatus === 'failed' && 'Scan failed — try again'}
                  </span>
                  <span className="font-mono">{scanProgress}%</span>
                </div>
                <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      biometricStatus === 'verified' ? 'bg-india-green' : 'bg-saffron-500'
                    }`}
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={runBiometricScan}
                  disabled={biometricStatus === 'scanning' || !livePhoto}
                  className="cyber-btn-primary text-sm mt-2"
                  title={!livePhoto ? 'Capture live photo first' : undefined}
                >
                  <Fingerprint className="w-4 h-4" />
                  {biometricStatus === 'verified' ? 'Re-scan Biometric' : 'Start Biometric Scan'}
                </button>
                {!livePhoto && (
                  <p className="text-[11px] text-amber-700">Capture live photo before biometric scan.</p>
                )}
                {touched && errors.biometric && (
                  <p className="text-[11px] text-red-600">{errors.biometric}</p>
                )}
                {biometricStatus === 'verified' && (
                  <p className="text-[11px] text-india-green flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Officer biometric verified ({biometricMethod})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-navy-100">
          <button onClick={handleCloseModal} className="cyber-btn-secondary">Cancel</button>
          <button onClick={handleCreate} className="cyber-btn-primary">
            <Plus className="w-4 h-4" /> Create Case
          </button>
        </div>
      </Modal>
    </div>
  )
}

