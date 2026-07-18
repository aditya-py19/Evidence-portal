import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AppContext'
import { BrandLockup, AshokaEmblem } from '../components/brand/Logos'

export default function LoginPage({ portal = 'officer' }: { portal?: 'officer' | 'judge' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const isJudge = portal === 'judge'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter your username and password')
      return
    }
    const result = await login(username, password, portal)
    if (result.success) navigate(isJudge ? '/judge-portal' : '/dashboard')
    else setError(result.message ?? 'Access denied.')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#F5F7FA]">
      <div className="tricolor-line shrink-0 relative z-10" />

      {/* Ashoka emblem watermark background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden>
        <AshokaEmblem
          size={520}
          className="opacity-[0.06] select-none max-w-[90vw] max-h-[80vh]"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-radial-glow" aria-hidden />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-lg"
        >
          <BrandLockup />

          <div className="mt-6 rounded-2xl bg-white/95 shadow-glow-lg border border-navy-100 p-6 sm:p-8 backdrop-blur-sm">
            <div className="text-center mb-5">
              <h2 className="font-display text-xl font-bold text-navy-900">{isJudge ? 'Secure Judge Login' : 'Secure Officer Login'}</h2>
              <p className="font-hindi text-sm text-navy-700 mt-1">
                {isJudge ? 'न्यायिक पहुंच · Authorised judicial access only' : 'अधिकृत पहुंच · Authorised personnel only'}
              </p>
            </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-600 mb-1.5">
                    {isJudge ? 'Judge ID / Username' : 'Force ID / Username'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-700" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="cyber-input pl-10"
                      placeholder={isJudge ? 'e.g. judge.portal' : 'e.g. portal.admin'}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-600 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-700" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="cyber-input pl-10 pr-10"
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-700 hover:text-navy-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-navy-600 mb-1.5">
                    {isJudge ? 'Judge ID / Court email only' : 'Force ID / Email access only'}
                  </label>
                  <p className="text-xs text-navy-700">{isJudge ? 'Use your court-issued Judge Portal credentials.' : 'Your account role is assigned by the portal administrator.'}</p>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button type="submit" className="cyber-btn-primary w-full">
                  <Shield className="w-4 h-4" />
                  Sign in securely
                </button>

                <div className="text-center">
                  <button type="button" className="text-xs text-saffron-600 hover:text-saffron-700 font-medium">
                    {isJudge ? 'Forgot Password? Contact Court Administrator' : 'Forgot Password? Contact Station Admin'}
                  </button>
                </div>
              </form>
          </div>

          <p className="text-center text-[11px] text-navy-600 mt-5 leading-relaxed px-2">
            For official use by Chhattisgarh Police, Forensic Laboratories & Courts.
            <br />
            AES-256 · Hyperledger Fabric · CCTNS-ready architecture
          </p>
        </motion.div>
      </div>

      <footer className="shrink-0 relative z-10 border-t border-navy-100 bg-white/90 px-4 py-3 text-center">
        <p className="text-[11px] text-navy-700">
          © {new Date().getFullYear()} Evidence Portal · छत्तीसगढ़ पुलिस Digital Evidence Initiative ·{' '}
          <span className="text-navy-800 font-semibold">Government of India</span> (Demo)
        </p>
      </footer>
    </div>
  )
}
