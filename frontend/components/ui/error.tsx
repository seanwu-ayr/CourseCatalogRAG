import Link from 'next/link'


export default function NotAuthorized() {
  return <div>
      <h1>Not found – 401 - Not Authorized!</h1>
      <div>
        <Link href="/auth/login">Log In</Link>
      </div>
  </div>
}