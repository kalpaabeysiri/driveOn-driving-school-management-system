import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getLearningQuizById, startLearningQuizAttempt, submitLearningQuizAttempt } from '../../services/learningApi';
import { COLORS } from '../../theme';

export default function QuizScreen({ route, navigation }) {
  const { quizId, title } = route.params || {};

  // Validate required params
  React.useEffect(() => {
    if (!quizId) {
      Alert.alert('Error', 'Quiz ID is required');
      navigation.goBack();
    }
  }, [quizId, navigation]);

  const [quiz,      setQuiz]      = useState(null);
  const [attempt,   setAttempt]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [currentQ,  setCurrentQ]  = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [answers,   setAnswers]   = useState([]);
  const [finished,  setFinished]  = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [result,    setResult]    = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        // Start quiz attempt first
        const attemptRes = await startLearningQuizAttempt(quizId);
        const attemptData = attemptRes.data;
        
        // Then fetch quiz details
        const quizRes = await getLearningQuizById(quizId);
        const quizData = quizRes.data;
        
        setQuiz(quizData);
        setAttempt(attemptData);
        setAnswers(Array(quizData.questions?.length || 0).fill(null));
      } catch (error) {
        Alert.alert('Error', error.response?.data?.message || 'Could not load quiz');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.brandOrange} /></View>;

  const totalQ    = quiz.questions?.length || 0;
  const question  = quiz.questions?.[currentQ];

  const handleSelect = (optionId) => {
    if (reviewing) return;
    setSelected(optionId);
    const updated = [...answers];
    updated[currentQ] = optionId;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(answers[currentQ + 1]);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setSelected(answers[currentQ - 1]);
    }
  };

  const handleFinish = async () => {
    if (!attempt || !quiz) return;
    
    try {
      setSubmitting(true);
      
      // Prepare answers for submission
      const formattedAnswers = answers.map((selectedOptionId, index) => ({
        questionId: quiz.questions[index]._id,
        selectedOptionId: selectedOptionId,
      }));
      
      // Submit quiz attempt
      const result = await submitLearningQuizAttempt(quizId, {
        attemptId: attempt.attemptId,
        answers: formattedAnswers,
      });
      
      const resultData = result.data;
      setResult({
        correct: resultData.scoreObtained || 0,
        wrong: (resultData.totalScore || 0) - (resultData.scoreObtained || 0),
        score: resultData.percentage || 0,
        passed: resultData.status === 'Passed',
        totalScore: resultData.totalScore,
        answers: resultData.answers || [],
      });
      setFinished(true);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not submit quiz');
      console.log('Quiz submit error:', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = () => {
    setReviewing(true);
    setFinished(false);
    setCurrentQ(0);
    setSelected(answers[0]);
  };

  const handleRetake = () => {
    setAnswers(Array(totalQ).fill(null));
    setCurrentQ(0);
    setSelected(null);
    setFinished(false);
    setReviewing(false);
    setResult(null);
  };

  // ── Results Screen ──────────────────────────────────────────────────────────
  if (finished && result) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
            <Ionicons name="arrow-back" size={20} color={COLORS.black} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiz Complete!</Text>
        </View>

        <ScrollView contentContainerStyle={styles.resultContent}>
          {submitting && (
            <View style={styles.savingBanner}>
              <ActivityIndicator size="small" color={COLORS.brandOrange} />
              <Text style={styles.savingText}>Saving results...</Text>
            </View>
          )}

          <View style={[styles.scoreCircle, {
            backgroundColor: result.passed ? COLORS.brandYellow : COLORS.redBg,
          }]}>
            <Text style={styles.scoreValue}>{result.score}%</Text>
            <Text style={styles.scoreLabel}>Your Score</Text>
          </View>

          <Text style={styles.resultEmoji}>
            {result.score >= 75 ? '🎉 Excellent!' : result.score >= 60 ? '👍 Good Job!' : '📚 Keep Practicing!'}
          </Text>
          <Text style={styles.resultQuizTitle}>{title}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: COLORS.greenBg }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
              <Text style={styles.statNum}>{result.correct}</Text>
              <Text style={styles.statLbl}>Correct</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: COLORS.redBg }]}>
              <Ionicons name="close-circle" size={24} color={COLORS.red} />
              <Text style={styles.statNum}>{result.wrong}</Text>
              <Text style={styles.statLbl}>Wrong</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: result.passed ? COLORS.greenBg : COLORS.redBg }]}>
              <Ionicons name={result.passed ? 'trophy' : 'close-circle'} size={24} color={result.passed ? COLORS.green : COLORS.red} />
              <Text style={styles.statNum}>{result.passed ? 'Pass' : 'Fail'}</Text>
              <Text style={styles.statLbl}>Result</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleReview}>
            <Text style={styles.primaryBtnText}>Review Answers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRetake}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.black} />
            <Text style={styles.secondaryBtnText}>Retake Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.darkBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.darkBtnText}>Back to Learning</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Quiz / Review Screen ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => reviewing ? (setReviewing(false), setFinished(true)) : navigation.goBack()}
          style={styles.backRow}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.black} />
          <Text style={styles.backText}>{reviewing ? 'Back to Results' : 'Exit'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Q {currentQ + 1} / {totalQ}</Text>
          <Text style={styles.progressPct}>{Math.round(((currentQ + 1) / totalQ) * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((currentQ + 1) / totalQ) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <Text style={styles.questionText}>{question.question}</Text>

        {question.options?.map((opt, idx) => {
          const letter     = String.fromCharCode(65 + idx);
          const isSelected = selected === opt._id;
          const isCorrect  = opt.isCorrect;
          const isUserCorrect = reviewing && result?.answers?.[currentQ]?.isCorrect;

          let optBg     = '#F3F3F3';
          let optBorder = COLORS.borderLight;
          let circleBg  = '#E0E0E0';
          let circleText= COLORS.black;

          if (reviewing) {
            if (isCorrect)              { optBg = COLORS.greenBg; optBorder = COLORS.green; circleBg = COLORS.green; circleText = COLORS.white; }
            else if (isSelected && !isCorrect) { optBg = COLORS.redBg;   optBorder = COLORS.red;   circleBg = COLORS.red;   circleText = COLORS.white; }
          } else if (isSelected) {
            optBg = '#FFF8ED'; optBorder = COLORS.brandOrange; circleBg = COLORS.brandYellow;
          }

          return (
            <TouchableOpacity
              key={opt._id}
              style={[styles.option, { backgroundColor: optBg, borderColor: optBorder }]}
              onPress={() => handleSelect(opt._id)}
            >
              <View style={[styles.circle, { backgroundColor: circleBg }]}>
                <Text style={[styles.circleText, { color: circleText }]}>{letter}</Text>
              </View>
              <Text style={styles.optionText}>{opt.text}</Text>
              {reviewing && isCorrect && <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />}
              {reviewing && isSelected && !isCorrect && <Ionicons name="close-circle" size={20} color={COLORS.red} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {currentQ > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
            <Text style={styles.prevBtnText}>Previous</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, (selected === null && !reviewing) && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selected === null && !reviewing}
        >
          <Text style={styles.nextBtnText}>
            {currentQ === totalQ - 1 ? (reviewing ? 'Done' : 'Finish') : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backText:     { fontSize: 14, fontWeight: '500', color: COLORS.black },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: COLORS.black, marginBottom: 10 },
  progressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { fontSize: 12, color: COLORS.textMuted },
  progressPct:  { fontSize: 12, fontWeight: '600', color: COLORS.black },
  progressTrack:{ height: 6, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.brandOrange, borderRadius: 3 },
  quizContent:  { padding: 20, paddingBottom: 20 },
  questionText: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 20, lineHeight: 24 },
  option: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  optionCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetter: { fontSize: 13, fontWeight: '700' },
  optionText:   { fontSize: 14, color: COLORS.black, flex: 1 },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  prevBtn:        { flex: 1, backgroundColor: '#F3F3F3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  prevBtnText:    { fontSize: 14, fontWeight: '600', color: COLORS.black },
  nextBtn:        { flex: 2, backgroundColor: COLORS.brandOrange, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nextBtnDisabled:{ backgroundColor: '#E0E0E0' },
  nextBtnText:    { fontSize: 14, fontWeight: '600', color: COLORS.white },
  // Results
  resultContent:  { padding: 24, alignItems: 'center' },
  savingBanner:   { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
  savingText:     { fontSize: 13, color: COLORS.textMuted },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  scoreValue:     { fontSize: 36, fontWeight: '800', color: COLORS.black },
  scoreLabel:     { fontSize: 12, color: COLORS.textMuted },
  resultEmoji:    { fontSize: 18, fontWeight: '700', color: COLORS.black, marginBottom: 4 },
  resultQuizTitle:{ fontSize: 13, color: COLORS.textMuted, marginBottom: 24 },
  statsRow:       { flexDirection: 'row', gap: 10, marginBottom: 24, width: '100%' },
  statBox:        { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statNum:        { fontSize: 20, fontWeight: '700', color: COLORS.black },
  statLbl:        { fontSize: 11, color: COLORS.textMuted },
  primaryBtn:     { width: '100%', backgroundColor: COLORS.brandYellow, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.black },
  secondaryBtn:   { width: '100%', backgroundColor: '#F3F3F3', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  secondaryBtnText:{ fontSize: 14, fontWeight: '600', color: COLORS.black },
  darkBtn:        { width: '100%', backgroundColor: COLORS.black, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  darkBtnText:    { fontSize: 14, fontWeight: '600', color: COLORS.white },
});
