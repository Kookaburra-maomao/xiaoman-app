/**
 * 统一管理应用中所有的 URL 常量
 * 使用环境变量配置的 API 基础 URL
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || 'http://xiaomanriji.com';

// 登录页面
export const LOGO_URL = `${API_BASE_URL}/api/files/xiaoman.png`;
export const SLOGAN_URL = `${API_BASE_URL}/api/files/xiaoman-slogan.png`;

// 聊天头部
export const HEADER_UP_ICON_URL = `${API_BASE_URL}/api/files/header-up.png`;
export const HEADER_DOWN_ICON_URL = `${API_BASE_URL}/api/files/header-down.png`;

// 聊天输入
export const RADIO_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-chat-radio.png`;
export const KEYBOARD_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-chat-keyboard.png`;
export const PIC_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-chat-pic.png`;
export const SEND_MSG_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-chat-sendmsg.png`;
export const LOTTIE_RADIO_URL = `${API_BASE_URL}/api/files/lottie-radio.json`;
export const RADIO_DOT_IMAGE_URL = `${API_BASE_URL}/api/files/xiaoman-radio-dot.png`;

// 消息列表
export const RIGHT_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-icon-right.png`;

// 计划相关
export const FALLBACK_IMAGE_BASE_URL = `${API_BASE_URL}/api/files/plan`;
export const ICON_RETURN_URL = `${API_BASE_URL}/api/files/xiaoman-icon-return.png`;
export const ICON_RETURN_DARK_URL = `${API_BASE_URL}/api/files/icon-return-dark.png`;
export const ICON_DOT_URL = `${API_BASE_URL}/api/files/xiaoman-icon-dot.png`;
export const PIN_IMAGE_URL = `${API_BASE_URL}/api/files/Pin.png`;
export const PIN_NORMAL_IMAGE_URL = `${API_BASE_URL}/api/files/Pin-normal.png`;
export const OPTION_ICON_URL = `${API_BASE_URL}/api/files/icon-option.png`;
export const ICON_OPTION_DARK_URL = `${API_BASE_URL}/api/files/icon-option-dark.png`;
export const MISSION_COMPLETED_ICON_URL = `${API_BASE_URL}/api/files/MissionConpleted.png`;
export const ICON_REPEAT_URL = `${API_BASE_URL}/api/files/icon-repeat.png`;
export const ICON_CALC_URL = `${API_BASE_URL}/api/files/icon-calc.png`;
export const ICON_OK_URL = `${API_BASE_URL}/api/files/icon-ok.png`;
export const ICON_WARNING_URL = `${API_BASE_URL}/api/files/icon-warning.png`;

// 日记相关
export const RETURN_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-icon-return.png`;
export const EDIT_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-icon-edit.png`;
export const EXPORT_ICON_URL = `${API_BASE_URL}/api/files/xiaoman-icon-export.png`;
export const QR_CODE_URL = `${API_BASE_URL}/api/files/xiaoman-qr.png`

// VIP 中心
export const VIP_HEADER_BG_URL = `${API_BASE_URL}/api/files/vip-header-bg.png`;
export const VIP_BANNER_URL = `${API_BASE_URL}/api/files/vip-banner.png`;
export const ICON_VIP_URL = `${API_BASE_URL}/api/files/icon-vip.png`;
export const VIP_SELECTED_URL = `${API_BASE_URL}/api/files/vip-selected.png`;
export const VIP_NORMAL_URL = `${API_BASE_URL}/api/files/vip-normal.png`;
export const VIP_NEW_FLAG_URL = `${API_BASE_URL}/api/files/vip-new-flag.png`;
export const VIP_RIGHT_ICON_URL = `${API_BASE_URL}/api/files/vip-right.png`;
export const VIP_TEXT_GRADIENT_URL = `${API_BASE_URL}/api/files/vip-text.png`;
export const VIP_TAG_URL = `${API_BASE_URL}/api/files/vip-tag.png`;
export const VIP_NO_URL = `${API_BASE_URL}/api/files/vip-no.png`;
export const VIP_CARD_URL = `${API_BASE_URL}/api/files/vip-card.png`;

// 工具函数：生成计划图片 URL
export const getPlanImageUrl = (planTag: string, randomNum: number) => {
  return `${API_BASE_URL}/api/files/${planTag}${randomNum}.jpg`;
};

export const getPlanImagePreviewUrl = (planTag: string, randomNum: number) => {
  return `${API_BASE_URL}/api/files/${planTag}${randomNum}_preview.jpg`;
};

// 工具函数：补全图片 URL（如果是相对路径，则添加域名前缀）
export const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl}`;
};

export { API_BASE_URL };
