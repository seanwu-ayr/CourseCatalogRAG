
import "./globals.css";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart, Bot, FileText, Layout, LogOut, MessageSquare, RocketIcon, Settings, User } from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Chatbot Console</h2>
          <p className="text-sm text-blue-100">Santa Clara University</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@johndoe" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">john.doe@acmeuniversity.edu</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <nav className="mt-6">
            <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
              <BarChart className="w-5 h-5 mr-3 text-blue-600" />
              Analytics
            </Link>
            <Link href="/documents" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
              <FileText className="w-5 h-5 mr-3 text-blue-600" />
              Document Store
            </Link>
            <Link href="/configuration" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
              <Settings className="w-5 h-5 mr-3 text-blue-600" />
              Configuration
            </Link>
            <Link href="/preview" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
              <Layout className="w-5 h-5 mr-3 text-blue-600" />
              Preview
            </Link>
            <Link href="/launch" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
              <RocketIcon className="w-5 h-5 mr-3 text-blue-600" />
              Launch
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
      </body>
    </html>
  )
}
