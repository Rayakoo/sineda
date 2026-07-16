'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type NavContextType = {
  activeSection: string
  setActiveSection: (section: string) => void
}

const NavContext = createContext<NavContextType>({
  activeSection: 'home',
  setActiveSection: () => {},
})

export function NavProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState('home')
  return (
    <NavContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  return useContext(NavContext)
}
