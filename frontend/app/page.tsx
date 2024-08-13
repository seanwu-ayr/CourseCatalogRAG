import { Chatpage } from "@/components/chatpage"
import NotAuthorized from "@/components/ui/error"
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()
  console.log(session)
  if (!session)
  {
    return (<><NotAuthorized/></>)
  }
  return (
    <main className="">
      <Chatpage />
    </main>
  );
}
