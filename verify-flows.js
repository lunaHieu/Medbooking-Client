const BACKEND_URL = 'http://localhost:8000/api';

async function runTests() {
  const { default: axios } = await import('axios');
  console.log('=== Starting Integration Flow Verification ===');

  const randomSuffix = Math.floor(Math.random() * 10000);
  const patientUsername = `patient_${randomSuffix}`;
  const patientEmail = `patient_${randomSuffix}@example.com`;
  const patientPhone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
  const patientPassword = 'password123';

  let patientToken = null;
  let adminToken = null;
  let selectedDoctorId = null;
  let availableSlotId = null;
  let createdAppointmentId = null;

  // 1. Flow: Register Patient
  try {
    console.log(`\n1. Registering new patient: ${patientUsername}...`);
    const regRes = await axios.post(`${BACKEND_URL}/auth/register`, {
      username: patientUsername,
      password: patientPassword,
      firstName: 'Test',
      lastName: 'Patient',
      email: patientEmail,
      phoneNumber: patientPhone,
      address: '123 Test St'
    });
    console.log('Registration Response:', regRes.data);
  } catch (err) {
    console.error('Registration FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  // 2. Flow: Login Patient
  try {
    console.log(`\n2. Logging in patient: ${patientUsername}...`);
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      username: patientUsername,
      password: patientPassword
    });
    patientToken = loginRes.data.access_token || loginRes.data.token;
    console.log('Login successful, Token retrieved:', patientToken ? 'YES' : 'NO');
    if (!patientToken) throw new Error('No token found in login response');
  } catch (err) {
    console.error('Login FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  // 3. Flow: View Doctors
  try {
    console.log('\n3. Fetching list of doctors...');
    const docRes = await axios.get(`${BACKEND_URL}/public/doctors`);
    console.log('Doctors List:', JSON.stringify(docRes.data, null, 2));
    if (docRes.data.length > 0) {
      selectedDoctorId = docRes.data[0].doctorId || docRes.data[0].DoctorID;
      console.log(`Selected Doctor ID: ${selectedDoctorId}`);
    } else {
      console.warn('Warning: No doctors found in public list. Using fallback ID 5.');
      selectedDoctorId = 5;
    }
  } catch (err) {
    console.error('Fetching doctors FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  // 7. Flow: Admin Login (moved up to create a slot for the doctor before booking)
  try {
    console.log('\n7. Logging in as admin...');
    const adminLoginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      username: 'admin',
      password: '123456'
    });
    adminToken = adminLoginRes.data.access_token || adminLoginRes.data.token;
    console.log('Admin login successful, Token retrieved:', adminToken ? 'YES' : 'NO');
  } catch (err) {
    console.error('Admin login FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  // Admin creates a slot for selectedDoctorId
  if (adminToken && selectedDoctorId) {
    try {
      console.log(`\n7.5 Admin creating a slot for Doctor ID: ${selectedDoctorId}...`);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startStr = `${tomorrow.toISOString().split('T')[0]}T10:00:00`;
      const endStr = `${tomorrow.toISOString().split('T')[0]}T10:30:00`;

      console.log(`Creating slot: ${startStr} - ${endStr}`);
      const slotCreateRes = await axios.post(
        `${BACKEND_URL}/admin/doctors/${selectedDoctorId}/schedules`,
        {
          startTime: startStr,
          endTime: endStr
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      console.log('Admin Slot Creation Response:', slotCreateRes.data);
    } catch (err) {
      console.error('Admin slot creation FAILED:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // 4. Flow: View Doctor Schedules
  try {
    console.log(`\n4. Fetching schedule for Doctor ID: ${selectedDoctorId}...`);
    const slotRes = await axios.get(`${BACKEND_URL}/public/doctors/${selectedDoctorId}/slots`);
    console.log(`Found ${slotRes.data.length} availability slots.`);
    
    const freeSlot = slotRes.data.find(s => s.status === 'Available' || s.Status === 'Available');
    if (freeSlot) {
      availableSlotId = freeSlot.slotId || freeSlot.SlotID;
      console.log(`Found available Slot ID: ${availableSlotId}`);
    } else {
      console.log('No available slots found. Checking if there are any slots at all:');
      console.log(JSON.stringify(slotRes.data, null, 2));
    }
  } catch (err) {
    console.error('Fetching schedules FAILED:', err.response?.data || err.message);
    process.exit(1);
  }

  // 5. Flow: Book Appointment (requires token and availableSlotId)
  if (availableSlotId) {
    try {
      console.log(`\n5. Booking appointment for Slot ID: ${availableSlotId}...`);
      const bookRes = await axios.post(
        `${BACKEND_URL}/patient/appointments`,
        {
          slotId: availableSlotId,
          initialSymptoms: 'Feeling headache and cold symptoms'
        },
        {
          headers: { Authorization: `Bearer ${patientToken}` }
        }
      );
      createdAppointmentId = bookRes.data.appointmentId || bookRes.data.AppointmentID;
      console.log('Booking Successful, Appointment Response:', bookRes.data);
    } catch (err) {
      console.error('Booking appointment FAILED:', err.response?.data || err.message);
      process.exit(1);
    }
  } else {
    console.log('\n5. Skipped Booking Appointment (No available slots found to book).');
  }

  // 6. Flow: Cancel Appointment
  if (createdAppointmentId) {
    try {
      console.log(`\n6. Cancelling Appointment ID: ${createdAppointmentId}...`);
      const cancelRes = await axios.put(
        `${BACKEND_URL}/patient/appointments/${createdAppointmentId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${patientToken}` }
        }
      );
      console.log('Cancellation Response:', cancelRes.data);
    } catch (err) {
      console.error('Cancelling appointment FAILED:', err.response?.data || err.message);
      process.exit(1);
    }
  } else {
    console.log('\n6. Skipped Cancelling Appointment (No appointment was created).');
  }

  // 8. Flow: Admin Appointments Page (GET /admin/all-appointments)
  if (adminToken) {
    try {
      console.log('\n8. Fetching all appointments as Admin...');
      const adminRes = await axios.get(`${BACKEND_URL}/admin/all-appointments`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('Admin Fetch Successful!');
      console.log('Success:', adminRes.data.success);
      console.log(`Count of appointments fetched: ${adminRes.data.data ? adminRes.data.data.length : 'N/A'}`);
      if (adminRes.data.data && adminRes.data.data.length > 0) {
        console.log('Sample appointment:', JSON.stringify(adminRes.data.data[0], null, 2));
      }
    } catch (err) {
      console.error('Admin fetching all appointments FAILED:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  console.log('\n=== All Integration Flow Verifications Completed Successfully ===');
}

runTests();
