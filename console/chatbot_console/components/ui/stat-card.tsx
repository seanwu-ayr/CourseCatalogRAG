import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

const StatCard = (props) => {
  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{props.statName}</CardTitle>
            {props.Icon}
        </CardHeader>

        <CardContent>
            <div className="text-2xl font-bold">{props.statVal}</div>
            <p className="text-xs text-muted-foreground">{props.statComment}</p>
        </CardContent>
    </Card>
  )
}

export default StatCard