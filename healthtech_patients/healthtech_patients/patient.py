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
