'use client'

import {
  MessageSquarePlus,
  Star,
  Image as ImageIcon,
  History,
  Download,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

const sidebarItems = [
  { icon: MessageSquarePlus, label: 'New Chat', href: '/chat/new' },
  { icon: Star, label: 'Favorites', href: '/favorites' },
  { icon: ImageIcon, label: 'Media', href: '/media' },
  { icon: History, label: 'History', href: '/history' },
  { icon: Download, label: 'Downloads', href: '/downloads' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  return (
    <aside className="w-20 h-full bg-white border-r border-[#E8ECEF] flex flex-col items-center py-4">
      {sidebarItems.map((item, index) => {
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className="w-12 h-12 mb-2 flex items-center justify-center rounded-lg hover:bg-[#F8F9FB] transition-colors"
          >
            <Icon className="w-6 h-6 text-[#6C727F]" />
          </Link>
        )
      })}
    </aside>
  )
}
