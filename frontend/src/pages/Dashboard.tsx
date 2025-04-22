import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

export function Dashboard() {
  const { currentUser, isLoading } = useAuth()
  const navigate = useNavigate()

  
    if (isLoading) {
      return <div>Loading...</div>
    }

  if (!currentUser) {
    navigate("/login")
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {currentUser}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are logged in to the system.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 