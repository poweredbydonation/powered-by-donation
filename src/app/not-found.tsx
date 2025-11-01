import { redirect } from 'next/navigation'

export default function NotFound() {
  // This runs on the server and immediately redirects
  redirect('/en')
}