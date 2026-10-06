const bcrypt = require('bcryptjs');
const { User } = require('./model/user');
const { Profile } = require('./model/profile');
const { Shift } = require('./model/shift');
const { Notification } = require('./model/notification');
const { LeaveRequest } = require('./model/leaveRequest');
const { ShiftSwap } = require('./model/shiftSwap');
const { Attendance } = require('./model/attendance');

const seedDatabase = async () => {
  try {
    // ─── Admin ───────────────────────────────────────────────────────────────
    let adminUser = await User.findOne({ 
      $or: [{ role: 'admin' }, { email: 'shrika080306@gmail.com' }, { email: 'shrika.al23@bitsathy.ac.in' }, { email: 'mail-admin@gmail.com' }] 
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin', salt);

    if (!adminUser) {
      adminUser = await User.create({
        username: 'Shrika Senthilkumar (Admin)',
        email: 'shrika080306@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM-001'
      });
      console.log('✅ Admin created: shrika080306@gmail.com / admin');
    } else {
      adminUser.username = 'Shrika Senthilkumar (Admin)';
      adminUser.email = 'shrika080306@gmail.com';
      adminUser.role = 'admin';
      adminUser.passwordHash = hashedPassword;
      await adminUser.save();
      console.log('✅ Admin updated: shrika080306@gmail.com / admin');
    }

    // ─── Sample Nurses ────────────────────────────────────────────────────────
    const sampleNurses = [
      {
        username: 'Shrika Senthilkumar',
        email: 'shrikasenthilkumar8@gmail.com',
        employeeId: 'EMP-SHRIKA',
        department: 'ICU',
        designation: 'Staff Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN', 'ACLS', 'BLS'],
        skills: ['Critical Care', 'Ventilator Management', 'Emergency Response'],
        experienceYears: 4,
        shiftPreference: 'Morning',
        phone: '+91-9876543219',
        availability: 'Full-Time'
      },
      {
        username: 'Sarah Johnson',
        email: 'sarah@gmail.com',
        employeeId: 'EMP-001',
        department: 'ICU',
        designation: 'Senior Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN', 'ACLS', 'BLS'],
        skills: ['Critical Care', 'Ventilator Management'],
        experienceYears: 5,
        shiftPreference: 'Morning',
        phone: '+91-9876543210',
        availability: 'Full-Time'
      },
      {
        username: 'Ananya Sharma',
        email: 'ananya@gmail.com',
        employeeId: 'EMP-002',
        department: 'Emergency',
        designation: 'Staff Nurse',
        password: 'nursepassword',
        qualifications: ['MSN', 'RN', 'PALS', 'TNCC'],
        skills: ['Emergency Triage', 'Trauma Care'],
        experienceYears: 7,
        shiftPreference: 'Evening',
        phone: '+91-9876543211',
        availability: 'Full-Time'
      },
      {
        username: 'Priya Mehta',
        email: 'priya@gmail.com',
        employeeId: 'EMP-003',
        department: 'General Ward',
        designation: 'Staff Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN'],
        skills: ['Patient Care', 'Wound Management'],
        experienceYears: 3,
        shiftPreference: 'Morning',
        phone: '+91-9876543212',
        availability: 'Full-Time'
      },
      {
        username: 'Rahul Nair',
        email: 'rahul@gmail.com',
        employeeId: 'EMP-004',
        department: 'Pediatrics',
        designation: 'Pediatric Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN', 'PALS'],
        skills: ['Pediatric Care', 'Neonatal Care'],
        experienceYears: 4,
        shiftPreference: 'Night',
        phone: '+91-9876543213',
        availability: 'Full-Time'
      },
      {
        username: 'Anjali Singh',
        email: 'anjali@gmail.com',
        employeeId: 'EMP-005',
        department: 'Cardiology',
        designation: 'Cardiac Nurse',
        password: 'nursepassword',
        qualifications: ['MSN', 'RN', 'ACLS', 'CEN'],
        skills: ['Cardiac Monitoring', 'ECG Interpretation'],
        experienceYears: 6,
        shiftPreference: 'Morning',
        phone: '+91-9876543214',
        availability: 'Full-Time'
      },
      {
        username: 'Meera Krishnan',
        email: 'meera@gmail.com',
        employeeId: 'EMP-006',
        department: 'ICU',
        designation: 'Head Nurse',
        password: 'nursepassword',
        qualifications: ['MSN', 'RN', 'CCRN', 'BLS', 'ACLS'],
        skills: ['ICU Management', 'Critical Care', 'Team Leadership'],
        experienceYears: 10,
        shiftPreference: 'Morning',
        phone: '+91-9876543215',
        availability: 'Full-Time'
      },
      {
        username: 'Arun Kumar',
        email: 'arun@gmail.com',
        employeeId: 'EMP-007',
        department: 'Emergency',
        designation: 'Staff Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN', 'BLS'],
        skills: ['Emergency Care', 'IV Therapy'],
        experienceYears: 2,
        shiftPreference: 'Evening',
        phone: '+91-9876543216',
        availability: 'Part-Time'
      },
      {
        username: 'Divya Reddy',
        email: 'divya@gmail.com',
        employeeId: 'EMP-008',
        department: 'General Ward',
        designation: 'Staff Nurse',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN'],
        skills: ['Patient Education', 'Medication Administration'],
        experienceYears: 1,
        shiftPreference: 'Flexible',
        phone: '+91-9876543217',
        availability: 'Full-Time'
      }
    ];

    const createdNurseUsers = [];

    for (const nurseData of sampleNurses) {
      let user = await User.findOne({ email: nurseData.email });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(nurseData.password, salt);

        user = await User.create({
          username: nurseData.username,
          email: nurseData.email,
          passwordHash,
          role: 'nurse',
          department: nurseData.department,
          employeeId: nurseData.employeeId
        });

        await Profile.create({
          user: user._id,
          fullName: nurseData.username,
          department: nurseData.department,
          qualifications: [...nurseData.qualifications, ...(nurseData.skills || [])],
          experienceYears: nurseData.experienceYears,
          shiftPreference: nurseData.shiftPreference,
          phone: nurseData.phone,
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '+91-9999999999',
            relation: 'Spouse'
          },
          maxShiftsPerWeek: 5,
          status: 'Active'
        });

        await Notification.create({
          user: user._id,
          title: 'Welcome to NurseSync AI',
          message: `Hello ${nurseData.username}, your profile has been created. Your default password is: nursepassword`,
          type: 'general'
        });

        console.log(`✅ Nurse created: ${nurseData.username} (${nurseData.employeeId})`);
      }
      createdNurseUsers.push(user);
    }

    // ─── Sample Shifts (Ensure every nurse has shifts) ─────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftTemplates = [
      { type: 'Morning', start: '06:00', end: '14:00' },
      { type: 'Evening', start: '14:00', end: '22:00' },
      { type: 'Night',   start: '22:00', end: '06:00' }
    ];

    for (let idx = 0; idx < createdNurseUsers.length; idx++) {
      const nurse = createdNurseUsers[idx];
      const existingNurseShifts = await Shift.countDocuments({ nurse: nurse._id });
      if (existingNurseShifts === 0) {
        const nurseShifts = [];
        for (let dayOffset = -3; dayOffset <= 10; dayOffset++) {
          const shiftDate = new Date(today);
          shiftDate.setDate(today.getDate() + dayOffset);
          const altTemplate = shiftTemplates[(idx + Math.abs(dayOffset)) % 3];
          nurseShifts.push({
            nurse: nurse._id,
            date: shiftDate,
            shiftType: altTemplate.type,
            startTime: altTemplate.start,
            endTime: altTemplate.end,
            department: nurse.department,
            status: dayOffset < 0 ? 'Completed' : 'Scheduled',
            notes: dayOffset < 0 ? 'Completed Shift' : 'Regular Shift'
          });
        }
        await Shift.insertMany(nurseShifts);
        console.log(`✅ ${nurseShifts.length} shifts created for nurse: ${nurse.username}`);
      }
    }

    // ─── Sample Leave Requests ────────────────────────────────────────────────
    const leavesCount = await LeaveRequest.countDocuments();
    if (leavesCount === 0 && createdNurseUsers.length >= 3) {
      const today = new Date();
      const futureDate1 = new Date(today);
      futureDate1.setDate(today.getDate() + 5);
      const futureDate2 = new Date(today);
      futureDate2.setDate(today.getDate() + 7);
      const futureDate3 = new Date(today);
      futureDate3.setDate(today.getDate() + 2);
      const futureDate4 = new Date(today);
      futureDate4.setDate(today.getDate() + 3);

      const leaves = [
        {
          nurse: createdNurseUsers[0]._id,
          startDate: futureDate1,
          endDate: futureDate2,
          leaveType: 'Casual',
          reason: 'Family function — need 3 days off for a wedding ceremony',
          status: 'Pending'
        },
        {
          nurse: createdNurseUsers[2]._id,
          startDate: futureDate3,
          endDate: futureDate4,
          leaveType: 'Sick',
          reason: 'Feeling unwell, doctor advised rest',
          status: 'Pending'
        },
        {
          nurse: createdNurseUsers[4]._id,
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3),
          leaveType: 'Annual',
          reason: 'Planned annual leave',
          status: 'Approved'
        },
        {
          nurse: createdNurseUsers[1]._id,
          startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10),
          endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8),
          leaveType: 'Emergency',
          reason: 'Family medical emergency',
          status: 'Approved'
        }
      ];

      await LeaveRequest.insertMany(leaves);
      console.log(`✅ ${leaves.length} sample leave requests created`);

      // Notify admin about pending leaves
      if (adminUser) {
        await Notification.create({
          user: adminUser._id,
          title: 'Pending Leave Requests',
          message: `You have ${leaves.filter(l => l.status === 'Pending').length} pending leave requests awaiting your review.`,
          type: 'leave_status'
        });
      }
    }

    // ─── Sample Shift Swaps ───────────────────────────────────────────────────
    const swapsCount = await ShiftSwap.countDocuments();
    if (swapsCount === 0 && createdNurseUsers.length >= 2) {
      // Get a shift for the first nurse
      const nurseShift = await Shift.findOne({
        nurse: createdNurseUsers[0]._id,
        date: { $gte: new Date() },
        status: 'Scheduled'
      });

      if (nurseShift) {
        await ShiftSwap.create({
          requester: createdNurseUsers[0]._id,
          targetNurse: createdNurseUsers[1]._id,
          originalShift: nurseShift._id,
          reason: 'Need to attend a mandatory training session on that day',
          status: 'Pending'
        });

        // Notify admin
        if (adminUser) {
          await Notification.create({
            user: adminUser._id,
            title: 'Shift Swap Request',
            message: `${createdNurseUsers[0].username} has requested a shift swap. Please review.`,
            type: 'swap_request'
          });
        }
        console.log('✅ Sample shift swap request created');
      }
    }

    // ─── Sample Attendance Records ────────────────────────────────────────────
    const attendanceCount = await Attendance.countDocuments();
    if (attendanceCount === 0 && createdNurseUsers.length > 0) {
      const attendanceRecords = [];
      const today = new Date();

      for (let dayOffset = -7; dayOffset <= -1; dayOffset++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + dayOffset);

        createdNurseUsers.slice(0, 5).forEach((nurse, idx) => {
          const checkIn = new Date(checkDate);
          checkIn.setHours(6 + (idx % 3) * 8, Math.floor(Math.random() * 15), 0, 0);
          const checkOut = new Date(checkIn);
          checkOut.setHours(checkIn.getHours() + 8, 0, 0, 0);

          attendanceRecords.push({
            nurse: nurse._id,
            checkIn,
            checkOut,
            status: idx === 2 && dayOffset === -3 ? 'Late' : 'Present',
            notes: ''
          });
        });
      }

      await Attendance.insertMany(attendanceRecords);
      console.log(`✅ ${attendanceRecords.length} attendance records created`);
    }

    console.log('🎉 Database seeding complete!');
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
};

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const dbUrl = process.env.DB || 'mongodb://127.0.0.1:27017/nurse_shift_db';
  mongoose.connect(dbUrl)
    .then(async () => {
      console.log('Connected to MongoDB for seeding...');
      await seedDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('MongoDB connection error during seeding:', err.message);
      process.exit(1);
    });
}

module.exports = seedDatabase;
