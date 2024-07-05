/**
 * v0 by Vercel.
 * @see https://v0.dev/t/IeBt3KbMHdr
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export default function Component() {
  return (
    <div className="flex h-screen w-full flex-row bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-full flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold">You</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Hi there! I have a few questions about registering for classes, setting up my school Zoom account,
                    and applying for scholarships. Can you help me with that?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold">SCU Chatbot</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Absolutely, I'd be happy to help you with those topics. Let's start with class registration. The
                    best time to register for classes is during your assigned registration window, which is based on
                    your class standing and other factors. You can find your specific registration window on the
                    Registrar's website.
                  </p>
                  <p>
                    As for setting up your Zoom account, you'll need to log into the SCU portal and navigate to the Zoom
                    integration. There you can activate your account and set up your profile.
                  </p>
                  <p>
                    For scholarships, SCU offers a variety of merit-based and need-based options. I'd recommend checking
                    the Financial Aid website to see what's available and the application deadlines. Let me know if you
                    have any other questions!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold">You</div>
                <div className="prose text-muted-foreground">
                  <p>
                    That's really helpful, thank you! I'm especially interested in the scholarship information. Can you
                    give me more details on the types of scholarships available and the application process?
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Avatar className="w-8 h-8 border">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>OA</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-bold">SCU Chatbot</div>
                <div className="prose text-muted-foreground">
                  <p>
                    Sure, let me provide more details on the scholarship opportunities at SCU. We offer both merit-based
                    and need-based scholarships. The merit-based scholarships are awarded based on academic achievement,
                    leadership, and other accomplishments. These include the Presidential Scholarship, Provost
                    Scholarship, and various departmental scholarships.
                  </p>
                  <p>
                    The need-based scholarships are awarded based on your family's financial situation. To apply for
                    these, you'll need to complete the FAFSA (Free Application for Federal Student Aid) and the SCU
                    Supplemental Scholarship Application. The deadlines for these are typically in early spring, so I'd
                    recommend starting the process as soon as possible.
                  </p>
                  <p>
                    The application process involves submitting transcripts, letters of recommendation, and a personal
                    statement. The Financial Aid office is also available to help you throughout the process if you have
                    any questions. Let me know if you need any clarification or have additional questions!
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Textarea
              placeholder="Type your message..."
              className="flex-1 rounded-2xl border border-neutral-400 p-2 shadow-sm resize-none"
              rows={1}
            />
            <Button type="submit" size="icon" className="rounded-full bg-primary text-primary-foreground">
              <SendIcon className="h-5 w-5" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col border-l bg-muted p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Conversations</h3>
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search conversations..."
              className="rounded-lg bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <Button variant="ghost" size="sm" className="bg-black text-white flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              <span>Start New</span>
            </Button>
          </div>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Class Registration
              </Link>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">2h ago</div>
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
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Zoom Account Setup
              </Link>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">1d ago</div>
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
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Scholarship Application
              </Link>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">3d ago</div>
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
          </div>
        </div>
        <Separator className="my-4" />
        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <div className="flex items-center justify-center rounded-md px-3 py-2 hover:bg-background">
              <div className="font-medium">Resources</div>
            </div>
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Class Registration Information
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Zoom Account Setup
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-background">
              <Link href="#" className="truncate font-medium" prefetch={false}>
                Scholarship Application Information
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Avatar className="w-8 h-8 border">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>YO</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">John Doe</div>
            <div className="text-xs text-muted-foreground">john@example.com</div>
          </div>
        </div>
      </div>
      <div className="relative h-4 cursor-col-resize border-l border-r border-muted-foreground/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </div>
    </div>
  )
}

function GripVerticalIcon(props) {
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
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  )
}


function MoveHorizontalIcon(props) {
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


function PlusIcon(props) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}


function SendIcon(props) {
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
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}