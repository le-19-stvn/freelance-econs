import { redirect } from 'next/navigation'

// This page is superseded by /profile (everything is now consolidated there).
// We keep a server redirect so any old bookmarks, emails or external links still work.
export default function ParametresPage() {
  redirect('/profile')
}
