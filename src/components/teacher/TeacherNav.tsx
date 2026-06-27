'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/teacher', label: 'Dashboard', icon: '🏠' },
  { href: '/teacher/classes', label: 'Classes', icon: '🎓' },
  { href: '/teacher/assignments', label: 'Assignments', icon: '📝' },
  { href: '/teacher/announcements', label: 'Announcements', icon: '📢' },
  { href: '/teacher/ai', label: 'AI Assistant', icon: '🤖' },
]

export default function TeacherNav({ teacherName }: { teacherName: string }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-blue-950 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <div className="text-2xl mb-1">⚗️</div>
        <h1 className="font-bold text-lg">Kemistry</h1>
        <p className="text-blue-300 text-xs mt-1">Teacher Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/teacher' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <p className="text-blue-300 text-xs mb-2 truncate">{teacherName}</p>
        <form action="/api/auth/signout" method="post">
          <button className="w-full text-left text-sm text-blue-300 hover:text-white transition px-2 py-1">
            Sign Out →
          </button>
        </form>
      </div>
    </aside>
  )
}
