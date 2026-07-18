import { Scale, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandLockup, AshokaEmblem } from '../components/brand/Logos'

export default function PortalSelectionPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#F5F7FA]">
      <div className="tricolor-line shrink-0 relative z-10" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <AshokaEmblem size={520} className="opacity-[0.06] max-w-[90vw] max-h-[80vh]" />
      </div>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-3xl">
          <BrandLockup />
          <section className="mt-6 rounded-2xl bg-white/95 shadow-glow-lg border border-navy-100 p-6 sm:p-8">
            <div className="text-center mb-7">
              <h2 className="font-display text-xl font-bold text-navy-900">Choose your secure portal</h2>
              <p className="text-sm text-navy-700 mt-1">Select the portal matching your authorised role.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/officer-login" className="group rounded-xl border border-navy-200 p-6 hover:border-navy-800 hover:shadow-md transition-all">
                <Shield className="w-8 h-8 text-navy-800 mb-4" />
                <h3 className="font-display font-bold text-navy-900">Officer Login</h3>
                <p className="text-sm text-navy-700 mt-2">For police, investigators, forensic experts, and administrators.</p>
              </Link>
              <Link to="/judge-login" className="group rounded-xl border border-saffron-200 p-6 hover:border-saffron-600 hover:shadow-md transition-all">
                <Scale className="w-8 h-8 text-saffron-600 mb-4" />
                <h3 className="font-display font-bold text-navy-900">Judge Login</h3>
                <p className="text-sm text-navy-700 mt-2">For authorised judicial review and evidence verification.</p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}