'use client'

import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Gauge,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  PhoneCall,
  Search,
  Send,
  Settings,
  Sparkles,
  Tag,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export type DesignerIconName =
  | 'dashboard'
  | 'chat'
  | 'whatsapp'
  | 'bot'
  | 'users'
  | 'crm'
  | 'campaign'
  | 'marketing'
  | 'calendar'
  | 'coupon'
  | 'affiliates'
  | 'payment'
  | 'settings'
  | 'bell'
  | 'chevronDown'
  | 'search'
  | 'logout'
  | 'menu'
  | 'book'

const icons: Record<DesignerIconName, LucideIcon> = {
  dashboard: LayoutGrid,
  chat: MessageCircle,
  whatsapp: PhoneCall,
  bot: Sparkles,
  users: UsersRound,
  crm: BriefcaseBusiness,
  campaign: Send,
  marketing: Megaphone,
  calendar: CalendarDays,
  coupon: Tag,
  affiliates: UserRoundPlus,
  payment: CreditCard,
  settings: Settings,
  bell: Bell,
  chevronDown: ChevronDown,
  search: Search,
  logout: LogOut,
  menu: Menu,
  book: BookOpen,
}

export function DesignerIcon({
  name,
  size = 18,
  color = 'currentColor',
  className,
}: {
  name: DesignerIconName
  size?: number
  color?: string
  className?: string
}) {
  const Icon = icons[name] ?? Gauge
  return (
    <Icon
      size={size}
      color={color}
      strokeWidth={1.85}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
      className={className}
    />
  )
}
