/**
 * 日记风格选择浮层
 */

import { DiaryTemplate, getDiaryTemplates } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, Modal,
  StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View
} from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

interface DiaryStylePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: DiaryTemplate) => void;
  todayCount?: number;
  isVip?: boolean;
}

export default function DiaryStylePicker({ visible, onClose, onSelect, todayCount = 0, isVip = false }: DiaryStylePickerProps) {
  const [templates, setTemplates] = useState<DiaryTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setSelectedId(null);
      getDiaryTemplates()
        .then(setTemplates)
        .catch(() => setTemplates([]))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleConfirm = () => {
    console.log('[DiaryStylePicker] handleConfirm, selectedId:', selectedId, 'templates:', templates.length);
    const tpl = templates.find(t => t.id === selectedId);
    console.log('[DiaryStylePicker] found template:', tpl?.name);
    if (tpl) {
      onSelect(tpl);
    }
  };

  const resolveImage = (url: string | null | undefined) =>
    !url ? '' : url.startsWith('http') ? url : `${apiUrl}${url}`;

  const renderItem = ({ item }: { item: DiaryTemplate }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedId(item.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: resolveImage(item.preview_image) }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <Text
          style={[styles.cardName, isSelected && styles.cardNameSelected]}
          allowFontScaling={false}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <Text style={styles.title} allowFontScaling={false}>选择日记风格</Text>
          <Text style={styles.countText} allowFontScaling={false}>
            {isVip ? `今日已生成 ${todayCount}篇，VIP无限制` : `今日已生成 ${todayCount}/5`}
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        ) : (
          <FlatList
            data={templates}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedId && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedId}
          activeOpacity={0.7}
        >
          <Text style={styles.confirmText} allowFontScaling={false}>开始美化日记</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scaleSize(300),
    backgroundColor: 'rgba(250,250,250,0.95)',
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(24),
    zIndex: 10,
  },
  title: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: '#222222',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSize(20),
    marginBottom: scaleSize(16),
  },
  countText: {
    fontSize: scaleSize(12),
    color: '#999999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: scaleSize(16),
    gap: scaleSize(10),
  },
  card: {
    width: scaleSize(84),
    height: scaleSize(142),
    borderRadius: scaleSize(8),
    backgroundColor: '#FFFFFF',
    padding: scaleSize(2),
    alignItems: 'center',
  },
  cardSelected: {
    backgroundColor: '#000000',
  },
  cardImage: {
    width: scaleSize(80),
    height: scaleSize(120),
    borderRadius: scaleSize(6),
  },
  cardName: {
    fontSize: scaleSize(10),
    color: '#222222',
    marginTop: scaleSize(4),
    textAlign: 'center',
  },
  cardNameSelected: {
    color: '#FFFFFF',
  },
  confirmButton: {
    marginHorizontal: scaleSize(20),
    marginTop: scaleSize(16),
    height: scaleSize(50),
    backgroundColor: '#000000',
    borderRadius: scaleSize(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
  confirmText: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
