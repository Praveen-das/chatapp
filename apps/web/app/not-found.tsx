import Link from 'next/link'
import { redirect } from 'next/navigation'
 
export default function NotFound() {
  // return redirect('/')
  return (
    <div>
      404 - Page Not Found
    </div>
  )
}