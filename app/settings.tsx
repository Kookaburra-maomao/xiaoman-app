import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import * as imageService from '@/services/imageService';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function SettingsScreen() {
  const { user, logout, updateUserInfo, refreshAuth, loading } = useAuth();
  const router = useRouter();
  const [recentlyDeletedCount] = useState(21); // 最近删除数量，实际应该从API获取
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [diaryEncryptionEnabled, setDiaryEncryptionEnabled] = useState(false);
  const [updatingDiarySecret, setUpdatingDiarySecret] = useState(false);

  // 页面聚焦时刷新用户信息，日记加密开关以 user.diary_secret 为准
  useFocusEffect(
    useCallback(() => {
      if (!user && !loading) {
        refreshAuth();
      }
      if (user?.diary_secret !== undefined) {
        setDiaryEncryptionEnabled(user.diary_secret === 'true');
      }
    }, [user, loading, refreshAuth])
  );

  const onDiaryEncryptionChange = useCallback(
    async (value: boolean) => {
      if (!user?.id) return;
      try {
        setUpdatingDiarySecret(true);
        await updateUserInfo({ diary_secret: value ? 'true' : 'false' });
        setDiaryEncryptionEnabled(value);
      } catch (e: any) {
        Alert.alert('错误', e?.message || '更新失败，请重试');
      } finally {
        setUpdatingDiarySecret(false);
      }
    },
    [user?.id, updateUserInfo]
  );

  // 处理头像选择
  const handleAvatarPress = () => {
    Alert.alert(
      '选择头像',
      '请选择图片来源',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '拍照',
          onPress: handleTakePhoto,
        },
        {
          text: '从相册选择',
          onPress: handlePickFromLibrary,
        },
      ]
    );
  };

  // 拍照
  const handleTakePhoto = async () => {
    try {
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndUpdateAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('拍照失败:', error);
      Alert.alert('错误', error.message || '拍照失败，请重试');
    }
  };

  // 从相册选择
  const handlePickFromLibrary = async () => {
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
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAndUpdateAvatar(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', error.message || '选择图片失败，请重试');
    }
  };

  // 上传并更新头像
  const uploadAndUpdateAvatar = async (imageUri: string) => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    try {
      setUploadingAvatar(true);

      // 上传图片
      const uploadResult = await imageService.uploadImage(imageUri);
      
      // 提取相对路径（去掉域名部分）
      const avatarPath = uploadResult.url.replace(apiUrl, '');

      // 更新用户信息
      await updateUserInfo({ avatar: avatarPath });

      Alert.alert('成功', '头像更新成功');
    } catch (error: any) {
      console.error('上传头像失败:', error);
      Alert.alert('错误', error.message || '上传头像失败，请重试');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('错误', '退出登录失败，请重试');
            }
          },
        },
      ]
    );
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      </SafeAreaView>
    );
  }

  // 如果用户信息不存在，显示提示并返回
  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>设置</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>用户信息不存在，请重新登录</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.7}
          >
            <Text style={styles.errorButtonText}>返回登录</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 用户资料部分 */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.7}
            disabled={uploadingAvatar}
          >
            <View style={styles.avatar}>
              {user?.avatar ? (
                <Image
                  source={{
                    uri: user.avatar.startsWith('http') ? user.avatar : `${apiUrl}${user.avatar}`,
                  }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={60} color={Colors.light.icon} />
              )}
              {uploadingAvatar && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.avatarEditButton}
              onPress={handleAvatarPress}
              activeOpacity={0.7}
              disabled={uploadingAvatar}
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
          <Text style={styles.username}>{user?.nick || user?.username || '用户'}</Text>
          {/* {(() => {
            // 检查是否是有效会员
            const isVipValid = () => {
              if (!user?.is_vip || user.is_vip === 'false') return false;
              if (!user?.vip_expire_time) return false;
              const expireTime = new Date(user.vip_expire_time);
              const now = new Date();
              return expireTime > now;
            };

            if (isVipValid()) {
              // 显示会员标签
              return (
                <Image
                  source={{ uri: VIP_TAG_URL }}
                  style={styles.vipTag}
                  resizeMode="contain"
                />
              );
            } else {
              // 显示非会员状态
              return (
                <View style={styles.membershipStatus}>
                  <Image
                    source={{ uri: VIP_NO_URL }}
                    style={styles.membershipStatusIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.membershipText}>非会员</Text>
                </View>
              );
            }
          })()} */}
        </View>
        {/* 会员推广横幅 */}
        {/* <ImageBackground
          source={{ uri: VIP_CARD_URL }}
          style={styles.membershipBanner}
          resizeMode="cover"
        >
          <View style={styles.membershipBannerContent}>
            <Text style={styles.membershipBannerText}>
              {(() => {
                // 检查是否是有效会员
                const isVipValid = () => {
                  if (!user?.is_vip || user.is_vip === 'false') return false;
                  if (!user?.vip_expire_time) return false;
                  const expireTime = new Date(user.vip_expire_time);
                  const now = new Date();
                  return expireTime > now;
                };

                if (isVipValid() && user?.vip_expire_time) {
                  // 格式化日期为 yyyy/mm/dd
                  const date = new Date(user.vip_expire_time);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `有效期至 ${year}/${month}/${day}`;
                } else {
                  return '新人专享，首月6元';
                }
              })()}
            </Text>
            <TouchableOpacity
              style={styles.membershipButton}
              activeOpacity={0.7}
              onPress={() => router.push('/vip-center')}
            >
              <LinearGradient
                colors={['#EAB287', '#EB3967']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.membershipButtonGradient}
              >
                <Text style={styles.membershipButtonText}>
                  {(() => {
                    const isVipValid = () => {
                      if (!user?.is_vip || user.is_vip === 'false') return false;
                      if (!user?.vip_expire_time) return false;
                      const expireTime = new Date(user.vip_expire_time);
                      const now = new Date();
                      return expireTime > now;
                    };
                    return isVipValid() ? '查看' : '立即开通';
                  })()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ImageBackground> */}

        {/* 设置选项组1 */}
        <View style={styles.settingsGroup}>
          {/* <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>日记加密</Text>
            </View>
            <View style={styles.settingItemRight}>
              {updatingDiarySecret ? (
                <ActivityIndicator size="small" color={Colors.light.tint} />
              ) : (
                <Switch
                  value={diaryEncryptionEnabled}
                  onValueChange={onDiaryEncryptionChange}
                  trackColor={{ false: '#E5E5E5', true: Colors.light.tint }}
                  thumbColor="#FFFFFF"
                />
              )}
            </View>
          </View> */}

          <TouchableOpacity 
            style={styles.settingItem} 
            activeOpacity={0.7}
            onPress={() => router.push('/diary-recycle-bin' as any)}
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name="trash-bin-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>日记回收站</Text>
            </View>
            <View style={styles.settingItemRight}>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="sunny-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>外观</Text>
            </View>
            <View style={styles.settingItemRight}>
              <Text style={styles.settingItemValue}>系统</Text>
              <Image 
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-sort.png' }} 
                style={{ width: scaleSize(16), height: scaleSize(16) }} 
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="trash-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>最近删除</Text>
            </View>
            <View style={styles.settingItemRight}>
              <Text style={styles.settingItemValue}>{recentlyDeletedCount}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 设置选项组2 */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>检查更新</Text>
            </View>
            <View style={styles.settingItemRight}>
              <Text style={styles.settingItemValue}>V1.01</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="book-outline" size={20} color="#FF6B9D" />
              <Text style={styles.settingItemText}>关于小满</Text>
            </View>
            <View style={styles.settingItemRight}>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 退出登录 */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={styles.settingItemLeft}>
              <Ionicons name="log-out-outline" size={20} color={Colors.light.text} />
              <Text style={styles.settingItemText}>退出登录</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#E5E5E5',
    backgroundColor: Colors.light.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  membershipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membershipStatusIcon: {
    width: 14,
    height: 14,
  },
  membershipText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  vipTag: {
    width: 80,
    height: 40,
  },
  membershipBanner: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 24,

    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  membershipBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingLeft: 90,
    paddingRight: 20,
  },
  membershipBannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#FFD8BB',
    fontFamily: 'PingFang SC',
  },
  membershipButton: {
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  membershipButtonGradient: {
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membershipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
  },
  settingsGroup: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingItemValue: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
