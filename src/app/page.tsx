import { redirect } from 'next/navigation'

// Root redirects to admin
export default function Home() {
  redirect('/admin')
}
