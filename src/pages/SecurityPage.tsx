import { useState } from 'react'
import { Shield, Lock, Clock, Fingerprint, Link2, Brain, Save } from 'lucide-react'
import { PageHeader, GlassCard, TabGroup } from '../components/ui'

export default function SecurityPage() {
  const [tab, setTab] = useState('password')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'password', label: 'Password Policy' },
    { id: 'session', label: 'Session' },
    { id: 'mfa', label: 'MFA' },
    { id: 'encryption', label: 'Encryption' },
    { id: 'blockchain', label: 'Blockchain' },
    { id: 'ai', label: 'AI Config' },
  ]

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Security Settings"
        subtitle="Configure platform security policies and integrations"
        actions={
          <button onClick={handleSave} className="cyber-btn-primary">
            <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
          </button>
        }
      />

      <TabGroup tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'password' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-navy-800" /> Password Policy
          </h3>
          {[
            { label: 'Minimum Length', value: '12', type: 'number' },
            { label: 'Require Uppercase', value: 'true', type: 'select', options: ['true', 'false'] },
            { label: 'Require Numbers', value: 'true', type: 'select', options: ['true', 'false'] },
            { label: 'Require Special Characters', value: 'true', type: 'select', options: ['true', 'false'] },
            { label: 'Password Expiry (days)', value: '90', type: 'number' },
            { label: 'Max Login Attempts', value: '5', type: 'number' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              {field.type === 'select' ? (
                <select className="cyber-input w-32 text-sm">
                  {field.options?.map((o) => <option key={o} value={o}>{o === 'true' ? 'Enabled' : 'Disabled'}</option>)}
                </select>
              ) : (
                <input type={field.type} defaultValue={field.value} className="cyber-input w-32 text-sm" />
              )}
            </div>
          ))}
        </GlassCard>
      )}

      {tab === 'session' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-navy-800" /> Session Management
          </h3>
          {[
            { label: 'Session Timeout (minutes)', value: '30' },
            { label: 'Idle Timeout (minutes)', value: '15' },
            { label: 'Max Concurrent Sessions', value: '2' },
            { label: 'Force Re-authentication for Sensitive Actions', value: 'true', type: 'select' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              {field.type === 'select' ? (
                <select className="cyber-input w-32 text-sm"><option>Enabled</option><option>Disabled</option></select>
              ) : (
                <input type="number" defaultValue={field.value} className="cyber-input w-32 text-sm" />
              )}
            </div>
          ))}
        </GlassCard>
      )}

      {tab === 'mfa' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-navy-800" /> Multi-Factor Authentication
          </h3>
          {[
            { label: 'Enforce MFA for All Users', enabled: true },
            { label: 'TOTP Authenticator App', enabled: true },
            { label: 'SMS OTP Backup', enabled: false },
            { label: 'Hardware Security Key (FIDO2)', enabled: true },
            { label: 'Biometric Authentication', enabled: false },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              <button className={`w-12 h-6 rounded-full transition-colors ${field.enabled ? 'bg-navy-800' : 'bg-cyber-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${field.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </GlassCard>
      )}

      {tab === 'encryption' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-navy-800" /> Encryption Settings
          </h3>
          {[
            { label: 'File Encryption Algorithm', value: 'AES-256-GCM' },
            { label: 'Key Management', value: 'AWS KMS / HSM' },
            { label: 'TLS Version', value: 'TLS 1.3' },
            { label: 'Database Encryption', value: 'Transparent Data Encryption' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              <span className="text-sm text-navy-800 font-mono">{field.value}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {tab === 'blockchain' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-navy-800" /> Blockchain Configuration
          </h3>
          {[
            { label: 'Network', value: 'Hyperledger Fabric v2.5' },
            { label: 'Channel', value: 'evidence-channel' },
            { label: 'Chaincode', value: 'evidence-portal-v2' },
            { label: 'IPFS Gateway', value: 'https://ipfs.evidenceportal.gov.in' },
            { label: 'Auto-register on Upload', value: 'true', type: 'select' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              {field.type === 'select' ? (
                <select className="cyber-input w-32 text-sm"><option>Enabled</option><option>Disabled</option></select>
              ) : (
                <span className="text-sm text-navy-800 font-mono">{field.value}</span>
              )}
            </div>
          ))}
        </GlassCard>
      )}

      {tab === 'ai' && (
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-navy-800" /> AI Configuration
          </h3>
          {[
            { label: 'Auto-analyze on Upload', enabled: true },
            { label: 'Deepfake Detection', enabled: true },
            { label: 'Image Forgery Detection', enabled: true },
            { label: 'Video Tampering Detection', enabled: true },
            { label: 'AI Generated Content Detection', enabled: true },
            { label: 'Risk Threshold for Auto-reject', value: '80' },
          ].map((field) => (
            <div key={field.label} className="flex items-center justify-between p-3 rounded-lg bg-cyber-800/30 border border-glass-border/50">
              <span className="text-sm text-navy-800">{field.label}</span>
              {'enabled' in field ? (
                <button className={`w-12 h-6 rounded-full transition-colors ${field.enabled ? 'bg-navy-800' : 'bg-cyber-700'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${field.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              ) : (
                <input type="number" defaultValue={field.value} className="cyber-input w-32 text-sm" />
              )}
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  )
}
