/**
 * 会员中心页面
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
import { useAuth } from '@/contexts/AuthContext';
import { post } from '@/utils/request';
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
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

interface VipPlan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  isNew?: boolean;
}

const vipPlans: VipPlan[] = [
  {
    id: 'monthly',
    name: '连续包月',
    price: 6,
    originalPrice: 12,
    discount: '立省50%',
    isNew: true,
  },
  {
    id: 'single',
    name: '1个月',
    price: 9.9,
    originalPrice: 12,
    discount: '立省30%',
  },
];

interface VipBenefit {
  category: string;
  items: string[];
}

const vipBenefits: VipBenefit[] = [
  {
    category: '聊天和日记',
    items: ['500 条对话/天', '50 张图片/天', '30 篇日记/天'],
  },
  {
    category: '长期记忆',
    items: ['知你冷暖,越来越懂你', '无限时间段', '无限对话、日记数量'],
  },
  {
    category: '隐私与同步',
    items: ['端到端加密,无忧记录生活', '基于XX 技术加密', '数据多端同步,用不丢失'],
  },
];

export default function VipCenterScreen() {
  const router = useRouter();
  const { user, updateVipExpireTime } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paying, setPaying] = useState(false);

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
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
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

    try {
      setPaying(true);
      const result = await post(`/api/users/${user.id}/vip`, {
        vipType: 'month',
      });

      if (result.code === 200) {
        // 计算新的会员到期时间（当前时间 + 1个月）
        const now = new Date();
        const expireTime = new Date(now);
        expireTime.setMonth(expireTime.getMonth() + 1);
        const vipExpireTimeStr = expireTime.toISOString();

        // 更新用户信息中的 vip_expire_time
        try {
          await updateVipExpireTime(vipExpireTimeStr);
        } catch (error) {
          console.error('更新会员信息失败:', error);
          // 即使更新失败，支付已成功，继续导航
        }
        // 导航到设置页面
        router.push('/settings');
        Alert.alert('成功', '会员开通成功');
      } else {
        throw new Error(result.message || '支付失败');
      }
    } catch (error: any) {
      console.error('支付失败:', error);
      Alert.alert('错误', error.message || '支付失败，请重试');
    } finally {
      setPaying(false);
    }
  };

  const avatarUrl = user?.avatar
    ? user.avatar.startsWith('http')
      ? user.avatar
      : `${apiUrl}${user.avatar}`
    : null;

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
              <View
                style={styles.profileInfo}
              >
                <Text style={styles.username}>{user?.nick || user?.username || '用户'}</Text>
                {isVipValid() && user?.vip_expire_time && (
                  <View style={styles.vipInfo}>
                    <Image
                      source={{ uri: ICON_VIP_URL }}
                      style={styles.vipIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.vipExpireText}>有效期至 {formatDate(user.vip_expire_time)}</Text>
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
          <View style={styles.plansContainer}>
            {vipPlans.map((plan) => (
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
                    <Text style={styles.priceValue}>{plan.price}</Text>
                  </View>
                  <Text style={styles.originalPrice}>￥{plan.originalPrice}元</Text>
                  <Text style={styles.discount}>{plan.discount}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
            {vipBenefits.map((benefit, index) => (
              <View key={index}>
                {index > 0 && <View style={styles.benefitDivider} />}
                <View style={styles.benefitCard}>
                  <Text style={styles.benefitCategory}>{benefit.category}</Text>
                  {benefit.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.benefitItem}>
                      <Text style={styles.benefitText}>{item}</Text>
                      <Image
                        source={{ uri: VIP_RIGHT_ICON_URL }}
                        style={styles.benefitIcon}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 支付按钮 */}
        <View style={styles.paymentSection}>
          <TouchableOpacity
            style={styles.paymentButton}
            onPress={handlePayment}
            activeOpacity={0.8}
            disabled={paying}
          >
            <LinearGradient
              colors={['#FF336C', '#FFC591']}
              start={{ x: 0.1833, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.paymentButtonGradient}
            >
              {paying ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.paymentButtonText}>
                  立即支付 ￥{vipPlans.find(p => p.id === selectedPlan)?.price || '0'}
                </Text>
              )}
            </LinearGradient>
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
    backdropFilter: 'blur(5px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backdropFilter: 'blur(5px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    backgroundColor: 'linear-gradient(90deg, #FE4571 0%, #FEBA8F 100%)',
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
    // marginTop: 20,
  },
  plansContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 24,
    gap: 12,
  },
  planCard: {
    flex: 1,
    position: 'relative',
    minHeight: 200,
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
    left: -1,
    top: -10,
    width: 60,
    height: 20,
    zIndex: 1,
  },
  newFlagText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  planCardContent: {
    padding: 20,
    paddingTop: 20,
  },
  planName: {
    marginTop: 20,
    marginLeft: 0,
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    marginLeft: 0,
  },
  priceUnit: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '400',
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  priceValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontWeight: '700',
    fontSize: 40,
    lineHeight: 40,
    color: '#FFFFFF',
  },
  originalPrice: {
    marginTop: 4,
    marginLeft: 0,
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  discount: {
    marginTop: 4,
    marginLeft: 0,
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 22,
    color: '#FF326C',
  },
  benefitsSection: {
    backgroundColor: '#000000',
    paddingTop: 0,
  },
  benefitsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    marginBottom: 16,
  },

  benefitsTitleGradientImage: {
    width: 160,
    height: 40,
    marginLeft: 0,
  },
  benefitsCardContainer: {
    padding: 16,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232323',
    overflow: 'hidden',
  },
  benefitCard: {
    
  },
  benefitDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#232323',
  },
  benefitCategory: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  benefitText: {
    flex: 1,
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  benefitIcon: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  paymentSection: {
    marginTop: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  agreementText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
  },
});
