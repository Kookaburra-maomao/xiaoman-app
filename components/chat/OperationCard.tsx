/**
 * 运营卡片组件（可滑动）
 */

import { Colors } from '@/constants/theme';
import { OperationCard } from '@/services/chatService';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCROLL_CONTAINER_PADDING = 20; // 滑动容器左右边距
const CARD_MARGIN_RIGHT = 16; // 卡片右边距
const CARD_WIDTH = SCREEN_WIDTH - SCROLL_CONTAINER_PADDING * 2; // 卡片宽度 = 屏幕宽度 - 容器左右边距
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN_RIGHT; // 分页间隔 = 卡片宽度 + 卡片右边距
const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

interface OperationCardProps {
  cards: OperationCard[];
  username: string;
  onItemSelect: (promptRule: string, emoji: string) => void;
}

export default function OperationCardCarousel({ cards, username, onItemSelect }: OperationCardProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    if (item && item.emoji) {
      onItemSelect(card.prompt_rule, item.emoji);
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

  // 渲染单个卡片
  const renderCard = ({ item, index }: { item: OperationCard; index: number }) => {
    const timeGreeting = getTimeGreeting();
    const recordItems = item.record_item || [];
    const hasButton = item.button_name && item.content_url;
    const hasBgImage = !!item.bg_image;
    
    // 处理背景图片URL
    let bgImageUrl = '';
    if (hasBgImage && item.bg_image) {
      if (item.bg_image.startsWith('http://') || item.bg_image.startsWith('https://')) {
        bgImageUrl = item.bg_image;
      } else {
        // 相对路径，拼接域名前缀
        bgImageUrl = `${apiUrl}${item.bg_image}`;
      }
    }

    return (
      <View style={[
        styles.cardContainer, 
        { 
          width: CARD_WIDTH,
          backgroundColor: hasBgImage ? 'transparent' : '#FFFFFF',
        }
      ]} key={item.id}>
        {/* 背景图片 */}
        {hasBgImage && bgImageUrl && (
          <Image
            source={{ uri: bgImageUrl }}
            style={styles.cardBackground}
            resizeMode="cover"
          />
        )}
        
        <View style={[styles.cardContent, { backgroundColor: hasBgImage ? 'rgba(255, 255, 255, 0.7)' : 'transparent' }]}>
          {/* 第一个区域：问候区 */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>
              Hi {username} {timeGreeting}好，{item.record_topic}
            </Text>
          </View>

          {/* 第二个区域：选项区 */}
          {recordItems.length > 0 && (
            <View style={styles.itemsSection}>
              {recordItems.map((recordItem, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.itemContainer}
                  activeOpacity={0.7}
                  onPress={() => handleItemPress(item, itemIndex)}
                >
                  <Text style={styles.itemEmoji}>{recordItem.emoji}</Text>
                  <Text style={styles.itemText}>{recordItem.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 第三个区域：按钮区 */}
          {hasButton && (
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => handleButtonPress(item.content_url)}
              >
                <Text style={styles.actionButtonText}>{item.button_name}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 滚动事件处理
  const onScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SNAP_INTERVAL);
    setCurrentIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      {/* 滑动容器，左右20的边距 */}
      <View style={styles.scrollContainer}>
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
        />
      </View>
      
      {/* 指示器 */}
      {cards.length > 1 && (
        <View style={styles.indicatorContainer}>
          {cards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  scrollContainer: {
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: 0,
  },
  cardContainer: {
    height: 300,
    marginTop: 10,
    marginRight: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  cardContent: {
    flex: 1,
    padding: 16,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  itemContainer: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: 'center',
  },
  buttonSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  actionButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: Colors.light.tint,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

