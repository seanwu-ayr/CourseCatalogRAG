import { Chatpage } from "@/components/chatpage"
import NotAuthorized from "@/components/ui/error"
import { auth } from "@/auth"
import { useSession } from "next-auth/react"

export default async function Home() {
  const session = await auth()
  console.log(session)
  if (!session)
  {
    return (<><NotAuthorized/></>)
  }
  return (
    <main className="">
      <Chatpage {...session} />
    </main>
  );
}
