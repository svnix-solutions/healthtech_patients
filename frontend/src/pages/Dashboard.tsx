import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { PlusCircle, UserPlus } from "lucide-react"
import { useState } from "react"
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'

interface Patient {
  name: string
  patient_name: string
  mobile: string
  sex: string
  dob: string
  email?: string
}

export function Dashboard() {
  const { currentUser, isLoading } = useAuth()
  const navigate = useNavigate()
  if (!currentUser) {
    navigate("/login")
  }

  const [showAddPatient, setShowAddPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    email: "",
    sex: "",
    dob: ""
  })

  const { data, error, isLoading: isLoadingPatients, mutate: reloadPatients } = useFrappeGetCall<{ message: { data: Patient[] } }>(
    'healthtech_patients.healthtech_patients.patient.get_patients_for_customer'
  )

  const { call: createPatient, loading: isCreatingPatient } = useFrappePostCall(
    'healthtech_patients.healthtech_patients.patient.create_patient'
  )

  if (isLoading || isLoadingPatients) {
    return <div>Loading...</div>
  }

  if (error) {
    console.error('Error fetching patients:', error)
    return <div>Error loading patients. Please try again later.</div>
  }

  const handleAddPatient = async () => {
    try {
      const response = await createPatient({
        patient_data: newPatient
      })
      
      if (response.message.status === "success") {
        setShowAddPatient(false)
        setNewPatient({
          first_name: "",
          last_name: "",
          mobile: "",
          email: "",
          sex: "",
          dob: ""
        })
        // Reload patients data after successful creation
        reloadPatients()
      }
    } catch (error) {
      console.error('Error creating patient:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Patient Profiles</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {data?.message?.data.map((patient) => (
            <div
              key={patient.name}
              className="group cursor-pointer"
              onClick={() => navigate(`/patient/${patient.name}`)}
            >
              <div className="relative">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.patient_name}`}
                  alt={patient.patient_name}
                  className="w-full aspect-square rounded-lg group-hover:border-4 group-hover:border-blue-500 transition-all duration-300"
                />
              </div>
              <p className="text-center mt-4 text-xl group-hover:text-blue-600 transition-colors">
                {patient.patient_name}
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
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newPatient.first_name}
                      onChange={(e) => setNewPatient({...newPatient, first_name: e.target.value})}
                      placeholder="First Name"
                      className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={newPatient.last_name}
                      onChange={(e) => setNewPatient({...newPatient, last_name: e.target.value})}
                      placeholder="Last Name"
                      className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={newPatient.sex}
                    onChange={(e) => setNewPatient({...newPatient, sex: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="date"
                    value={newPatient.dob}
                    onChange={(e) => setNewPatient({...newPatient, dob: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newPatient.mobile}
                    onChange={(e) => setNewPatient({...newPatient, mobile: e.target.value})}
                    placeholder="Mobile Number (optional)"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    placeholder="Email (optional)"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500">* Email and phone number are optional fields</p>
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
                      disabled={isCreatingPatient}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {isCreatingPatient ? "Adding..." : "Add Patient"}
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