'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bot, FileText, MessageSquare } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

import StatCard from "@/components/ui/stat-card"

const conversationData = [
  { name: 'Mon', conversations: 120 },
  { name: 'Tue', conversations: 140 },
  { name: 'Wed', conversations: 180 },
  { name: 'Thu', conversations: 190 },
  { name: 'Fri', conversations: 220 },
  { name: 'Sat', conversations: 150 },
  { name: 'Sun', conversations: 130 },
]

const satisfactionData = [
  { name: 'Mon', satisfaction: 85 },
  { name: 'Tue', satisfaction: 88 },
  { name: 'Wed', satisfaction: 87 },
  { name: 'Thu', satisfaction: 90 },
  { name: 'Fri', satisfaction: 89 },
  { name: 'Sat', satisfaction: 91 },
  { name: 'Sun', satisfaction: 92 },
]

const messageSquareIcon = <MessageSquare className="h-4 w-4 text-scuBrandRed" />
const botIcon = <Bot className="h-4 w-4 text-scuBrandRed" />
const fileTextIcon = <FileText className="h-4 w-4 text-scuBrandRed" />
const barChartIcon = <BarChart className="h-4 w-4 text-scuBrandRed" />
  
export default function Home() {

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to SCU Chatbot Console</h1>
      </div>

      <p className="text-gray-600 mb-8">
        Manage and monitor Santa Clara&apos;s custom chatbot from this central dashboard.
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard statName="Total Conversations" statVal="1,234" statComment="+10% from last month" Icon={messageSquareIcon}></StatCard>
        <StatCard statName="Avg. Response Time" statVal="1.5s" statComment="-0.2s from last week" Icon={botIcon}></StatCard>
        <StatCard statName="Documents Uploaded" statVal="42" statComment="+3 new this week" Icon={fileTextIcon}></StatCard>
        <StatCard statName="User Satisfaction" statVal="89%" statComment="+2% from last month" Icon={barChartIcon}></StatCard>
      </div>

      {/* Analytics Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={conversationData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="conversations" stroke="#b30738" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Satisfaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={satisfactionData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="satisfaction" stroke="#b30738" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}