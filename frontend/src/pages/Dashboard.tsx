import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { PlusCircle, UserPlus } from "lucide-react"
import { useState } from "react"

interface Patient {
  id: string
  name: string
  avatar: string
}

export function Dashboard() {
  const { currentUser, isLoading } = useAuth()
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [showAddPatient, setShowAddPatient] = useState(false)
  const [newPatientName, setNewPatientName] = useState("")

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!currentUser) {
    navigate("/login")
  }

  const handleAddPatient = () => {
    if (newPatientName.trim()) {
      const newPatient: Patient = {
        id: Date.now().toString(),
        name: newPatientName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newPatientName}`,
      }
      setPatients([...patients, newPatient])
      setNewPatientName("")
      setShowAddPatient(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Patient Profiles</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {patients.map((patient) => (
            <div
              key={patient.id}
              className="group cursor-pointer"
              onClick={() => navigate(`/patient/${patient.id}`)}
            >
              <div className="relative">
                <img
                  src={patient.avatar}
                  alt={patient.name}
                  className="w-full aspect-square rounded-lg group-hover:border-4 group-hover:border-blue-500 transition-all duration-300"
                />
                {/* <div className="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg" /> */}
              </div>
              <p className="text-center mt-4 text-xl group-hover:text-blue-600 transition-colors">
                {patient.name}
              </p>
            </div>
          ))}
          
          <div
            className="group cursor-pointer"
            onClick={() => setShowAddPatient(true)}
          >
            <div className="relative">
              <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center group-hover:border-blue-500 transition-all duration-300">
                <PlusCircle className="w-16 h-16 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
            <p className="text-center mt-4 text-xl text-gray-400 group-hover:text-blue-600 transition-colors">
              Add Patient
            </p>
          </div>
        </div>

        {showAddPatient && (
          <div className="fixed inset-0 bg-white/90 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddPatient(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddPatient}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Patient
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 