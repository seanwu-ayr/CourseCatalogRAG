import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Conversation } from "@/lib/definitions";


export default function ChatTab({user, id, started_at, ended_at} : Conversation){
    console.log("user: ", user)
    console.log("id: ", id)
    const redirect_url = "conversations/" + id
    return(
        <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href={redirect_url} className="truncate font-medium" prefetch={false}>
                {"Conversation " + id + " from user " + user}
              </Link>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">{started_at}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <MoveHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
    )
}

function MoveHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 8 22 12 18 16" />
        <polyline points="6 8 2 12 6 16" />
        <line x1="2" x2="22" y1="12" y2="12" />
      </svg>
    )
  }