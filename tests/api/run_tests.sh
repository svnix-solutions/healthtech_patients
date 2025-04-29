#!/bin/bash

# Set environment variables
export base_url=http://localhost:8000
export auth_token=NDg2OTgyN2UzMzYwYzI2OjUxZjc5Mzk5ZTVkOWY0MQ==

echo "Running Get Patients API Tests..."
echo "--------------------------------"

# Test 1: Get Patients with valid auth
echo "Test 1: Get Patients with valid auth"
http --env=httpie.env "{{base_url}}/api/method/healthtech_patients.healthtech_patients.patient.get_patients_for_customer" "Authorization:Bearer {{auth_token}}" "Accept:application/json"

# Test 2: Get Patients without auth
echo -e "\nTest 2: Get Patients without auth"
http --env=httpie.env "{{base_url}}/api/method/healthtech_patients.healthtech_patients.patient.get_patients_for_customer" "Accept:application/json"

echo -e "\nRunning Create Patient API Tests..."
echo "-----------------------------------"

# Test 3: Create Patient with valid data
echo "Test 3: Create Patient with valid data"
http --env=httpie.env POST "{{base_url}}/api/method/healthtech_patients.healthtech_patients.patient.create_patient" "Authorization:Bearer {{auth_token}}" "Content-Type:application/json" "Accept:application/json" patient_data:='{"patient_name":"Test Patient","mobile":"9876543210","gender":"Male","dob":"1990-01-01","email":"test@example.com","profile_pic":"/files/test.jpg"}'

# Test 4: Create Patient with missing fields
echo -e "\nTest 4: Create Patient with missing fields"
http --env=httpie.env POST "{{base_url}}/api/method/healthtech_patients.healthtech_patients.patient.create_patient" "Authorization:Bearer {{auth_token}}" "Content-Type:application/json" "Accept:application/json" patient_data:='{"patient_name":"Test Patient","mobile":"9876543210"}'

# Test 5: Create Patient without auth
echo -e "\nTest 5: Create Patient without auth"
http --env=httpie.env POST "{{base_url}}/api/method/healthtech_patients.healthtech_patients.patient.create_patient" "Content-Type:application/json" "Accept:application/json" patient_data:='{"patient_name":"Test Patient","mobile":"9876543210","gender":"Male","dob":"1990-01-01"}' 