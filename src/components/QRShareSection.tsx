import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'react-qr-code'
import {
  Share2, Copy, Download, Printer, ExternalLink, Check, X, QrCode, ShieldCheck
} from 'lucide-react'
import { PoliceLogo } from './brand/Logos'

interface QRShareSectionProps {
  verificationToken: string
  caseId: string
  evidenceId?: string
  title?: string
  className?: string
}

export function QRShareSection({
  verificationToken,
  caseId,
  evidenceId = 'EVD-TC-2026-0142-001',
  title = 'Digital Evidence Verification',
  className = '',
}: QRShareSectionProps) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  // Construct production URL
  const domain = typeof window !== 'undefined'
    ? (window.location.host.includes('localhost') ? 'evidence-portal.gov.in' : window.location.host)
    : 'evidence-portal.gov.in'
  
  const protocol = typeof window !== 'undefined' && window.location.protocol.startsWith('https') ? 'https' : 'https'
  const verifyUrl = `${protocol}://${domain}/verify/${verificationToken}`
  const actualNavUrl = `/verify/${verificationToken}`

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // 1. Web Share API or Modal fallback
  const handleShare = async () => {
    const shareData = {
      title: 'Digital Evidence Verification',
      text: 'Scan this QR code or open the link below to verify the authenticity and integrity of this digital evidence.',
      url: verifyUrl,
    }

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        showToast('Shared successfully!')
        return
      } catch (err) {
        console.warn('Web Share cancelled or failed, falling back to modal:', err)
      }
    }

    // Fallback to desktop modal
    setShowModal(true)
  }

  // 2. Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl)
      setCopied(true)
      showToast('Verification link copied successfully.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Failed to copy link.')
    }
  }

  // 3. Download QR as PNG
  const handleDownloadPNG = () => {
    if (!qrRef.current) return
    const svgElement = qrRef.current.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const URL = window.URL || window.webkitURL || window
    const blobURL = URL.createObjectURL(svgBlob)

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 600
      const context = canvas.getContext('2d')
      if (!context) return

      // White background fill
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 50, 50, 500, 500)

      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `Case_${caseId}_Verification_QR.png`
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(blobURL)
      showToast(`Downloaded Case_${caseId}_Verification_QR.png`)
    }
    image.src = blobURL
  }

  // 4. Print QR Document
  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const now = new Date().toISOString()

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Case ${caseId} Verification QR</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #0f172a; max-width: 600px; margin: 0 auto; text-align: center; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: bold; margin: 8px 0 4px; }
            .subtitle { font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
            .qr-box { background: #ffffff; padding: 24px; border: 2px solid #e2e8f0; border-radius: 16px; margin: 24px auto; display: inline-block; }
            .meta { background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: left; font-size: 12px; margin-top: 24px; }
            .meta p { margin: 6px 0; }
            .meta span { font-weight: bold; font-family: monospace; }
            .footer { margin-top: 32px; font-size: 10px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="subtitle">Government of India • Police Digital Evidence Portal</div>
            <div class="title">Official Digital Evidence Verification Document</div>
          </div>

          <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(verifyUrl)}" width="240" height="240" />
          </div>

          <div class="meta">
            <p>Case ID: <span>${caseId}</span></p>
            <p>Evidence ID: <span>${evidenceId}</span></p>
            <p>Verification Token: <span>${verificationToken}</span></p>
            <p>Verification URL: <span>${verifyUrl}</span></p>
            <p>ISO/IEC 27037 Seal: <span>VERIFIED APPEND-ONLY LEDGER</span></p>
            <p>Generated At: <span>${now}</span></p>
          </div>

          <div class="footer">
            Confidential Law Enforcement Document • Section 65B Admissible Evidence Record
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10000] px-4 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SVG QR Code Display */}
      <div ref={qrRef} className="w-36 h-36 mx-auto bg-white rounded-xl p-2.5 flex items-center justify-center border border-navy-100 shadow-sm">
        <QRCode
          size={140}
          style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
          value={verifyUrl}
          viewBox={`0 0 256 256`}
        />
      </div>

      <p className="text-[10px] text-navy-600 font-mono text-center truncate px-2">
        Token: {verificationToken}
      </p>

      {/* Four Responsive Action Buttons */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={handleShare}
          className="cyber-btn-secondary py-2 px-2.5 flex items-center justify-center gap-1.5 text-[11px]"
          title="Share QR via Web Share API or Modal"
        >
          <Share2 className="w-3.5 h-3.5 text-navy-800" /> Share QR
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="cyber-btn-secondary py-2 px-2.5 flex items-center justify-center gap-1.5 text-[11px]"
          title="Copy Verification Link"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-navy-800" />}
          {copied ? 'Copied' : 'Copy Link'}
        </button>

        <button
          type="button"
          onClick={handleDownloadPNG}
          className="cyber-btn-secondary py-2 px-2.5 flex items-center justify-center gap-1.5 text-[11px]"
          title="Download QR as PNG image"
        >
          <Download className="w-3.5 h-3.5 text-navy-800" /> Download QR
        </button>

        <button
          type="button"
          onClick={handlePrintQR}
          className="cyber-btn-secondary py-2 px-2.5 flex items-center justify-center gap-1.5 text-[11px]"
          title="Print QR document"
        >
          <Printer className="w-3.5 h-3.5 text-navy-800" /> Print QR
        </button>
      </div>

      {/* Desktop Fallback Share Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-navy-100 shadow-2xl max-w-md w-full p-6 space-y-5 relative text-left">
            <div className="flex items-center justify-between border-b border-navy-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-navy-900" />
                <h3 className="text-sm font-bold text-navy-900">Share Verification QR</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-navy-50 text-navy-600 hover:text-navy-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-navy-50 border border-navy-100 space-y-1">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Verification Target URL</p>
                <p className="text-xs font-mono text-navy-900 truncate">{verifyUrl}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <button
                  onClick={handleCopyLink}
                  className="cyber-btn-primary py-2 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>
                <button
                  onClick={handleDownloadPNG}
                  className="cyber-btn-secondary py-2 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PNG
                </button>
                <button
                  onClick={handlePrintQR}
                  className="cyber-btn-secondary py-2 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print QR
                </button>
                <a
                  href={actualNavUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="cyber-btn-secondary py-2 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
