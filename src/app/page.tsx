import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()

  // If logged in, redirect to dashboard
  if (session?.user) {
    redirect('/dashboard')
  }

  // If not logged in, redirect to login
  redirect('/login')
}
