import React from 'react'
import Link from "next/link"
import { BarChart, FileText, Layout, RocketIcon, Settings } from "lucide-react"

const Sidebar = () => {
  return (
        <nav className="mt-6">
            <Link href="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                <BarChart className="w-5 h-5 mr-3 text-scuBrandRed" />
                Analytics
            </Link>
            <Link href="/documents" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                <FileText className="w-5 h-5 mr-3 text-scuBrandRed" />
                Document Store
            </Link>
            <Link href="/configuration" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                <Settings className="w-5 h-5 mr-3 text-scuBrandRed" />
                Configuration
            </Link>
            <Link href="/preview" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                <Layout className="w-5 h-5 mr-3 text-scuBrandRed" />
                Preview
            </Link>
            <Link href="/launch" className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-50">
                <RocketIcon className="w-5 h-5 mr-3 text-scuBrandRed" />
                Launch
            </Link>
        </nav>
  )
}

export default Sidebar