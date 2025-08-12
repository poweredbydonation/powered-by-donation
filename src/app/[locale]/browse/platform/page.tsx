import { redirect } from 'next/navigation'

interface PlatformSelectionPageProps {
  params: {
    locale: string
  }
}

export default function PlatformSelectionRedirect({ params }: PlatformSelectionPageProps) {
  // Redirect to browse page since platform selection is no longer needed
  redirect(`/${params.locale}/browse`)
}