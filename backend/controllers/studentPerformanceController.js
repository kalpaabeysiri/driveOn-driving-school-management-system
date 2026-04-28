const Student = require('../models/Student');
const LearningQuizAttempt = require('../models/LearningQuizAttempt');
const StudentLessonProgress = require('../models/StudentLessonProgress');
const LearningQuiz = require('../models/LearningQuiz');
const LearningLesson = require('../models/LearningLesson');

// @desc   Get student performance summary (Student)
// @route  GET /api/learning/student/performance
const getStudentPerformance = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student's quiz attempts with lesson data
    const quizAttempts = await LearningQuizAttempt.find({ student: studentId })
      .populate({
        path: 'quiz',
        select: 'title passMark language lesson',
        populate: { path: 'lesson', select: 'title' }
      })
      .sort({ submittedAt: -1 });

    // Get student's lesson progress
    const lessonProgress = await StudentLessonProgress.find({ student: studentId })
      .populate('lesson', 'title displayOrder')
      .sort({ lastAccessedAt: -1 });

    // Calculate quiz statistics
    const totalQuizzes = quizAttempts.length;
    const passedQuizzes = quizAttempts.filter(a => a.status === 'Passed').length;
    const totalScore = quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0);
    const averageScore = totalQuizzes > 0 ? Math.round((totalScore / totalQuizzes) * 10) / 10 : 0;

// Group quiz attempts by lesson → quiz → attempts
    const quizPerformanceByLesson = new Map();
    
    quizAttempts.forEach(attempt => {
      const quiz = attempt.quiz;
      if (!quiz) return;
      
      const lessonTitle = quiz.lesson?.title || 'General';
      const quizTitle = quiz.title || 'Unknown Quiz';
      
      // Initialize lesson if not exists
      if (!quizPerformanceByLesson.has(lessonTitle)) {
        quizPerformanceByLesson.set(lessonTitle, {
          lesson: lessonTitle,
          quizzes: new Map(), // quizTitle -> quiz data
          totalQuizzes: 0,
          totalAttempts: 0,
        });
      }
      const lessonData = quizPerformanceByLesson.get(lessonTitle);
      
      // Initialize quiz if not exists
      if (!lessonData.quizzes.has(quizTitle)) {
        lessonData.quizzes.set(quizTitle, {
          quizTitle: quizTitle,
          totalAttempts: 0,
          attempts: [],
          bestScore: 0,
          passed: false,
        });
        lessonData.totalQuizzes++;
      }
      const quizData = lessonData.quizzes.get(quizTitle);
      
      // Add attempt
      quizData.attempts.push({
        attemptNumber: attempt.attemptNumber || 1,
        score: attempt.percentage || 0,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
      });
      quizData.totalAttempts++;
      lessonData.totalAttempts++;
      
      // Update best score and pass status
      if (attempt.percentage > quizData.bestScore) {
        quizData.bestScore = attempt.percentage;
      }
      if (attempt.status === 'Passed') {
        quizData.passed = true;
      }
    });
    
    // Convert Maps to arrays for JSON response
    const quizPerformanceData = Array.from(quizPerformanceByLesson.values()).map(lesson => ({
      lesson: lesson.lesson,
      totalQuizzes: lesson.totalQuizzes,
      totalAttempts: lesson.totalAttempts,
      quizzes: Array.from(lesson.quizzes.values()).map(quiz => ({
        quizTitle: quiz.quizTitle,
        totalAttempts: quiz.totalAttempts,
        bestScore: quiz.bestScore,
        passed: quiz.passed,
        attempts: quiz.attempts.sort((a, b) => a.attemptNumber - b.attemptNumber), // Sort by attempt number
      })),
    }));

    // Calculate lesson statistics
    const totalLessons = lessonProgress.length;
    const completedLessons = lessonProgress.filter(p => p.completionStatus === 'Completed').length;
    const lessonCompletionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate study time (estimated based on lesson progress)
    const studyTimeHours = Math.round(lessonProgress.reduce((sum, p) => {
      return sum + (p.progressPercentage || 0) * 0.5; // Estimate 0.5 hours per 100% progress
    }, 0));

    // Exam eligibility calculation
    const eligibilityRequirements = {
      minimumQuizScore: 75,
      minimumAttendance: 75, // This would need to be connected to actual attendance system
      completedTheory: 12,
      completedPractical: 8,
    };

    const eligibilityStatus = {
      quizScoreMet: averageScore >= eligibilityRequirements.minimumQuizScore,
      attendanceMet: true, // Placeholder - would need actual attendance data
      theoryCompleted: completedLessons >= eligibilityRequirements.completedTheory,
      practicalCompleted: true, // Placeholder - would need practical session data
    };

    const isEligible = Object.values(eligibilityStatus).every(status => status === true);

    // Recent activity
    const recentActivity = [];
    
    // Add recent quiz attempts
    quizAttempts.slice(0, 5).forEach(attempt => {
      recentActivity.push({
        type: 'quiz',
        title: attempt.quiz?.title || 'Quiz',
        score: attempt.percentage || 0,
        date: attempt.submittedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      });
    });

    // Add recent lesson progress
    lessonProgress.slice(0, 5).forEach(progress => {
      recentActivity.push({
        type: 'lesson',
        title: progress.lesson?.title || 'Lesson',
        completed: progress.completionStatus === 'Completed',
        date: progress.lastAccessedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      });
    });

    // Sort by date and limit to 10 items
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentActivity.splice(10);

    const performanceData = {
      overallStats: {
        averageScore,
        totalQuizzes,
        passedQuizzes,
        totalAttempts: quizAttempts.length,
        studyTime: studyTimeHours,
      },
      quizPerformanceByLesson: quizPerformanceData,
      attendance: {
        theory: {
          attended: completedLessons,
          total: Math.max(totalLessons, eligibilityRequirements.completedTheory),
          percentage: lessonCompletionPercentage,
        },
        practical: {
          attended: 8, // Placeholder
          total: 10, // Placeholder
          percentage: 80, // Placeholder
        },
      },
      examEligibility: {
        eligible: isEligible,
        requirements: eligibilityRequirements,
        status: eligibilityStatus,
      },
      recentActivity,
      generatedAt: new Date(),
    };

    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get student quiz history (Student)
// @route  GET /api/learning/student/quiz-history
const getStudentQuizHistory = async (req, res) => {
  try {
    const studentId = req.user.id;

    const attempts = await LearningQuizAttempt.find({ student: studentId })
      .populate('quiz', 'title questions timeLimit passMark')
      .sort({ submittedAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get student lesson progress (Student)
// @route  GET /api/learning/student/lesson-progress
const getStudentLessonProgress = async (req, res) => {
  try {
    const studentId = req.user.id;

    const progress = await StudentLessonProgress.find({ student: studentId })
      .populate('lesson', 'title description displayOrder')
      .sort({ lastAccessedAt: -1 });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStudentPerformance,
  getStudentQuizHistory,
  getStudentLessonProgress,
};
