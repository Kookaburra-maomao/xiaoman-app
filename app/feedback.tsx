import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function FeedbackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [score, setScore] = useState(10); // 默认10分
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 提交反馈
  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`${apiUrl}/api/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id,
          content: content.trim(),
          score: score,
        }),
      });

      const result = await response.json();

      if (response.ok && result.code === 200) {
        Alert.alert('提示', '感谢您的反馈~', [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } else {
        throw new Error(result.message || '提交失败');
      }
    } catch (error: any) {
      console.error('提交反馈失败:', error);
      Alert.alert('错误', error.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-top-return.png' }}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>用户反馈</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 评分 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>评分</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setScore(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Text style={[
                    styles.starText,
                    star <= score && styles.starTextActive
                  ]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.scoreText}>{score} 分</Text>
          </View>

          {/* 反馈内容 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>反馈内容</Text>
            <TextInput
              style={styles.textInput}
              placeholder="请输入您的反馈内容..."
              placeholderTextColor={Colors.light.icon}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={content}
              onChangeText={setContent}
              maxLength={1000}
            />
            <Text style={styles.charCount}>{content.length}/1000</Text>
          </View>
        </ScrollView>

        {/* 提交按钮 */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>提交</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(16),
    borderBottomWidth: scaleSize(1),
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: {
    width: scaleSize(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: scaleSize(20),
  },
  section: {
    marginBottom: scaleSize(32),
  },
  sectionLabel: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: scaleSize(16),
  },
  starsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  starButton: {
    width: scaleSize(24),
    height: scaleSize(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    fontSize: scaleSize(24),
    color: '#D0D0D0',
  },
  starTextActive: {
    color: '#FFD700',
  },
  scoreText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
    marginTop: scaleSize(12),
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    fontSize: scaleSize(16),
    color: Colors.light.text,
    minHeight: scaleSize(200),
    borderWidth: scaleSize(1),
    borderColor: '#E5E5E5',
  },
  charCount: {
    fontSize: scaleSize(12),
    color: Colors.light.icon,
    textAlign: 'right',
    marginTop: scaleSize(8),
  },
  submitContainer: {
    padding: scaleSize(20),
    paddingBottom: scaleSize(30),
    backgroundColor: Colors.light.background,
  },
  submitButton: {
    backgroundColor: '#000000',
    borderRadius: scaleSize(14),
    height: scaleSize(50),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
