interface LogoProps {
  className?: string
  size?: number
}

/** Ashoka Lion Capital emblem – used as logo & watermark */
export function AshokaEmblem({ className = '', size = 72 }: LogoProps) {
  return (
    <img
      src="/brand/ashoka-emblem.png"
      alt="State Emblem of India"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
    />
  )
}

/** Chhattisgarh Police official logo */
export function PoliceLogo({ className = '', size = 88 }: LogoProps) {
  return (
    <img
      src="/brand/chhattisgarh-police-logo.png"
      alt="Chhattisgarh Police"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
    />
  )
}

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        <PoliceLogo size={40} className="rounded-full bg-white shadow-sm ring-1 ring-navy-200" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy-900 leading-tight">Evidence Portal</p>
          <p className="text-[10px] text-saffron-600 font-semibold">छत्तीसगढ़ पुलिस</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="flex items-center justify-center gap-5 sm:gap-8">
        <AshokaEmblem size={96} className="drop-shadow-sm" />
        <div className="h-20 w-px bg-gradient-to-b from-transparent via-navy-300 to-transparent" />
        <div className="rounded-2xl bg-white p-2 shadow-md ring-1 ring-navy-100">
          <PoliceLogo size={100} />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-saffron-600 tracking-wide">
          छत्तीसगढ़ पुलिस · Chhattisgarh Police
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-navy-900 mt-1">
          Evidence Portal
        </h1>
        <p className="text-base text-navy-700 mt-1 max-w-md mx-auto">
          AI-Powered Digital Evidence Trust Platform
        </p>
        <p className="text-xs text-navy-600 mt-2">
          डिजिटल साक्ष्य विश्वास प्रणाली · Official use only
        </p>
      </div>
    </div>
  )
}
