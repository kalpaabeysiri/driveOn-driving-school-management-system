const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables

// Import models
const TheoryExam = require('../models/TheoryExam');
const PracticalExam = require('../models/PracticalExam');
const Student = require('../models/Student');
const StudentProgress = require('../models/StudentProgress');
const ExamResult = require('../models/ExamResult');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const Instructor = require('../models/Instructor');

const seedData = async () => {
  try {
    console.log('Starting exam system seed data...');

    // Clear existing data
    await Promise.all([
      TheoryExam.deleteMany({}),
      PracticalExam.deleteMany({}),
      StudentProgress.deleteMany({}),
      ExamResult.deleteMany({}),
      AttendanceRecord.deleteMany({})
    ]);

    // Get or create admin for seeding
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'admin@driveschool.com',
        role: 'admin',
        password: 'admin123' // Add a default password
      });
      await admin.save();
    }

    // Get instructor for practical exams
    let instructor = await Instructor.findOne();
    if (!instructor) {
      instructor = new Instructor({
        fullName: 'John Instructor',
        nic: '123456789V',
        dateOfBirth: new Date('1980-01-01'),
        address: '123 Main St, Colombo',
        city: 'Colombo',
        gender: 'Male',
        email: 'instructor@driveschool.com',
        password: 'password123',
        contactNumber: '0771234567',
        emergencyContact: '0777654321'
      });
      await instructor.save();
    }

    // Get students
    const students = await Student.find({});
    if (students.length === 0) {
      console.log('No students found. Please seed students first.');
      return;
    }

    // Create Theory Exams
    const theoryExams = [
      {
        examName: 'Driving Theory Test - English',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startTime: '09:00',
        endTime: '10:30',
        locationOrHall: 'DMT Head Office - Colombo',
        language: 'English',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id
      },
      {
        examName: 'Driving Theory Test - Sinhala',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        startTime: '10:00',
        endTime: '11:30',
        locationOrHall: 'DMT Kandy Branch',
        language: 'Sinhala',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id
      },
      {
        examName: 'Driving Theory Test - Tamil',
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        startTime: '14:00',
        endTime: '15:30',
        locationOrHall: 'DMT Jaffna Branch',
        language: 'Tamil',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id
      },
      {
        examName: 'Driving Theory Test - English',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startTime: '09:00',
        endTime: '10:30',
        locationOrHall: 'DMT Head Office - Colombo',
        language: 'English',
        status: 'Completed',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id
      }
    ];

    const createdTheoryExams = await TheoryExam.insertMany(theoryExams);
    console.log(`Created ${createdTheoryExams.length} theory exams`);

    // Create Practical Exams
    const practicalExams = [
      {
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        startTime: '08:00',
        endTime: '17:00',
        trialLocation: 'DMT Colombo Test Track',
        vehicleCategory: 'Light',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id,
        examiner: instructor._id
      },
      {
        date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000), // 17 days from now
        startTime: '08:00',
        endTime: '17:00',
        trialLocation: 'DMT Kandy Test Track',
        vehicleCategory: 'Heavy',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id,
        examiner: instructor._id
      },
      {
        date: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000), // 24 days from now
        startTime: '08:00',
        endTime: '17:00',
        trialLocation: 'DMT Galle Test Track',
        vehicleCategory: 'Bike',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id,
        examiner: instructor._id
      },
      {
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        startTime: '08:00',
        endTime: '17:00',
        trialLocation: 'DMT Colombo Test Track',
        vehicleCategory: 'Light',
        status: 'Completed',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id,
        examiner: instructor._id
      }
    ];

    const createdPracticalExams = await PracticalExam.insertMany(practicalExams);
    console.log(`Created ${createdPracticalExams.length} practical exams`);

    // Assign students to upcoming exams
    const upcomingTheoryExam = createdTheoryExams.find(exam => exam.status === 'Scheduled');
    const upcomingPracticalExam = createdPracticalExams.find(exam => exam.status === 'Scheduled');

    if (upcomingTheoryExam && students.length > 0) {
      // Assign 6 students to upcoming theory exam (leaving 4 seats available)
      const theoryAssignments = students.slice(0, 6).map(student => student._id);
      await TheoryExam.findByIdAndUpdate(
        upcomingTheoryExam._id,
        { $push: { enrolledStudents: { $each: theoryAssignments } } }
      );

      // Update student progress for assigned students
      for (const studentId of theoryAssignments) {
        await StudentProgress.findOneAndUpdate(
          { student: studentId },
          { 
            overallStatus: 'Assigned for Theory Exam',
            lastUpdated: new Date()
          },
          { upsert: true }
        );
      }
    }

    if (upcomingPracticalExam && students.length > 0) {
      // Find students who have passed theory (simulate)
      const theoryPassedStudents = students.slice(2, 5); // 3 students
      
      // Assign 3 students to upcoming practical exam (leaving 7 seats available)
      const practicalAssignments = theoryPassedStudents.map(student => student._id);
      await PracticalExam.findByIdAndUpdate(
        upcomingPracticalExam._id,
        { $push: { enrolledStudents: { $each: practicalAssignments } } }
      );

      // Update student progress for assigned students
      for (const studentId of practicalAssignments) {
        await StudentProgress.findOneAndUpdate(
          { student: studentId },
          { 
            overallStatus: 'Assigned for Practical Exam',
            lastUpdated: new Date()
          },
          { upsert: true }
        );
      }
    }

    // Create exam results for completed exams
    const completedTheoryExam = createdTheoryExams.find(exam => exam.status === 'Completed');
    const completedPracticalExam = createdPracticalExams.find(exam => exam.status === 'Completed');

    if (completedTheoryExam && students.length > 0) {
      // Create results for completed theory exam
      const theoryResults = [
        { student: students[0]._id, status: 'Pass', attemptNumber: 1 },
        { student: students[1]._id, status: 'Pass', attemptNumber: 1 },
        { student: students[2]._id, status: 'Fail', attemptNumber: 1 },
        { student: students[3]._id, status: 'Pass', attemptNumber: 1 },
        { student: students[4]._id, status: 'Fail', attemptNumber: 1 }
      ];

      for (const result of theoryResults) {
        const examResult = new ExamResult({
          ...result,
          theoryExam: completedTheoryExam._id,
          recordedBy: admin._id
        });
        await examResult.save();

        // Update student progress
        await StudentProgress.findOneAndUpdate(
          { student: result.student },
          { 
            overallStatus: result.status === 'Pass' ? 'Theory Passed' : 'In Progress',
            theoryExamStatus: result.status,
            theoryExamAttempts: result.attemptNumber,
            lastTheoryExamDate: new Date(),
            lastUpdated: new Date()
          },
          { upsert: true }
        );
      }
    }

    if (completedPracticalExam && students.length > 0) {
      // Create results for completed practical exam (only for students who passed theory)
      const practicalResults = [
        { student: students[0]._id, status: 'Pass', attemptNumber: 1 },
        { student: students[1]._id, status: 'Fail', attemptNumber: 1 },
        { student: students[2]._id, status: 'Pass', attemptNumber: 2 } // Second attempt
      ];

      for (const result of practicalResults) {
        const examResult = new ExamResult({
          ...result,
          practicalExam: completedPracticalExam._id,
          recordedBy: admin._id
        });
        await examResult.save();

        // Update student progress
        const overallStatus = result.status === 'Pass' ? 'Completed' : 'Theory Passed';
        await StudentProgress.findOneAndUpdate(
          { student: result.student },
          { 
            overallStatus,
            practicalExamStatus: result.status,
            practicalExamAttempts: result.attemptNumber,
            lastPracticalExamDate: new Date(),
            lastUpdated: new Date()
          },
          { upsert: true }
        );
      }
    }

    // Create attendance records
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      students.forEach((student, index) => {
        // Create theory attendance
        if (index < 5) { // First 5 students have theory attendance
          attendanceRecords.push({
            attendanceType: 'Theory',
            date: new Date(date),
            durationHours: 2,
            status: Math.random() > 0.2 ? 'Present' : 'Absent',
            student: student._id,
            verifiedBy: instructor._id,
            remarks: 'Regular theory session'
          });
        }
        
        // Create practical attendance
        if (index >= 3 && index < 8) { // Students 3-7 have practical attendance
          attendanceRecords.push({
            attendanceType: 'Practical',
            date: new Date(date),
            durationHours: 3,
            status: Math.random() > 0.15 ? 'Present' : 'Absent',
            student: student._id,
            verifiedBy: instructor._id,
            remarks: 'Driving practice session'
          });
        }
      });
    }

    await AttendanceRecord.insertMany(attendanceRecords);
    console.log(`Created ${attendanceRecords.length} attendance records`);

    // Update attendance stats in student progress
    for (const student of students) {
      const studentAttendance = attendanceRecords.filter(record => 
        record.student.toString() === student._id.toString()
      );
      
      const theoryAttendance = studentAttendance.filter(record => record.attendanceType === 'Theory');
      const practicalAttendance = studentAttendance.filter(record => record.attendanceType === 'Practical');
      
      const theoryPresent = theoryAttendance.filter(record => record.status === 'Present').length;
      const practicalPresent = practicalAttendance.filter(record => record.status === 'Present').length;
      
      await StudentProgress.findOneAndUpdate(
        { student: student._id },
        {
          totalTheoryHours: theoryAttendance.reduce((sum, record) => sum + record.durationHours, 0),
          totalPracticalHours: practicalAttendance.reduce((sum, record) => sum + record.durationHours, 0),
          theoryAttendanceRate: theoryAttendance.length > 0 ? Math.round((theoryPresent / theoryAttendance.length) * 100) : 0,
          practicalAttendanceRate: practicalAttendance.length > 0 ? Math.round((practicalPresent / practicalAttendance.length) * 100) : 0,
          totalSessionsAttended: studentAttendance.filter(record => record.status === 'Present').length,
          totalSessionsBooked: studentAttendance.length,
          lastUpdated: new Date()
        },
        { upsert: true }
      );
    }

    // Create one full exam (10/10 seats)
    if (students.length >= 10) {
      const fullTheoryExam = new TheoryExam({
        examName: 'Full Capacity Theory Test',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        startTime: '13:00',
        endTime: '14:30',
        locationOrHall: 'DMT Matara Branch',
        language: 'Sinhala',
        status: 'Scheduled',
        maxSeats: 10,
        sourceType: 'seeded',
        createdBy: admin._id,
        enrolledStudents: students.slice(0, 10).map(s => s._id) // All 10 seats filled
      });
      await fullTheoryExam.save();
      console.log('Created full capacity exam (10/10 seats)');
    }

    console.log('Exam system seed data completed successfully!');
    
    // Summary
    const summary = {
      theoryExams: createdTheoryExams.length,
      practicalExams: createdPracticalExams.length,
      attendanceRecords: attendanceRecords.length,
      studentProgress: await StudentProgress.countDocuments(),
      examResults: await ExamResult.countDocuments()
    };
    
    console.log('Summary:', summary);

  } catch (error) {
    console.error('Error seeding exam data:', error);
  }
};

module.exports = seedData;

// Run if called directly
if (require.main === module) {
  // Use the same MongoDB URI as the server
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/driveon';
  console.log('Connecting to MongoDB...');
  
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('Connected to MongoDB');
      seedData().then(() => {
        console.log('Seeding completed');
        process.exit(0);
      }).catch(error => {
        console.error('Seeding error:', error);
        process.exit(1);
      });
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    });
}
