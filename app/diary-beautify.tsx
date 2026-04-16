/**
 * 日记美化结果页 - WebView 渲染 HTML，渲染完成后截屏整页上传保存
 */

import Toast from '@/components/common/Toast';
import { createTemplateLog } from '@/services/chatService';
import * as imageService from '@/services/imageService';
import { scaleSize } from "@/utils/screen";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';
import { WebView } from 'react-native-webview';

const RETURN_ICON = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function DiaryBeautifyScreen() {
  const router = useRouter();
  const { diaryId, templateId, userId } = useLocalSearchParams<{
    diaryId: string; templateId: string; userId: string;
  }>();
  const [html, setHtml] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [webViewHeight, setWebViewHeight] = useState(0);
  const viewShotRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const webViewRef = useRef<WebView>(null);
  const hasTriedSaveRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem('@beautify_html').then((data) => {
      if (data) {
        setHtml(data);
        AsyncStorage.removeItem('@beautify_html');
      }
    });
  }, []);

  // WebView 通过 JS 获取页面 scrollHeight（不修改任何样式）
  const heightScript = `
    (function() {
      function sendHeight() {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
      }
      setTimeout(sendHeight, 2000);
      setTimeout(sendHeight, 4000);
      setTimeout(sendHeight, 6000);
    })();
    true;
  `;

  const lastHeightRef = useRef(0);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.value > 0) {
        lastHeightRef.current = data.value;
        setWebViewHeight(data.value);
        
        // 每次收到新高度，重置截屏定时器（等最后一次稳定后再截）
        if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
        captureTimerRef.current = setTimeout(() => {
          if (!hasTriedSaveRef.current && diaryId) {
            hasTriedSaveRef.current = true;
            captureAndUpload();
          }
        }, 2000);
      }
    } catch {}
  };

  // 移除旧的 useEffect 触发，改为在 handleMessage 中触发

  const captureAndUpload = async () => {
    try {
      setIsSaving(true);

      // 滚动到顶部
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      await new Promise(r => setTimeout(r, 500));

      if (!viewShotRef.current?.capture) return;
      const uri = await viewShotRef.current.capture();
      console.log('[Beautify] 截屏完成:', uri);

      const uploadResult = await imageService.uploadImage(uri);
      const imageUrl = uploadResult.url;
      console.log('[Beautify] 上传完成:', imageUrl);

      if (diaryId && templateId && userId) {
        await createTemplateLog({
          user_id: userId,
          diary_id: diaryId,
          template_id: templateId,
          diary_image: imageUrl,
          diary_html: html || '',
        });
      }
      console.log('[Beautify] 模版记录创建完成');

      setSaved(true);
      setToastVisible(true);
    } catch (e: any) {
      console.error('[Beautify] 保存失败:', e);
      Alert.alert('提示', '美化图片保存失败: ' + (e.message || '请重试'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (diaryId) {
            router.replace({ pathname: '/diary-detail', params: { diaryId } } as any);
          } else {
            router.back();
          }
        }} style={styles.backButton}>
          <Image source={{ uri: RETURN_ICON }} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>美化日记</Text>
        <View style={styles.headerRight}>
          {saved && <Text style={styles.savedText} allowFontScaling={false}>已保存</Text>}
          {isSaving && <Text style={styles.savingText} allowFontScaling={false}>保存中...</Text>}
        </View>
      </View>
      {html ? (
        <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          >
            <WebView
              ref={webViewRef}
              source={{ html }}
              style={{ width: SCREEN_WIDTH, height: webViewHeight || Dimensions.get('window').height }}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              scrollEnabled={false}
              injectedJavaScript={heightScript}
              onMessage={handleMessage}
            />
          </ViewShot>
        </ScrollView>
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText} allowFontScaling={false}>加载中...</Text>
        </View>
      )}
      <Toast visible={toastVisible} message="日记已保存" onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12),
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(16), fontWeight: '600', color: '#222222' },
  headerRight: { width: scaleSize(60), alignItems: 'flex-end' },
  savedText: { fontSize: scaleSize(12), color: '#4CAF50' },
  savingText: { fontSize: scaleSize(12), color: '#999999' },
  scrollView: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: scaleSize(14), color: '#999999' },
});
