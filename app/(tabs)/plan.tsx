import PlanEditModal, { EditPlanFormData } from '@/components/plan/PlanEditModal';
import PlanItem from '@/components/plan/PlanItem';
import PlanSuccessModal from '@/components/plan/PlanSuccessModal';
import { WEEKDAYS } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { usePlan } from '@/hooks/usePlan';
import { Plan, SuccessModalData } from '@/types/plan';
import { onPlanRefresh } from '@/utils/planRefreshEvent';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlanScreen() {
  const router = useRouter();
  const {
    plans,
    loading,
    fetchPlans,
    handleCheckIn,
    handleCreatePlan,
    handleUploadImage,
  } = usePlan();

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<SuccessModalData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  // 处理打卡
  const onCheckIn = async (plan: Plan) => {
    const result = await handleCheckIn(plan);
    if (result) {
      setSuccessModalData(result);
      setUploadedImageUrl(''); // 重置图片URL
      setShowSuccessModal(true);
    }
  };

  // 处理创建计划
  const handleCreatePlanSave = async (formData: EditPlanFormData) => {
    try {
      setSaving(true);
      
      // 如果 formData 中有 image 和 image_preview，使用它们；否则使用默认图片
      let imageUrl = formData.image;
      let imagePreviewUrl = formData.image_preview;
      
      if (!imageUrl) {
        // 如果没有通过 plan_tag 生成的图片，使用默认图片
        const randomNum = Math.floor(Math.random() * 18) + 1;
        imageUrl = `http://xiaomanriji.com/api/files/plan${randomNum}.png`;
      }
      
      const success = await handleCreatePlan({
        name: formData.name,
        cycle: formData.cycle,
        times: formData.times,
        gmt_limit: formData.gmt_limit,
        description: '', // 始终传空字符串
        image: imageUrl,
        image_preview: imagePreviewUrl,
      });
      if (success) {
        setShowCreateModal(false);
        setUploadedImageUrl(''); // 重置图片URL
      }
    } catch (error: any) {
      console.error('创建计划失败:', error);
      Alert.alert('错误', error.message || '创建计划失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理图片上传
  const onUploadImage = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限');
        return;
      }

      // 打开相册
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setIsUploadingImage(true);
      const uploadResult = await handleUploadImage(result.assets[0].uri);
      
      if (uploadResult) {
        setUploadedImageUrl(uploadResult.imageUrl);
        Alert.alert('成功', '图片上传成功');
      }
    } catch (error: any) {
      console.error('上传图片失败:', error);
      Alert.alert('错误', error.message || '图片上传失败，请重试');
    } finally {
      setIsUploadingImage(false);
    }
  };


  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // 页面聚焦时刷新数据（从其他页面返回时，或从对话页面创建计划后）
  useFocusEffect(
    useCallback(() => {
      fetchPlans();
    }, [fetchPlans])
  );

  // 监听计划数据刷新事件（从对话页面创建计划后）
  useEffect(() => {
    const unsubscribe = onPlanRefresh(() => {
      fetchPlans();
    });
    return unsubscribe;
  }, [fetchPlans]);

  // 格式化当前日期和星期
  const currentDateInfo = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekday = WEEKDAYS[now.getDay()];
    return {
      date: `${month}月${day}日`,
      weekday: weekday,
    };
  }, []);

  // 处理进入设置页面
  const handleGoToSettings = () => {
    router.push('/settings');
  };

  // 处理进入管理计划页面
  const handleGoToManage = () => {
    router.push('/plan-manage');
  };

  // 处理新增计划
  const handleAddPlan = () => {
    setShowCreateModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 页面头部 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>计划</Text>
          <Text style={styles.headerDate}>
            {currentDateInfo.date} · {currentDateInfo.weekday}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={handleGoToSettings}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {loading && plans.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* 统计信息 */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryText}>
              你共<Text style={styles.summaryNumber}>{plans.length}</Text>项计划进行中
            </Text>
            <TouchableOpacity
              style={styles.manageIcon}
              onPress={handleGoToManage}
              activeOpacity={0.7}
            >
              <Ionicons name="options-outline" size={20} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          {/* 计划列表 */}
          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              plan={plan}
              onCheckIn={onCheckIn}
              loading={loading}
            />
          ))}

          {/* 新增计划item */}
          <TouchableOpacity
            style={styles.addPlanItem}
            onPress={handleAddPlan}
            activeOpacity={0.7}
          >
            <View style={styles.addPlanContent}>
              <Ionicons name="add" size={24} color={Colors.light.text} />
              <Text style={styles.addPlanText}>新增计划</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* 打卡成功弹窗 */}
      <PlanSuccessModal
        visible={showSuccessModal}
        data={successModalData}
        uploadedImageUrl={uploadedImageUrl}
        isUploadingImage={isUploadingImage}
        onClose={() => setShowSuccessModal(false)}
        onUploadImage={onUploadImage}
      />

      {/* 创建计划抽屉 */}
      <PlanEditModal
        visible={showCreateModal}
        plan={null}
        planImageUrl={uploadedImageUrl || undefined}
        saving={saving}
        onClose={() => {
          setShowCreateModal(false);
          setUploadedImageUrl('');
        }}
        onSave={handleCreatePlanSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F1F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  headerRight: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 20,
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  summaryNumber: {
    fontWeight: 'bold',
  },
  manageIcon: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlanItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPlanText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
});
