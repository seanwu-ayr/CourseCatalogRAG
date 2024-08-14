import Link from 'next/link'


export default function NotAuthorized() {
  return <div>
      <h1>Not Authorized – 401</h1>
      <div>
        <Link href="/auth/login">Log In</Link>
      </div>
  </div>
}