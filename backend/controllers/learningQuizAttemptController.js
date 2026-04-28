const LearningQuiz = require('../models/LearningQuiz');
const LearningQuizAttempt = require('../models/LearningQuizAttempt');
const Student = require('../models/Student');

// @desc   Start quiz attempt (Student)
// @route  POST /api/learning/quizzes/:quizId/start
const startAttempt = async (req, res) => {
  try {
    const quiz = await LearningQuiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.status !== 'Published') return res.status(400).json({ message: 'Quiz is not available' });

    const studentId = req.user.id;

    const existingCount = await LearningQuizAttempt.countDocuments({ student: studentId, quiz: quiz._id });
    if (existingCount >= quiz.attemptLimit) {
      return res.status(400).json({ message: 'Attempt limit reached for this quiz' });
    }

    const attempt = await LearningQuizAttempt.create({
      student: studentId,
      quiz: quiz._id,
      attemptNumber: existingCount + 1,
      totalScore: quiz.totalMarks || 0,
      status: 'Pending',
      startedAt: new Date(),
    });

    await Student.findByIdAndUpdate(studentId, { $addToSet: { quizAttempts: attempt._id } });

    res.status(201).json({
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      quizId: quiz._id,
      timeLimit: quiz.timeLimit,
      startedAt: attempt.startedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function gradeAttempt(quiz, submittedAnswers) {
  const questions = quiz.questions || [];
  const answerMap = new Map((submittedAnswers || []).map((a) => [String(a.questionId), a.selectedOptionId ? String(a.selectedOptionId) : null]));

  let score = 0;
  const answers = [];

  for (const q of questions) {
    const qid = String(q._id);
    const selectedOptionId = answerMap.get(qid) || null;

    const correctOption = (q.options || []).find((o) => o.isCorrect);
    const isCorrect = !!(correctOption && selectedOptionId && String(correctOption._id) === String(selectedOptionId));
    const marksAwarded = isCorrect ? (q.marks || 0) : 0;
    score += marksAwarded;

    answers.push({
      questionId: q._id,
      selectedOptionId: selectedOptionId || undefined,
      isCorrect,
      marksAwarded,
    });
  }

  const totalScore = quiz.totalMarks || 0;
  const percentage = totalScore > 0 ? Math.round((score / totalScore) * 10000) / 100 : 0;
  const passed = percentage >= (quiz.passMark || 0);

  return { score, totalScore, percentage, passed, answers };
}

// @desc   Submit quiz attempt (Student)
// @route  POST /api/learning/quizzes/:quizId/submit
const submitAttempt = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    if (!attemptId) return res.status(400).json({ message: 'attemptId is required' });

    const quiz = await LearningQuiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const attempt = await LearningQuizAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    if (attempt.quiz.toString() !== quiz._id.toString()) {
      return res.status(400).json({ message: 'Attempt does not belong to this quiz' });
    }

    if (req.user.role !== 'student' || attempt.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ message: 'Attempt already submitted' });
    }

    const graded = gradeAttempt(quiz, answers);

    attempt.answers = graded.answers;
    attempt.scoreObtained = graded.score;
    attempt.totalScore = graded.totalScore;
    attempt.percentage = graded.percentage;
    attempt.status = graded.passed ? 'Passed' : 'Failed';
    attempt.submittedAt = new Date();

    const saved = await attempt.save();

    res.json({
      attemptId: saved._id,
      quizId: quiz._id,
      attemptNumber: saved.attemptNumber,
      scoreObtained: saved.scoreObtained,
      totalScore: saved.totalScore,
      percentage: saved.percentage,
      status: saved.status,
      submittedAt: saved.submittedAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { startAttempt, submitAttempt };
