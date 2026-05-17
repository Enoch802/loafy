import { createContext, useContext, useEffect, useState } from 'react'

const OnlineContext = createContext(true)

export function OnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  return <OnlineContext.Provider value={isOnline}>{children}</OnlineContext.Provider>
}

export function useOnline() {
  return useContext(OnlineContext)
}
