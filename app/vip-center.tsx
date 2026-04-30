/**
 * 会员中心页面（IAP 内购版）
 */

import { Colors } from '@/constants/theme';
import {
  ICON_OPTION_DARK_URL,
  ICON_RETURN_DARK_URL,
  ICON_VIP_URL,
  VIP_BANNER_URL,
  VIP_HEADER_BG_URL,
  VIP_NEW_FLAG_URL,
  VIP_NORMAL_URL,
  VIP_RIGHT_ICON_URL,
  VIP_SELECTED_URL,
  VIP_TEXT_GRADIENT_URL,
} from '@/constants/urls';
import { useAuth } from '@/hooks/useAuth';
import { useIAP } from '@/hooks/useIAP';
import { APPLE_VIP_PLANS } from '@/services/iapService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function VipCenterScreen() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const { products, isPurchasing, isLoading: iapLoading, purchase, restorePurchases } = useIAP();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // 检查是否是有效会员
  const isVipValid = () => {
    if (!user?.is_vip || user.is_vip === 'false') return false;
    if (!user.vip_expire_time) return false;
    const expireTime = new Date(user.vip_expire_time);
    const now = new Date();
    return expireTime > now;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 从苹果商品列表中获取当前选择的商品
  const getSelectedProduct = () => {
    const plan = APPLE_VIP_PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return null;
    // 如果苹果有返回价格信息，用苹果的
    if (products.length > 0) {
      const appleProduct = products.find((p) => p.id === plan.productId);
      if (appleProduct) {
        return {
          ...plan,
          price: appleProduct.price ?? plan.price,
          localizedPrice: appleProduct.displayPrice,
        };
      }
    }
    return plan;
  };

  // 处理支付
  const handlePayment = async () => {
    if (!agreedToTerms) {
      Alert.alert('提示', '请先阅读并同意会员协议和续费协议');
      return;
    }
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }
    // iOS 以外的平台提示
    if (Platform.OS !== 'ios') {
      Alert.alert('提示', '会员功能仅支持 iOS 设备');
      return;
    }
    await purchase(selectedPlan);
  };

  // 恢复购买
  const handleRestore = async () => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }
    setRestoring(true);
    try {
      await restorePurchases();
      await refreshAuth();
    } finally {
      setRestoring(false);
    }
  };

  // 获取会员状态下标
  const getVipStatusLabel = () => {
    if (isVipValid()) {
      return `有效期至 ${formatDate(user?.vip_expire_time || '')}`;
    }
    return '会员已过期';
  };

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${apiUrl}${user.avatar}`
    : null;

  const selectedProduct = getSelectedProduct();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* 头部背景区域 */}
        <ImageBackground
          source={{ uri: VIP_HEADER_BG_URL }}
          style={styles.headerBackground}
          resizeMode="cover"
        >
          <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
            {/* 标题栏 */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: ICON_RETURN_DARK_URL }}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>小满会员中心</Text>
              <TouchableOpacity style={styles.optionButton} activeOpacity={0.7}>
                <Image
                  source={{ uri: ICON_OPTION_DARK_URL }}
                  style={styles.optionIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* 个人信息区域 */}
            <View style={styles.profileSection}>
              <LinearGradient
                colors={['#FE4571', '#FEBA8F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarContainer}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color={Colors.light.icon} />
                    </View>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{user?.nick || user?.username || '用户'}</Text>
                {isVipValid() && user?.vip_expire_time && (
                  <View style={styles.vipInfo}>
                    <Image
                      source={{ uri: ICON_VIP_URL }}
                      style={styles.vipIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.vipExpireText}>{getVipStatusLabel()}</Text>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* 会员套餐选择模块 */}
        <ImageBackground
          source={{ uri: VIP_BANNER_URL }}
          style={styles.vipBanner}
          resizeMode="stretch"
        >
          {iapLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.loadingText}>加载商品中...</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {APPLE_VIP_PLANS.map((plan) => {
                const appleProduct = products.find((p) => p.id === plan.productId);
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={styles.planCard}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{
                        uri: selectedPlan === plan.id ? VIP_SELECTED_URL : VIP_NORMAL_URL,
                      }}
                      style={styles.planCardBackground}
                      resizeMode="stretch"
                    />
                    {plan.isNew && (
                      <ImageBackground
                        source={{ uri: VIP_NEW_FLAG_URL }}
                        style={styles.newFlag}
                        resizeMode="contain"
                      >
                        <Text style={styles.newFlagText}>新客专项</Text>
                      </ImageBackground>
                    )}
                    <View style={styles.planCardContent}>
                      <Text style={styles.planName}>{plan.name}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceUnit}>￥</Text>
                        <Text style={styles.priceValue}>
                          {appleProduct ? (appleProduct.price ?? plan.price) : plan.price}
                        </Text>
                      </View>
                      <Text style={styles.originalPrice}>￥{plan.originalPrice}元</Text>
                      <Text style={styles.discount}>{plan.discount}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ImageBackground>

        {/* 会员权益 */}
        <View style={styles.benefitsSection}>
          <View style={styles.benefitsTitle}>
            <Image
              source={{ uri: VIP_TEXT_GRADIENT_URL }}
              style={styles.benefitsTitleGradientImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.benefitsCardContainer}>
            <View style={styles.benefitCard}>
              <Text style={styles.benefitCategory}>聊天与日记</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>无限对话与日记</Text>
                <Image source={{ uri: VIP_RIGHT_ICON_URL }} style={styles.benefitIcon} resizeMode="contain" />
              </View>
              <View style={styles.benefitDivider} />
              <Text style={styles.benefitCategory}>AI 功能</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>智能分析、情绪树洞、待办管理</Text>
                <Image source={{ uri: VIP_RIGHT_ICON_URL }} style={styles.benefitIcon} resizeMode="contain" />
              </View>
              <View style={styles.benefitDivider} />
              <Text style={styles.benefitCategory}>数据与隐私</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitText}>端到端加密、永久存储</Text>
                <Image source={{ uri: VIP_RIGHT_ICON_URL }} style={styles.benefitIcon} resizeMode="contain" />
              </View>
            </View>
          </View>
        </View>

        {/* 支付按钮 */}
        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePayment}
            activeOpacity={0.8}
            disabled={isPurchasing || iapLoading || !selectedProduct}
          >
            <LinearGradient
              colors={['#FF336C', '#FFC591']}
              start={{ x: 0.1833, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentButtonGradient}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.paymentButtonText}>
                  {selectedProduct
                    ? `立即支付 ￥${selectedProduct.price}`
                    : '加载中...'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 恢复购买 */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={restoring}
            activeOpacity={0.7}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.restoreText}>恢复购买</Text>
            )}
          </TouchableOpacity>

          {/* 协议同意 */}
          <TouchableOpacity
            style={styles.agreementContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={agreedToTerms ? 'checkbox' : 'square-outline'}
              size={14}
              color="#FFFFFF"
            />
            <Text style={styles.agreementText}>
              已阅读并同意 会员协议 和 续费协议
            </Text>
          </TouchableOpacity>

          {/* 自动续费说明 */}
          <Text style={styles.renewNotice}>
            订阅会自动续费，可随时在 iPhone 设置中取消
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  headerBackground: {
    width: '100%',
    paddingTop: 0,
    paddingBottom: 20,
  },
  safeAreaTop: {
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: -0.41,
    color: '#FFFFFF',
  },
  optionButton: {
    width: 24,
    height: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 24,
    height: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginTop: 16,
    marginLeft: 16,
    marginBottom: 20,
  },
  avatarBorder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarContainer: {
    width: 44.4,
    height: 44.4,
    borderRadius: 22.2,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  username: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  vipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vipIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  vipExpireText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  vipBanner: {
    width: '100%',
  },
  plansContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  planCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    height: 180,
    position: 'relative',
  },
  planCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  newFlag: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 64,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newFlagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  planCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  planName: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceUnit: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 12,
    color: '#FFFFFF',
  },
  priceValue: {
    fontFamily: 'PingFang SC',
    fontWeight: '700',
    fontSize: 28,
    color: '#FFFFFF',
  },
  originalPrice: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  discount: {
    fontFamily: 'PingFang SC',
    fontWeight: '500',
    fontSize: 10,
    color: '#FEBA8F',
    marginTop: 2,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  benefitsTitle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitsTitleGradientImage: {
    width: 96,
    height: 24,
  },
  benefitsCardContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  benefitCard: {
    padding: 20,
  },
  benefitCategory: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  benefitText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  benefitIcon: {
    width: 16,
    height: 16,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    alignItems: 'center',
  },
  paymentButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  paymentButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentButtonText: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  restoreButton: {
    marginBottom: 16,
  },
  restoreText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  agreementText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 12,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  renewNotice: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },
});
