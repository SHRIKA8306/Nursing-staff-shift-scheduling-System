const mongoose = require('mongoose');
const { Shift } = require('./model/shift');

async function checkShifts() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nurse_shift_db');
  const shifts = await Shift.find();
  for (let shift of shifts) {
    if (shift.shiftType === 'Morning') {
      shift.startTime = '06:00';
      shift.endTime = '14:00';
    } else if (shift.shiftType === 'Evening') {
      shift.startTime = '14:00';
      shift.endTime = '22:00';
    } else if (shift.shiftType === 'Night') {
      shift.startTime = '22:00';
      shift.endTime = '06:00';
    }
    await shift.save();
  }
  console.log("Updated shift times in DB!");
  process.exit(0);
}
checkShifts();
