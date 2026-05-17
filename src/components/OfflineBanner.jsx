import { useOnline } from '../context/OnlineContext'

export default function OfflineBanner() {
  const isOnline = useOnline()
  if (isOnline) return null

  return (
    <div className="offline-banner">
      <span className="offline-dot" />
      Offline — transactions will sync when connection is restored
    </div>
  )
}
