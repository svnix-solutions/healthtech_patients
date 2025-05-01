import frappe
from frappe import _

@frappe.whitelist()
def get_patients_for_customer():
    """
    Get list of patients attached to the current customer
    """
    try:
        # Get current user
        current_user = frappe.session.user
        print(current_user)
        
        # Get customer linked to current user
        contact = frappe.get_doc("Contact", {"user": current_user})
        
        if not contact:
            return {
                "status": "error",
                "message": "No contact found for current user"
            }
            
        patients = []
        for link in contact.links:
            if link.link_doctype == "Patient":
                patient_details = frappe.get_doc("Patient", link.link_name)
                patients.append({
                    "name": patient_details.name,
                    "patient_name": patient_details.patient_name,
                    "mobile": patient_details.mobile,
                    "sex": patient_details.sex,
                    "dob": patient_details.dob,
                    "email": patient_details.email
                })

        # # Get all patients linked to this customer
        # patients = frappe.get_all(
        #     "Patient",
        #     filters={"parent": contact},
        #     fields=["name", "patient_name", "mobile", "email", "sex", "dob"]
        # )
        
        return {
            "status": "success",
            "data": patients
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_patients_for_customer")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def create_patient(patient_data):
    """
    Create a new patient for the current customer
    
    Args:
        patient_data (dict): Dictionary containing patient information
            Required fields:
                - patient_name
                - mobile
                - gender
                - dob
            Optional fields:
                - email
                - profile_pic
    """
    try:
        # Get current user
        current_user = frappe.session.user
        
        # Get customer linked to current user
        contact = frappe.get_doc("Contact", {"user": current_user})
        print(contact)

        if not contact:
            return {
                "status": "error",
                "message": "No contact found for current user"
            }
        
        # Find customer from contact links
        contact_links = frappe.get_all(
            "Dynamic Link",
            filters={
                "parenttype": "Contact",
                "parent": contact.name,
                "link_doctype": "Customer"
            },
            fields=["link_name"]
        )
        
        if not contact_links:
            return {
                "status": "error",
                "message": "No customer linked to the current contact"
            }
        
        customer = frappe.get_doc("Customer", contact_links[0].link_name)
            
        # Parse patient data
        if isinstance(patient_data, str):
            patient_data = frappe.parse_json(patient_data)
            
        # Validate required fields
        required_fields = ["first_name", "last_name", "mobile", "sex", "dob"]
        for field in required_fields:
            if field not in patient_data:
                return {
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }
                
        # Create new patient
        patient = frappe.get_doc({
            "doctype": "Patient",
            "first_name": patient_data.get("first_name"),
            "last_name": patient_data.get("last_name"),
            "mobile": patient_data.get("mobile"),
            "email": patient_data.get("email"),
            "sex": patient_data.get("sex"),
            "dob": patient_data.get("dob"),
            "invite_user": 0,
            # "profile_pic": patient_data.get("profile_pic"),
            "customer": customer.name
        })
        
        patient.insert(ignore_permissions=True)
        
        return {
            "status": "success",
            "message": "Patient created successfully",
            "data": {
                "name": patient.name,
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "mobile": patient.mobile,
                "email": patient.email,
                "sex": patient.sex,
                "dob": patient.dob,
                # "profile_pic": patient.profile_pic
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in create_patient")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_patient(patient_id):
    """
    Get details of a specific patient
    """
    try:
        patient = frappe.get_doc("Patient", patient_id)
        
        return {
            "status": "success",
            "data": {
                "name": patient.name,
                "patient_name": patient.patient_name,
                "mobile": patient.mobile,
                "sex": patient.sex,
                "dob": patient.dob,
                "email": patient.email
            }
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_patient")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_patient_appointments(patient_id):
    """
    Get all appointments for a specific patient
    """
    try:
        appointments = frappe.get_all(
            "Patient Appointment",
            filters={"patient": patient_id},
            fields=["name", "appointment_date", "appointment_time", "status", 
                   "practitioner_name", "department", "notes"],
            order_by="appointment_date desc"
        )

        return {
            "status": "success",
            "data": appointments
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_patient_appointments")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_patient_history(patient_id):
    """
    Get history of a specific patient including appointments, consultations, and other events
    """
    try:
        # Get patient's document history
        history = frappe.get_all(
            "Version",
            filters={
                "ref_doctype": "Patient",
                "docname": patient_id
            },
            fields=["name", "creation", "modified", "modified_by", "data"],
            order_by="creation desc"
        )
        
        # Process history entries
        processed_history = []
        for entry in history:
            data = frappe.parse_json(entry.data)
            if data:
                # Get the type of change
                change_type = "Updated"
                if "added" in data:
                    change_type = "Added"
                elif "removed" in data:
                    change_type = "Removed"
                
                # Get the changed fields
                changed_fields = []
                if "changed" in data:
                    changed_fields = list(data["changed"].keys())
                elif "added" in data:
                    changed_fields = list(data["added"].keys())
                elif "removed" in data:
                    changed_fields = list(data["removed"].keys())
                
                description = f"{change_type} {', '.join(changed_fields)}"
                
                processed_history.append({
                    "name": entry.name,
                    "creation": entry.creation,
                    "modified": entry.modified,
                    "modified_by": entry.modified_by,
                    "type": change_type,
                    "description": description
                })
        
        # Get appointment history
        appointments = frappe.get_all(
            "Patient Appointment",
            filters={"patient": patient_id},
            fields=["name", "creation", "modified", "modified_by", "status"],
            order_by="creation desc"
        )
        
        for appointment in appointments:
            processed_history.append({
                "name": appointment.name,
                "creation": appointment.creation,
                "modified": appointment.modified,
                "modified_by": appointment.modified_by,
                "type": "Appointment",
                "description": f"Appointment status changed to {appointment.status}"
            })
        
        # Sort all history entries by creation date
        processed_history.sort(key=lambda x: x["creation"], reverse=True)
        
        return {
            "status": "success",
            "data": processed_history
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_patient_history")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def book_appointment(appointment_data):
    """
    Book a new appointment for a patient
    
    Args:
        appointment_data (dict): Dictionary containing appointment information
            Required fields:
                - patient
                - appointment_date
                - appointment_time
                - practitioner
                - department
            Optional fields:
                - notes
    """
    try:
        # Parse appointment data
        if isinstance(appointment_data, str):
            appointment_data = frappe.parse_json(appointment_data)
            
        # Validate required fields
        required_fields = ["patient", "appointment_date", "appointment_time", "practitioner", "department"]
        for field in required_fields:
            if field not in appointment_data:
                return {
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }
                
        # Create new appointment
        appointment = frappe.get_doc({
            "doctype": "Patient Appointment",
            "patient": appointment_data.get("patient"),
            "appointment_date": appointment_data.get("appointment_date"),
            "appointment_time": appointment_data.get("appointment_time"),
            "practitioner": appointment_data.get("practitioner"),
            "department": appointment_data.get("department"),
            "notes": appointment_data.get("notes", ""),
            "appointment_for": "Practitioner",
            "appointment_type": "Regular Check-up",
            "status": "Scheduled"
        })
        
        appointment.insert(ignore_permissions=True)
        
        return {
            "status": "success",
            "message": "Appointment booked successfully",
            "data": {
                "name": appointment.name,
                "appointment_date": appointment.appointment_date,
                "appointment_time": appointment.appointment_time,
                "practitioner": appointment.practitioner,
                "department": appointment.department,
                "notes": appointment.notes,
                "status": appointment.status
            }
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in book_appointment")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_practitioners():
    """
    Get list of all practitioners with their departments
    """
    try:
        practitioners = frappe.get_all(
            "Healthcare Practitioner",
            fields=["name", "practitioner_name", "department", "image"],
            filters={"status": "Active"}
        )
        
        return {
            "status": "success",
            "data": practitioners
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_practitioners")
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist()
def get_available_slots(practitioner, date):
    """
    Get available time slots for a practitioner on a specific date
    
    Args:
        practitioner (str): Name of the practitioner
        date (str): Date in YYYY-MM-DD format
    """
    try:
        # Get practitioner's working hours
        practitioner_doc = frappe.get_doc("Practitioner Schedule", practitioner)
        working_hours = practitioner_doc.working_hours
        
        # Get existing appointments for the day
        existing_appointments = frappe.get_all(
            "Patient Appointment",
            filters={
                "practitioner": practitioner,
                "appointment_date": date,
                "status": ["in", ["Scheduled", "Open"]]
            },
            fields=["appointment_time"]
        )
        
        # Generate time slots (assuming 30-minute slots)
        slots = []
        for hour in range(9, 17):  # 9 AM to 5 PM
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                
                # Check if slot is already booked
                is_booked = any(
                    app.appointment_time == time_str 
                    for app in existing_appointments
                )
                
                slots.append({
                    "date": date,
                    "time": time_str,
                    "duration": 30,
                    "is_available": not is_booked
                })
        
        return {
            "status": "success",
            "data": slots
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_available_slots")
        return {
            "status": "error",
            "message": str(e)
        }
