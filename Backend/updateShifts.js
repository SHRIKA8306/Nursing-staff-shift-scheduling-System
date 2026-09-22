const mongoose = require('mongoose');
const { Shift } = require('./model/shift');
const { Notification } = require('./model/notification');

async function updateShifts() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nurse_shift_db');
  const shifts = await Shift.find();
  const today = new Date();
  for (let i = 0; i < shifts.length; i++) {
    const shift = shifts[i];
    const offset = i % 3;
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + offset);
    shift.date = newDate;
    await shift.save();
  }
  console.log("Updated shifts!");
  process.exit(0);
}
updateShifts();
