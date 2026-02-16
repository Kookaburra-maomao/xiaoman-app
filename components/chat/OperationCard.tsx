/**
 * 运营卡片组件（可滑动）
 */

import { Colors } from '@/constants/theme';
import { OperationCard } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Dimensions, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = scaleSize(335); // 卡片宽度固定为 335px
const CARD_HEIGHT = scaleSize(240); // 卡片高度固定为 240px
const CARD_MARGIN_RIGHT = scaleSize(16); // 卡片右边距
const VISIBLE_PADDING = scaleSize(20); // 左右可见区域的内边距，用于露出相邻卡片
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN_RIGHT; // 分页间隔 = 卡片宽度 + 卡片右边距
const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

interface OperationCardProps {
  cards: OperationCard[];
  username: string;
  onItemSelect: (promptRule: string, text: string, emoji: string) => void;
}

export default function OperationCardCarousel({ cards, username, onItemSelect }: OperationCardProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // 获取当前时间段
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 11) {
      return '早上';
    } else if (hour >= 11 && hour < 14) {
      return '中午';
    } else if (hour >= 14 && hour < 19) {
      return '下午';
    } else {
      return '晚上';
    }
  };

  // 处理选项点击
  const handleItemPress = (card: OperationCard, itemIndex: number) => {
    const item = card.record_item[itemIndex];
    if (item && item.text) {
      onItemSelect(card.prompt_rule, item.text, item.emoji);
    }
  };

  // 处理按钮点击
  const handleButtonPress = (contentUrl?: string) => {
    if (contentUrl) {
      // 如果是http/https链接，使用Linking打开
      if (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) {
        // 使用Linking打开外部链接
        Linking.openURL(contentUrl).catch((err: any) => console.error('打开链接失败:', err));
      } else {
        // 内部路由
        router.push(contentUrl as any);
      }
    }
  };

  // 判断是否为图片URL
  const isImageUrl = (str: string): boolean => {
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
  };

  // 处理图片URL
  const getImageUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${apiUrl}${url}`;
  };

  // 渲染单个卡片
  const renderCard = ({ item, index }: { item: OperationCard; index: number }) => {
    const isLast = index === (cards?.length || 0) - 1;
    const recordItems = item.record_item || [];
    const hasItems = recordItems.length > 0;
    const hasTopic = !!item.record_topic;
    const hasButton = !!(item.button_name && item.content_url);
    const hasBgImage = !!item.bg_image;
    
    // 处理背景图片URL
    let bgImageUrl = '';
    if (hasBgImage && item.bg_image) {
      bgImageUrl = getImageUrl(item.bg_image);
    }

    // 判断渲染类型
    const isType1 = hasItems && hasTopic && !hasButton; // 有选项、有问题、没有按钮
    const isType2 = !hasItems && hasTopic && hasButton; // 有问题、没有选项、有按钮
    const isType3 = !hasItems && hasTopic && !hasButton; // 有问题、无选项、无按钮

    return (
      <View style={[
        styles.cardContainer, 
        { 
          width: CARD_WIDTH,
          backgroundColor: hasBgImage ? 'transparent' : Colors.light.background,
        },
        isLast && styles.cardContainerLast,
      ]} key={item.id}>
        {/* 背景图片 */}
        {hasBgImage && bgImageUrl && (
          <Image
            source={{ uri: bgImageUrl }}
            style={styles.cardBackground}
            resizeMode="cover"
          />
        )}        
        {/* 情况1: 有选项、有问题、没有按钮 */}
        {isType1 && (
          <View style={styles.type1Container}>
            <Text style={styles.type1Text}>{item.record_topic}</Text>
            <View style={styles.type1ItemsContainer}>
              {recordItems.map((recordItem, itemIndex) => {
                const isEmojiImage = isImageUrl(recordItem.emoji);
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.type1Item,
                      (itemIndex + 1) % 3 === 0 && { marginRight: 0 }, // 每行第三个不需要右边距
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleItemPress(item, itemIndex)}
                  >
                    {isEmojiImage ? (
                      <Image
                        source={{ uri: getImageUrl(recordItem.emoji) }}
                        style={styles.type1ItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.type1ItemEmoji}>
                        <Text style={{ fontSize: scaleSize(52), lineHeight: scaleSize(52) }}>
                          {recordItem.emoji}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.type1ItemText}>{recordItem.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 情况2: 有问题、没有选项、有按钮 */}
        {isType2 && (
          <View style={styles.type2Container}>
            <View style={styles.type2Text}>
              <Text style={{ color: '#FFFFFF', fontSize: scaleSize(20), lineHeight: scaleSize(28), textAlign: 'center' }}>
                {item.record_topic}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.type2Button}
              activeOpacity={0.7}
              onPress={() => handleButtonPress(item.content_url)}
            >
              <Text 
                style={[
                  styles.type2ButtonText,
                  item.button_name && item.button_color && { color: item.button_color }
                ]}
              >
                {item.button_name}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 情况3: 有问题、无选项、无按钮 */}
        {isType3 && (
          <View style={styles.type3Container}>
            <Text style={styles.type3Text}>{item.record_topic}</Text>
          </View>
        )}
      </View>
    );
  };

  // 滚动事件处理（保留用于可能的后续功能）
  const onScroll = useCallback((event: any) => {
    // 可以用于后续功能，如自动播放等
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={cards}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.light.background,
    marginTop: 8,
    marginBottom: 8,
  },
  flatList: {
    width: '100%',
  },
  listContent: {
    paddingHorizontal: VISIBLE_PADDING,
  },
  // ==================== 基础容器样式 ====================
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: scaleSize(8),
    overflow: 'hidden',
    position: 'relative',
    marginRight: CARD_MARGIN_RIGHT,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(8),
  },
  // 第一个和最后一个卡片需要特殊处理，确保左右都能露出相邻卡片
  cardContainerFirst: {
    marginLeft: 0,
  },
  cardContainerLast: {
    marginRight: VISIBLE_PADDING,
  },
  cardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    width: '100%',
    height: '100%',
  },
  // ==================== 情况1: 有选项、有问题、没有按钮 ====================
  type1Container: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  type1Text: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: scaleSize(20),
    lineHeight: scaleSize(28),
    textAlign: 'center',
    color: '#333',
    marginBottom: scaleSize(12),
    width: '100%',
    marginTop: scaleSize(24),
  },
  type1ItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  type1Item: {
    width: scaleSize(93),
    height: scaleSize(78),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: scaleSize(0.5),
    borderColor: '#E1E1E1',
    borderRadius: scaleSize(12),
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: scaleSize(8),
    marginBottom: scaleSize(8),
    justifyContent: 'center',
  },
  type1ItemEmoji: {
    width: scaleSize(52),
    height: scaleSize(52),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(4),
  },
  type1ItemImage: {
    width: scaleSize(52),
    height: scaleSize(52),
    borderRadius: scaleSize(4),
    marginTop: scaleSize(4),
  },
  type1ItemText: {
    fontSize: scaleSize(10),
    color: '#333',
    textAlign: 'center',
    lineHeight: scaleSize(14),
    marginTop: scaleSize(4),
  },
  // ==================== 情况2: 有问题、没有选项、有按钮 ====================
  type2Container: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    paddingTop: scaleSize(32),
    paddingBottom: scaleSize(32),
    paddingLeft: scaleSize(40),
    paddingRight: scaleSize(40),
    justifyContent: 'flex-start',
  },
  type2Text: {
    width: '100%',
    height: scaleSize(120),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(32),
  },
  type2Button: {
    width: scaleSize(140),
    height: scaleSize(40),
    backgroundColor: '#ffffff',
    borderRadius: scaleSize(40),
    paddingTop: scaleSize(9),
    paddingBottom: scaleSize(9),
    paddingLeft: scaleSize(4),
    paddingRight: scaleSize(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(10),
    alignSelf: 'center',
  },
  type2ButtonText: {
    color: '#000',
    fontSize: scaleSize(16),
    textAlign: 'center',
  },
  // ==================== 情况3: 有问题、无选项、无按钮 ====================
  type3Container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scaleSize(32),
    paddingBottom: scaleSize(32),
    paddingLeft: scaleSize(40),
    paddingRight: scaleSize(40),
  },
  type3Text: {
    color: '#FFFFFF',
    lineHeight: scaleSize(28),
    fontSize: scaleSize(20),
    textAlign: 'center',
  },
});

