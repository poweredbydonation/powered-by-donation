interface PlatformAccessGuardProps {
  children: React.ReactNode
}

// Platform access guard is no longer needed - all users can access all services
export default function PlatformAccessGuard({ children }: PlatformAccessGuardProps) {
  return <>{children}</>
}