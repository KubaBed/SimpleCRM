import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Dashboard', icon: '☰' },
  { to: '/tasks', label: 'Zadania', icon: '✓' }
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold tracking-tight text-gray-900">SimpleCRM</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <span className="text-base">⎋</span>
          {loggingOut ? 'Wylogowuję…' : 'Wyloguj'}
        </button>
      </div>
    </aside>
  )
}
