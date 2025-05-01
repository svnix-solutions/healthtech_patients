import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk'
import { format } from 'date-fns'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface Practitioner {
  name: string
  practitioner_name: string
  department: string
  image?: string
}

interface TimeSlot {
  name: string
  day: string
  from_time: string
  to_time: string
  duration: number
  maximum_appointments: number
}

interface SlotDetails {
  slot_name: string
  service_unit: string
  avail_slot: TimeSlot[]
  appointments: any[]
  allow_overlap: number
  service_unit_capacity: number
  tele_conf: number
}

interface ApiResponse<T> {
  message: T
}

interface AvailabilityResponse {
  slot_details: SlotDetails[]
  fee_validity: string
}

export function BookAppointment() {
  const { patientId } = useParams()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { currentUser, isLoading } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedPractitioner, setSelectedPractitioner] = useState<Practitioner | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  if (!currentUser) {
    navigate("/login")
  }

  const { data: practitionersData, isLoading: isLoadingPractitioners } = useFrappeGetCall<ApiResponse<Practitioner[]>>(
    'healthtech_patients.healthtech_patients.patient.get_practitioners'
  )

  const { data: slotsData, isLoading: isLoadingSlots, mutate: mutateSlots } = useFrappeGetCall<ApiResponse<AvailabilityResponse>>(
    'healthcare.healthcare.doctype.patient_appointment.patient_appointment.get_availability_data',
    { 
      practitioner: selectedPractitioner?.name || "Dummy Practitioner",
      date: selectedDate || "2025-05-01",
      appointment: {
        "doctype":"Patient Appointment",
        "appointment_for":"Practitioner",
        "patient":"Anita Srivastava",
        "patient_name":"Anita Srivastava",
        "patient_sex":"Female",
        "practitioner":"HLC-PRAC-2025-00002",
        "practitioner_name":"Vishal Sharma",
        "department":"Microbiology",
        "appointment_type":"Regular Check-up"
      }
    },
    { enabled: !!selectedPractitioner && !!selectedDate }
  )
  
  const { call: bookAppointment, loading: isBookingAppointment } = useFrappePostCall(
    'healthtech_patients.healthtech_patients.patient.book_appointment'
  )

  if (isLoading || isLoadingPractitioners) {
    return <div>Loading...</div>
  }

  const practitioners = practitionersData?.message?.data || []
  const slotDetails = slotsData?.message?.slot_details || []

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handlePractitionerSelect = (practitioner: Practitioner) => {
    setSelectedPractitioner(practitioner)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleBookAppointment = async () => {
    if (!selectedPractitioner || !selectedSlot) return

    try {
      const response = await bookAppointment({
        appointment_data: {
          patient: patientId,
          practitioner: selectedPractitioner.name,
          appointment_date: selectedDate,
          appointment_time: selectedSlot.from_time,
          department: selectedPractitioner.department
        }
      })
      
      if (response.message.status === "success") {
        toast({
          title: "Appointment Booked",
          description: "Your appointment has been successfully booked.",
        })
        navigate(`/patient/${patientId}`)
      } else {
        toast({
          title: "Error",
          description: response.message.message || "Failed to book appointment",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast({
        title: "Error",
        description: "An error occurred while booking the appointment.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(`/patient/${patientId}`)} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patient Details
        </Button>
        <h1 className="text-2xl font-bold">Book Appointment</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Practitioners List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Practitioner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {practitioners.map((practitioner: Practitioner) => (
                <div
                  key={practitioner.name}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPractitioner?.name === practitioner.name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                  onClick={() => handlePractitionerSelect(practitioner)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      {practitioner.image ? (
                        <img
                          src={practitioner.image}
                          alt={practitioner.practitioner_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{practitioner.practitioner_name}</h3>
                      <p className="text-sm text-gray-500">{practitioner.department}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date and Time Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Select Date and Time</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPractitioner ? (
              <div className="space-y-6">
                {/* Date Selection */}
                <div>
                  <h3 className="font-semibold mb-2">Select Date</h3>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full p-2 rounded border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div>
                    <h3 className="font-semibold mb-2">Available Time Slots</h3>
                    {isLoadingSlots ? (
                      <div>Loading available slots...</div>
                    ) : slotDetails.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {slotDetails.map((slotDetail) => (
                          slotDetail.avail_slot.map((slot) => (
                            <div
                              key={slot.name}
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                selectedSlot?.name === slot.name
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-blue-200'
                              }`}
                              onClick={() => handleSlotSelect(slot)}
                            >
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{slot.from_time} - {slot.to_time}</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {slotDetail.service_unit}
                              </div>
                            </div>
                          ))
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500">No available slots for this date</div>
                    )}
                  </div>
                )}

                {/* Book Button */}
                {selectedSlot && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleBookAppointment}
                      disabled={isBookingAppointment}
                    >
                      {isBookingAppointment ? "Booking..." : "Book Appointment"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Please select a practitioner first</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 