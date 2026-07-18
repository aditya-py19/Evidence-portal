import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { MapPin, Navigation, CheckCircle, AlertTriangle, XCircle, ArrowLeft, RotateCcw, Search, LoaderCircle } from 'lucide-react'
import { PageHeader, GlassCard, StatusBadge } from '../components/ui'
import { evidenceList } from '../data/mockData'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const geoConfig = {
  verified: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30', label: 'Verified', variant: 'success' as const },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30', label: 'Warning', variant: 'warning' as const },
  outside_boundary: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/30', label: 'Outside Boundary', variant: 'danger' as const },
}

type LocationSuggestion = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c // Distance in km
  return Number(d.toFixed(2))
}

export default function GeolocationPage() {
  const { id } = useParams()
  const evidence = id ? evidenceList.find((e) => e.id === id) : evidenceList[0]

  if (!evidence) return <div className="text-center py-20 text-navy-700">Evidence not found</div>

  const [crimeLoc, setCrimeLoc] = useState({
    lat: evidence.crimeLocation.lat,
    lng: evidence.crimeLocation.lng,
    address: evidence.crimeLocation.address,
  })
  const [locationQuery, setLocationQuery] = useState(evidence.crimeLocation.address)
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearchingLocations, setIsSearchingLocations] = useState(false)
  const [locationSearchError, setLocationSearchError] = useState('')

  // Reset coordinates when switching evidence
  useEffect(() => {
    setCrimeLoc({
      lat: evidence.crimeLocation.lat,
      lng: evidence.crimeLocation.lng,
      address: evidence.crimeLocation.address,
    })
    setLocationQuery(evidence.crimeLocation.address)
    setLocationSuggestions([])
    setLocationSearchError('')
  }, [evidence.id])

  // Search OpenStreetMap's geocoder after the user pauses typing. Selecting a
  // result stores the returned coordinates, so the marker represents the real place.
  useEffect(() => {
    const query = locationQuery.trim()
    if (query.length < 3 || query === crimeLoc.address) {
      setLocationSuggestions([])
      setIsSearchingLocations(false)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setIsSearchingLocations(true)
      setLocationSearchError('')
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error('Location search failed')
        setLocationSuggestions((await response.json()) as LocationSuggestion[])
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setLocationSearchError('Unable to search locations. Please try again.')
          setLocationSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) setIsSearchingLocations(false)
      }
    }, 400)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [locationQuery, crimeLoc.address])

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const crimeMarkerRef = useRef<L.Marker | null>(null)
  const uploadMarkerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  // Calculate dynamic values
  const distance = calculateDistance(
    evidence.uploadLocation.lat,
    evidence.uploadLocation.lng,
    crimeLoc.lat,
    crimeLoc.lng
  )

  let dynamicStatus: 'verified' | 'warning' | 'outside_boundary' = 'verified'
  if (distance <= evidence.allowedRadius * 0.8) {
    dynamicStatus = 'verified'
  } else if (distance <= evidence.allowedRadius) {
    dynamicStatus = 'warning'
  } else {
    dynamicStatus = 'outside_boundary'
  }

  const geo = geoConfig[dynamicStatus]
  const GeoIcon = geo.icon

  // Recalculate dynamic trust score
  const updatedBreakdown = {
    ...evidence.trustBreakdown,
    geolocation: dynamicStatus === 'verified' ? 100 : dynamicStatus === 'warning' ? 70 : 20,
  }
  const breakdownValues = Object.values(updatedBreakdown)
  const dynamicTrustScore = Math.round(breakdownValues.reduce((a, b) => a + b, 0) / breakdownValues.length)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return

    // Create map instance
    const map = L.map(mapContainerRef.current).setView([crimeLoc.lat, crimeLoc.lng], 12)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    // Custom DivIcons styled using Tailwind CSS
    const crimeIcon = L.divIcon({
      className: 'custom-crime-icon',
      html: `
        <div class="flex flex-col items-center select-none" style="width: 100px; transform: translateY(-10px);">
          <div class="w-8 h-8 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center animate-pulse shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <span class="text-[9px] font-bold text-red-600 mt-1 bg-white/95 border border-red-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">Crime Scene</span>
        </div>
      `,
      iconSize: [100, 60],
      iconAnchor: [50, 48],
    })

    const uploadIcon = L.divIcon({
      className: 'custom-upload-icon',
      html: `
        <div class="flex flex-col items-center select-none" style="width: 100px; transform: translateY(-10px);">
          <div class="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-navy-700"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
          </div>
          <span class="text-[9px] font-bold text-navy-700 mt-1 bg-white/95 border border-navy-200 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">Upload Location</span>
        </div>
      `,
      iconSize: [100, 60],
      iconAnchor: [50, 48],
    })

    // Add markers
    const crimeMarker = L.marker([crimeLoc.lat, crimeLoc.lng], { icon: crimeIcon, draggable: true }).addTo(map)
    crimeMarkerRef.current = crimeMarker

    const uploadMarker = L.marker([evidence.uploadLocation.lat, evidence.uploadLocation.lng], { icon: uploadIcon }).addTo(map)
    uploadMarkerRef.current = uploadMarker

    // Add allowed radius circle centered on crime location
    const circle = L.circle([crimeLoc.lat, crimeLoc.lng], {
      color: '#2563eb',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5, 5',
      radius: evidence.allowedRadius * 1000,
    }).addTo(map)
    circleRef.current = circle

    // Zoom map to cover both points
    const group = L.featureGroup([crimeMarker, uploadMarker])
    map.fitBounds(group.getBounds().pad(0.15))

    // Handle marker drag
    crimeMarker.on('drag', (e) => {
      const position = e.target.getLatLng()
      circle.setLatLng(position)
      setCrimeLoc((prev) => ({
        ...prev,
        lat: Number(position.lat.toFixed(5)),
        lng: Number(position.lng.toFixed(5)),
        address: 'Custom Selected Location',
      }))
    })

    // Handle map click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      crimeMarker.setLatLng([lat, lng])
      circle.setLatLng([lat, lng])
      setCrimeLoc((prev) => ({
        ...prev,
        lat: Number(lat.toFixed(5)),
        lng: Number(lng.toFixed(5)),
        address: 'Custom Selected Location',
      }))
    })

    return () => {
      map.remove()
      mapRef.current = null
      crimeMarkerRef.current = null
      uploadMarkerRef.current = null
      circleRef.current = null
    }
  }, [evidence.id])

  // Synchronise map and circle position when coordinates change manually via input
  useEffect(() => {
    const lat = crimeLoc.lat
    const lng = crimeLoc.lng
    if (crimeMarkerRef.current) {
      const currentLatLng = crimeMarkerRef.current.getLatLng()
      if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
        crimeMarkerRef.current.setLatLng([lat, lng])
      }
    }
    if (circleRef.current) {
      const currentLatLng = circleRef.current.getLatLng()
      if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
        circleRef.current.setLatLng([lat, lng])
      }
    }
    if (mapRef.current && crimeMarkerRef.current && uploadMarkerRef.current) {
      const group = L.featureGroup([crimeMarkerRef.current, uploadMarkerRef.current])
      mapRef.current.fitBounds(group.getBounds().pad(0.15))
    }
  }, [crimeLoc.lat, crimeLoc.lng])

  const handleLatitudeChange = (val: string) => {
    const lat = parseFloat(val)
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      setCrimeLoc((prev) => ({ ...prev, lat: Number(lat.toFixed(5)) }))
    }
  }

  const handleLongitudeChange = (val: string) => {
    const lng = parseFloat(val)
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      setCrimeLoc((prev) => ({ ...prev, lng: Number(lng.toFixed(5)) }))
    }
  }

  const resetToDefault = () => {
    setCrimeLoc({
      lat: evidence.crimeLocation.lat,
      lng: evidence.crimeLocation.lng,
      address: evidence.crimeLocation.address,
    })
    setLocationQuery(evidence.crimeLocation.address)
    setLocationSuggestions([])
  }

  const selectLocation = (suggestion: LocationSuggestion) => {
    const lat = Number.parseFloat(suggestion.lat)
    const lng = Number.parseFloat(suggestion.lon)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return

    setCrimeLoc({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)), address: suggestion.display_name })
    setLocationQuery(suggestion.display_name)
    setLocationSuggestions([])
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Geolocation Verification"
        subtitle="GPS-based evidence location validation against crime scene coordinates"
        actions={
          id && (
            <Link to="/geolocation" className="cyber-btn-secondary">
              <ArrowLeft className="w-4 h-4" /> All Locations
            </Link>
          )
        }
      />

      {!id && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {evidenceList.map((ev) => {
            const evDist = ev.id === evidence.id ? distance : ev.geoDistance
            const evStatus = ev.id === evidence.id ? dynamicStatus : ev.geoStatus
            return (
              <Link key={ev.id} to={`/geolocation/${ev.id}`} className="glass-card-hover !p-4">
                <p className="font-mono text-navy-800 text-xs">{ev.evidenceId}</p>
                <StatusBadge status={evStatus.replace('_', ' ')} variant={geoConfig[evStatus].variant} />
                <p className="text-xs text-navy-700 mt-2">Distance: {evDist} km</p>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 !p-0 overflow-hidden min-h-[450px] relative">
          <div className="absolute top-3 left-3 bg-white/90 border border-navy-200 text-navy-800 px-3 py-1.5 rounded-lg text-xs font-semibold z-[1000] pointer-events-none shadow-sm backdrop-blur-md">
            📍 Click map or drag red marker to update Crime Location
          </div>
          <div ref={mapContainerRef} className="w-full h-[450px] z-10" />
        </GlassCard>

        <div className="space-y-4">
          <GlassCard>
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${geo.bg}`}>
              <GeoIcon className={`w-8 h-8 ${geo.color}`} />
              <div>
                <p className={`font-bold ${geo.color}`}>{geo.label}</p>
                <p className="text-xs text-navy-700">Geolocation Status</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Crime Location Details</p>
                <button
                  onClick={resetToDefault}
                  className="text-[10px] text-navy-700 hover:text-navy-900 flex items-center gap-1 border border-navy-200 hover:border-navy-300 rounded px-1.5 py-0.5 bg-white transition-all font-semibold"
                  title="Reset to original mock coordinates"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reset
                </button>
              </div>
              <div className="relative mt-2">
                <label htmlFor="location-search" className="text-[9px] text-navy-600 uppercase font-semibold">
                  Search exact location
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-500" />
                  <input
                    id="location-search"
                    type="search"
                    autoComplete="off"
                    placeholder="Enter an address, landmark, or city"
                    className="w-full bg-white border border-navy-200 rounded px-8 py-1.5 text-xs text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    onBlur={() => window.setTimeout(() => setLocationSuggestions([]), 150)}
                  />
                  {isSearchingLocations && <LoaderCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-500 animate-spin" />}
                </div>
                {locationSuggestions.length > 0 && (
                  <div className="absolute z-[1100] mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-navy-200 bg-white shadow-lg">
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectLocation(suggestion)}
                        className="w-full border-b border-navy-100 last:border-0 px-3 py-2 text-left hover:bg-navy-50 transition-colors"
                      >
                        <span className="block text-xs font-medium text-navy-900">{suggestion.display_name}</span>
                        <span className="block mt-0.5 text-[10px] text-navy-600 font-mono">{Number(suggestion.lat).toFixed(5)}, {Number(suggestion.lon).toFixed(5)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {locationSearchError && <p className="mt-1 text-[10px] text-red-600">{locationSearchError}</p>}
              </div>
              <p className="mt-2 text-sm text-navy-900 font-medium">{crimeLoc.address}</p>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-[9px] text-navy-600 uppercase font-semibold">Latitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    className="w-full bg-white border border-navy-200 rounded px-2 py-1 text-xs text-navy-900 font-mono focus:outline-none focus:ring-1 focus:ring-navy-500"
                    value={crimeLoc.lat}
                    onChange={(e) => handleLatitudeChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-navy-600 uppercase font-semibold">Longitude</label>
                  <input
                    type="number"
                    step="0.00001"
                    className="w-full bg-white border border-navy-200 rounded px-2 py-1 text-xs text-navy-900 font-mono focus:outline-none focus:ring-1 focus:ring-navy-500"
                    value={crimeLoc.lng}
                    onChange={(e) => handleLongitudeChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <hr className="border-navy-100" />

            <div>
              <p className="text-[10px] text-navy-600 uppercase font-semibold font-semibold">Upload Location</p>
              <p className="text-sm text-navy-900 mt-1">{evidence.uploadLocation.address}</p>
              <p className="text-xs font-mono text-navy-700 mt-0.5">
                {evidence.uploadLocation.lat}, {evidence.uploadLocation.lng}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 text-center">
                <p className="text-2xl font-bold text-navy-900">{distance}</p>
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Distance (km)</p>
              </div>
              <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 text-center">
                <p className="text-2xl font-bold text-navy-800">{evidence.allowedRadius}</p>
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Allowed Radius (km)</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 space-y-1.5">
              <div>
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Dynamic Trust Score</p>
                <p className="text-lg font-bold text-navy-900">{dynamicTrustScore} / 100</p>
              </div>
              <div>
                <p className="text-[10px] text-navy-600 uppercase font-semibold">Trust Score Impact</p>
                <p className={`text-xs font-semibold mt-0.5 ${
                  dynamicStatus === 'verified' ? 'text-emerald-600' :
                  dynamicStatus === 'warning' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {dynamicStatus === 'verified' ? '✓ Safe: Location verified' :
                   dynamicStatus === 'warning' ? '⚠ Warning: Near boundary limits' :
                   '✗ High Risk: Location outside limits'}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
