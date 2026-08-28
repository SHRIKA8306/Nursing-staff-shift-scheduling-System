const bcrypt = require('bcryptjs');
const { User } = require('./model/user');
const { Profile } = require('./model/profile');
const { Shift } = require('./model/shift');
const { Notification } = require('./model/notification');

const seedDatabase = async () => {
  try {
    // Check if Admin exists
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);

      await User.create({
        username: 'Administrator',
        email: 'admin@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM-001'
      });
      console.log('✅ Default Admin user created (admin@gmail.com / admin)');
    }

    // Default Sample Nurses
    const sampleNurses = [
      {
        username: 'Sarah Johnson',
        email: 'sarah@gmail.com',
        employeeId: 'EMP-001',
        department: 'ICU',
        password: 'nursepassword',
        qualifications: ['BSN', 'RN', 'ACLS', 'BLS'],
        experienceYears: 5,
        shiftPreference: 'Morning',
        phone: '+1 (555) 234-5678'
      },
      {
        username: 'Ananya Sharma',
        email: 'ananya@gmail.com',
        employeeId: 'EMP-002',
        department: 'Emergency',
        password: 'nursepassword',
        qualifications: ['MSN', 'RN', 'PALS', 'TNCC'],
        experienceYears: 7,
        shiftPreference: 'Evening',
        phone: '+1 (555) 876-5432'
      }
    ];

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
          qualifications: nurseData.qualifications,
          experienceYears: nurseData.experienceYears,
          shiftPreference: nurseData.shiftPreference,
          phone: nurseData.phone,
          emergencyContact: { name: 'Emergency Contact', phone: '+1 (555) 000-9999', relation: 'Spouse/Parent' },
          maxShiftsPerWeek: 5,
          status: 'Active'
        });

        // Add sample upcoming shifts for the nurse
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

        await Shift.create([
          {
            nurse: user._id,
            date: today,
            shiftType: nurseData.shiftPreference === 'Night' ? 'Night' : 'Morning',
            startTime: '07:00',
            endTime: '15:00',
            department: nurseData.department,
            status: 'Scheduled',
            notes: 'Regular Shift'
          },
          {
            nurse: user._id,
            date: tomorrow,
            shiftType: nurseData.shiftPreference === 'Evening' ? 'Evening' : 'Morning',
            startTime: '15:00',
            endTime: '23:00',
            department: nurseData.department,
            status: 'Scheduled',
            notes: 'Assigned by Admin'
          },
          {
            nurse: user._id,
            date: dayAfter,
            shiftType: 'Night',
            startTime: '23:00',
            endTime: '07:00',
            department: nurseData.department,
            status: 'Scheduled',
            notes: 'Overnight Care'
          }
        ]);

        await Notification.create({
          user: user._id,
          title: 'Welcome to NurseSync AI',
          message: `Hello ${nurseData.username}, your profile and shift schedule have been initialized.`,
          type: 'general'
        });

        console.log(`✅ Sample Nurse created: ${nurseData.username} (${nurseData.employeeId})`);
      }
    }
  } catch (err) {
    console.error('⚠️ Seeding error:', err.message);
  }
};

module.exports = seedDatabase;
