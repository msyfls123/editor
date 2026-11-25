import type { AuthUser } from '@ebichu-cc/auth'
import { avatarFor } from '@ebichu-cc/auth'
import { FolderOpen, LogIn, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { goToLogin } from '@/lib/auth-login'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from './AuthProvider'

function UserAvatar({ user }: { user: AuthUser }) {
  const { bgColor, initial } = avatarFor(user.email)

  return (
    <span
      aria-hidden="true"
      className="flex size-8 items-center justify-center rounded-full text-sm font-semibold text-black select-none"
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </span>
  )
}

export function AuthMenu() {
  const { state, loggingOut, logout } = useAuth()

  if (state.status === 'loading') {
    return (
      <span
        aria-label="正在读取登录状态"
        className="block size-8 animate-pulse rounded-full bg-muted"
      />
    )
  }

  if (state.status === 'anonymous') {
    return (
      <Button variant="outline" onClick={goToLogin}>
        <LogIn />
        登录
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="账户菜单"
          />
        }
      >
        <UserAvatar user={state.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {state.user.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<a href="/resources" />}>
          <FolderOpen />
          资源库
        </DropdownMenuItem>
        <DropdownMenuItem disabled={loggingOut} onClick={logout}>
          <LogOut />
          {loggingOut ? '退出中…' : '退出登录'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
