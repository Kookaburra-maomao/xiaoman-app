import ChatHeader from '@/components/chat/ChatHeader';
import PlanEditModal, { EditPlanFormData } from '@/components/plan/PlanEditModal';
import PlanItem from '@/components/plan/PlanItem';
import PlanSuccessModal from '@/components/plan/PlanSuccessModal';
import { Colors } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/urls';
import { useAuth } from '@/hooks/useAuth';
import { useLog } from '@/hooks/useLog';
import { usePlan } from '@/hooks/usePlan';
import { Plan, SuccessModalData } from '@/types/plan';
import { onPlanRefresh } from '@/utils/planRefreshEvent';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { log } = useLog();
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

  // 获取安全区域边距，用于计算header高度
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + scaleSize(16); // top inset + paddingTop + title height + date height + paddingBottom

  // 页面曝光打点
  useFocusEffect(
    useCallback(() => {
      log('PLAN_TAB_EXPO');
    }, [])
  );

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
        imageUrl = `${API_BASE_URL}/api/files/plan${randomNum}.png`;
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
      // 显示选择对话框
      Alert.alert(
        '选择图片',
        '请选择图片来源',
        [
          {
            text: '拍照',
            onPress: async () => {
              // 请求摄像头权限
              const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
              if (cameraStatus !== 'granted') {
                Alert.alert('提示', '需要摄像头权限');
                return;
              }

              // 打开摄像头
              const result = await ImagePicker.launchCameraAsync({
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

                // 关闭弹窗并跳转到聊天页面
                setShowSuccessModal(false);
                router.push('/(tabs)/chat');
              }
              setIsUploadingImage(false);
            },
          },
          {
            text: '从相册选择',
            onPress: async () => {
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

                // 关闭弹窗并跳转到聊天页面
                setShowSuccessModal(false);
                router.push('/(tabs)/chat');
              }
              setIsUploadingImage(false);
            },
          },
          {
            text: '取消',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      console.error('上传图片失败:', error);
      Alert.alert('错误', error.message || '图片上传失败，请重试');
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

  // 处理进入设置页面
  const handleGoToSettings = () => {
    router.push('/settings');
  };

  // 处理进入管理计划页面
  const handleGoToManage = () => {
    log('PLAN_MANAGE');
    router.push('/plan-manage');
  };

  // 处理新增计划
  const handleAddPlan = () => {
    // 打点：点击新增计划
    log('PLAN_CREATE');

    setShowCreateModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* 头部 - 添加顶部内边距以避免被状态栏遮挡 */}
        <View style={{ paddingTop: scaleSize(0) }}>
          <ChatHeader
            title="计划"
            showCard={false}
            onToggleCard={() => { }} // 不展示运营卡片按钮，空函数
            onShowMenu={handleGoToSettings}
            hideCardButton={true} // 隐藏运营卡片按钮
          />
        </View>

       
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingTop: Platform.OS === 'ios' ? scaleSize(60) : scaleSize(90) }]}
        >
          {/* 统计信息 */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryText} allowFontScaling={false}>
              你共<Text style={styles.summaryNumber} allowFontScaling={false}>{plans.length}</Text>项计划进行中
            </Text>
            <TouchableOpacity
              style={styles.manageIcon}
              onPress={handleGoToManage}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-manage.png' }}
                style={styles.manageIconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* 计划列表 */}
          {plans.map((plan) => (
            <PlanItem
              key={plan.id}
              plan={plan}
              onCheckIn={onCheckIn}
              loading={loading}
              userId={user?.id}
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
              <Text style={styles.addPlanText} allowFontScaling={false}>新增计划</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        
      </KeyboardAvoidingView>
      {/* 打卡成功弹窗 */}
      <PlanSuccessModal
        visible={showSuccessModal}
        data={successModalData}
        uploadedImageUrl={uploadedImageUrl}
        isUploadingImage={isUploadingImage}
        userId={user?.id}
        onClose={() => setShowSuccessModal(false)}
        onUploadImage={onUploadImage}
      />

      {/* 创建计划抽屉 */}
      <PlanEditModal
        visible={showCreateModal}
        plan={null}
        planImageUrl={uploadedImageUrl || undefined}
        saving={saving}
        userId={user?.id}
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
  keyboardView: {
    flex: 1,
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
    paddingHorizontal: scaleSize(16),
    paddingBottom: scaleSize(20),
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(16),
  },
  summaryText: {
    fontSize: scaleSize(16),
  },
  summaryNumber: {
    fontWeight: 'bold',
  },
  manageIcon: {
    marginLeft: scaleSize(8),
    width: scaleSize(24),
    height: scaleSize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageIconImage: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  addPlanItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginTop: scaleSize(12),

  },
  addPlanContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(8),
  },
  addPlanText: {
    fontSize: scaleSize(16),
    color: Colors.light.text,
    fontWeight: '500',
  },
});
