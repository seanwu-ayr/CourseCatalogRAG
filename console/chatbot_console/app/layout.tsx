import "./globals.css";
import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";

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
          <header className="bg-scuBrandRed text-white p-4 flex justify-between items-center">
            <Header></Header>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-md">
              <Sidebar></Sidebar>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-8 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
