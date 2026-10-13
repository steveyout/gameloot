import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, CheckCircle2, X, Sparkles, Trophy } from 'lucide-react-native';
import { claimQuizReward } from '../api/clientApi';
import { useTheme } from '../context/ThemeContext';

export default function QuizModal({ visible, quiz, token, onClose, onRewardClaimed }) {
  const { theme, isDark } = useTheme();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!visible) {
      setSelectedAnswers({});
      setIsSubmitting(false);
      setResult(null);
    }
  }, [visible]);

  if (!visible || !quiz) return null;

  const questions = Array.isArray(quiz.questions_json)
    ? quiz.questions_json
    : (typeof quiz.questions_json === 'string' ? JSON.parse(quiz.questions_json) : []);

  const handleSelect = (qIdx, optIdx) => {
    if (result) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const allAnswered = questions.length > 0 && Object.keys(selectedAnswers).length === questions.length;

  const handleSubmit = async () => {
    if (!allAnswered || !token) return;

    try {
      setIsSubmitting(true);
      const res = await claimQuizReward(token, quiz.id, selectedAnswers);
      if (res.success) {
        setResult(res);
        onRewardClaimed({
          points: res.reward_earned,
          newBalance: res.new_balance,
          title: quiz.title
        });
      }
    } catch (err) {
      console.warn('Quiz submit failed:', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Header */}
          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.badge}>
                <Brain size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.badgeText}>TRIVIA QUIZ</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.quizTitle}>{quiz.title}</Text>
            <View style={styles.rewardPill}>
              <Sparkles size={12} color="#fbbf24" />
              <Text style={styles.rewardPillText}>+{quiz.reward_points} PTS ($0.001/pt)</Text>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {result ? (
              <View style={styles.resultBox}>
                <Trophy size={48} color="#fbbf24" style={{ marginBottom: 12 }} />
                <Text style={[styles.resultTitle, { color: theme.text }]}>Quiz Completed!</Text>
                <Text style={[styles.resultScore, { color: theme.subtext }]}>Score: {result.score} / {result.total}</Text>
                <View style={styles.ptsAward}>
                  <Text style={styles.ptsAwardText}>+{result.reward_earned} PTS Credited</Text>
                </View>
                <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                  <Text style={styles.doneBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              questions.map((q, qIdx) => (
                <View key={qIdx} style={[styles.qCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: theme.border }]}>
                  <Text style={[styles.qText, { color: theme.text }]}>
                    {qIdx + 1}. {q.question}
                  </Text>
                  <View style={styles.optList}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswers[qIdx] === optIdx;
                      return (
                        <TouchableOpacity
                          key={optIdx}
                          style={[
                            styles.optBtn,
                            { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: theme.border },
                            isSelected && styles.optBtnSelected
                          ]}
                          onPress={() => handleSelect(qIdx, optIdx)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected ? <View style={styles.radioInner} /> : null}
                          </View>
                          <Text style={[styles.optText, { color: theme.subtext }, isSelected && styles.optTextSelected]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer Submit */}
          {!result ? (
            <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.submitBtn, (!allAnswered || isSubmitting) && styles.submitBtnDisabled]}
                disabled={!allAnswered || isSubmitting}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {allAnswered ? 'Submit Answers' : `Answer all questions (${Object.keys(selectedAnswers).length}/${questions.length})`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
    borderWidth: 1
  },
  header: {
    padding: 20
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  closeBtn: {
    padding: 4
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8
  },
  rewardPillText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700'
  },
  body: {
    padding: 16
  },
  qCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1
  },
  qText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10
  },
  optList: {
    gap: 8
  },
  optBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1
  },
  optBtnSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.15)'
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#64748b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  radioCircleSelected: {
    borderColor: '#8b5cf6'
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6'
  },
  optText: {
    fontSize: 12,
    flex: 1
  },
  optTextSelected: {
    color: '#8b5cf6',
    fontWeight: '700'
  },
  footer: {
    padding: 16,
    borderTopWidth: 1
  },
  submitBtn: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  submitBtnDisabled: {
    opacity: 0.5
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: 30
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800'
  },
  resultScore: {
    fontSize: 14,
    marginTop: 4
  },
  ptsAward: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginTop: 16,
    marginBottom: 20
  },
  ptsAwardText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800'
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#06b6d4',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  doneBtnText: {
    color: '#090d16',
    fontSize: 14,
    fontWeight: '800'
  }
});
