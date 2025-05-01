import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Stethoscope, PlusCircle } from "lucide-react"
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { format } from 'date-fns'
import { useState } from 'react'

interface Patient {
  name: string
  patient_name: string
  mobile: string
  sex: string
  dob: string
  email?: string
}

interface Appointment {
  name: string
  appointment_date: string
  appointment_time: string
  status: string
  practitioner_name: string
  department: string
  notes?: string
}

interface PatientHistory {
  name: string
  creation: string
  modified: string
  modified_by: string
  type: string
  description: string
}

interface ApiResponse<T> {
  message: T
}

export function PatientDetails() {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const { currentUser, isLoading } = useAuth()
  const [showBookAppointment, setShowBookAppointment] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    appointment_date: "",
    appointment_time: "",
    practitioner_name: "",
    department: "",
    notes: ""
  })

  if (!currentUser) {
    navigate("/login")
  }

  const { data: patientData, isLoading: isLoadingPatient } = useFrappeGetCall<ApiResponse<Patient>>(
    'healthtech_patients.healthtech_patients.patient.get_patient',
    { patient_id: patientId }
  )

  const { data: appointmentData, isLoading: isLoadingAppointments, mutate: mutateAppointments } = useFrappeGetCall<ApiResponse<Appointment[]>>(
    'healthtech_patients.healthtech_patients.patient.get_patient_appointments',
    { patient_id: patientId }
  )

  const { data: historyData, isLoading: isLoadingHistory } = useFrappeGetCall<ApiResponse<PatientHistory[]>>(
    'healthtech_patients.healthtech_patients.patient.get_patient_history',
    { patient_id: patientId }
  )

  const { call: bookAppointment, loading: isBookingAppointment } = useFrappePostCall(
    'healthtech_patients.healthtech_patients.patient.book_appointment'
  )

  if (isLoading || isLoadingPatient || isLoadingAppointments || isLoadingHistory) {
    return <div>Loading...</div>
  }

  const patient = patientData?.message?.data
  const appointments = appointmentData?.message?.data || []
  const history = historyData?.message?.data || []

  const currentAppointment = appointments.find((app: Appointment) => app.status === 'Scheduled' || app.status === 'Open')

  const handleBookAppointment = async () => {
    try {
      const response = await bookAppointment({
        appointment_data: {
          patient: patientId,
          ...newAppointment
        }
      })
      
      if (response.message.status === "success") {
        setShowBookAppointment(false)
        setNewAppointment({
          appointment_date: "",
          appointment_time: "",
          practitioner_name: "",
          department: "",
          notes: ""
        })
        // Reload appointments data after successful booking
        mutateAppointments?.()
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Patient Details</h1>
        </div>
        <Button onClick={() => navigate(`/patient/${patientId}/book`)}>
          Book Appointment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Name</h3>
                <p>{patient?.patient_name}</p>
              </div>
              <div>
                <h3 className="font-semibold">Date of Birth</h3>
                <p>{/* format(new Date(patient?.dob || ''), 'MMMM d, yyyy')*/} {patient?.dob}</p>
              </div>
              <div>
                <h3 className="font-semibold">Gender</h3>
                <p>{patient?.sex}</p>
              </div>
              <div>
                <h3 className="font-semibold">Contact Information</h3>
                <p>Phone: {patient?.mobile}</p>
                {patient?.email && <p>Email: {patient?.email}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Appointment */}
        <Card>
          <CardHeader>
            <CardTitle>Current Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAppointment ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{/* format(new Date(currentAppointment.appointment_date), 'MMMM d, yyyy')*/} {currentAppointment.appointment_date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{currentAppointment.appointment_time}</span>
                </div>
                <div className="flex items-center">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  <span>{currentAppointment.practitioner_name}</span>
                </div>
                <div>
                  <h3 className="font-semibold">Department</h3>
                  <p>{currentAppointment.department}</p>
                </div>
                {currentAppointment.notes && (
                  <div>
                    <h3 className="font-semibold">Notes</h3>
                    <p>{currentAppointment.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No current appointment scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Book Appointment Modal */}
      {showBookAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Book New Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newAppointment.appointment_date}
                    onChange={(e) => setNewAppointment({...newAppointment, appointment_date: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newAppointment.appointment_time}
                    onChange={(e) => setNewAppointment({...newAppointment, appointment_time: e.target.value})}
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Practitioner</label>
                  <input
                    type="text"
                    value={newAppointment.practitioner_name}
                    onChange={(e) => setNewAppointment({...newAppointment, practitioner_name: e.target.value})}
                    placeholder="Enter practitioner name"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newAppointment.department}
                    onChange={(e) => setNewAppointment({...newAppointment, department: e.target.value})}
                    placeholder="Enter department"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newAppointment.notes}
                    onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                    placeholder="Enter any additional notes"
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowBookAppointment(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBookAppointment}
                    disabled={isBookingAppointment}
                  >
                    {isBookingAppointment ? "Booking..." : "Book Appointment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patient History Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Patient History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {history.map((event, index) => (
              <div key={event.name} className="flex mb-6">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  {index !== history.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{event.type}</h3>
                    <span className="text-sm text-gray-500">
                      {/* format(new Date(event.creation), 'MMM d, yyyy h:mm a')*/} {event.creation}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{event.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Modified by: {event.modified_by}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 