/**
 * 用户行为日志服务
 */

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export interface LogParams {
  type: 'expo' | 'click' | 'success';
  spma: string;
  spmb: string;
  spmc: string;
  spmd: string;
  extrinfo?: string;
  user_id: string;
}

// 日志位置配置
export const LOG_POSITIONS = {
  // 对话tab
  CHAT_TAB_EXPO: {
    position: '对话tab曝光',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  INPUT_CLICK: {
    position: '输入框点击',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_SEND_BUTTON: {
    position: '点击发送按钮',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_send_button',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_IMAGE_BUTTON: {
    position: '图片按钮点击',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_image',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_IMAGE_ALBUM: {
    position: '点击打开相册',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_image_album',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_IMAGE_CAMERA: {
    position: '点击打开相机',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_image_camera',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_VOICE_BUTTON: {
    position: '语音按钮点击',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_voice',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_VOICE_RECORD_END: {
    position: '结束录音并发送',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_voice_record_end',
    spmd: 'click',
    type: 'click' as const,
  },
  INPUT_VOICE_RECORD_CANCEL: {
    position: '松手取消录音',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'input_voice_record_cancel',
    spmd: 'click',
    type: 'click' as const,
  },
  SEND_MESSAGE: {
    position: '发送消息给模型',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'send_message',
    spmd: 'expo',
    type: 'expo' as const,
  },
  GENERATE_DIARY_BUTTON: {
    position: '对话中点击生成日记',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'generate_diary_button',
    spmd: 'click',
    type: 'click' as const,
  },
  
  // 日记相关
  DIARY_PREVIEW_EXPO: {
    position: '日记预览页展现',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  DIARY_PREVIEW_SHARE: {
    position: '日记预览页点击分享',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'share_diary',
    spmd: 'click',
    type: 'click' as const,
  },
  DIARY_SAVE_IMAGE_SUCCESS: {
    position: '日记预览页点击【保存日记图片】',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'share_diary',
    spmd: 'success',
    type: 'success' as const,
  },
  DIARY_EXPORT_IMAGE: {
    position: '日记预览页点击导出图片',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'export_image',
    spmd: 'click',
    type: 'click' as const,
  },
  DIARY_GENERATE_COMPLETE: {
    position: '日记生成完成',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'generate_diary',
    spmd: 'expo',
    type: 'expo' as const,
  },
  DIARY_EDIT: {
    position: '点击编辑日记',
    spma: 'diary',
    spmb: 'preview',
    spmc: 'edit_diary',
    spmd: 'click',
    type: 'click' as const,
  },
  DIARY_CARD_EXPO: {
    position: '对话中展现日记卡片',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'diary_card',
    spmd: 'expo',
    type: 'expo' as const,
  },
  DIARY_CARD_CLICK: {
    position: '日记卡片点击',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'diary_card',
    spmd: 'click',
    type: 'click' as const,
  },
  
  // 推荐计划
  SUG_PLAN_EXPO: {
    position: '对话中展示推荐计划',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'sug_plan',
    spmd: 'expo',
    type: 'expo' as const,
  },
  SUG_PLAN_ADD: {
    position: '对话中点击【去添加计划】',
    spma: 'chat',
    spmb: 'chat_tab',
    spmc: 'sug_plan_add',
    spmd: 'click',
    type: 'click' as const,
  },
  SUG_PLAN_PREVIEW_EXPO: {
    position: '添加推荐计划预览页展现',
    spma: 'chat',
    spmb: 'sug_plan',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  SUG_PLAN_EDIT: {
    position: '添加推荐计划预览页点击【修改】',
    spma: 'chat',
    spmb: 'sug_plan',
    spmc: 'edit_plan',
    spmd: 'click',
    type: 'click' as const,
  },
  SUG_PLAN_ADD_CONFIRM: {
    position: '添加推荐计划预览页点击【添加计划】',
    spma: 'chat',
    spmb: 'sug_plan',
    spmc: 'add_plan',
    spmd: 'click',
    type: 'click' as const,
  },
  
  // 计划tab
  PLAN_TAB_EXPO: {
    position: '计划tab曝光',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  PLAN_CREATE: {
    position: '点击【新增计划】',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'create_plan',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_CREATE_DONE: {
    position: '新建计划浮层中点击【完成】',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'create_plan_done',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_DONE_CHECK: {
    position: '点击计划完成打卡',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'plan_done_check',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_DONE_CHECK_IMAGE: {
    position: '计划完成打卡浮层中点击上传图片',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'plan_done_check_image',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_MANAGE: {
    position: '计划tab中点击【管理计划】',
    spma: 'plan',
    spmb: 'plan_tab',
    spmc: 'plan_manage',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_SET_TOP: {
    position: '管理计划页点击置顶某条计划',
    spma: 'plan',
    spmb: 'plan_manage',
    spmc: 'plan_set_top',
    spmd: 'click',
    type: 'click' as const,
  },
  PLAN_DETAIL: {
    position: '管理计划页点击某条计划查看详情',
    spma: 'plan',
    spmb: 'plan_manage',
    spmc: 'single_plan',
    spmd: 'click',
    type: 'click' as const,
  },
  
  // 记录tab
  RECORD_TAB_EXPO: {
    position: '记录tab曝光',
    spma: 'plan',
    spmb: 'record_tab',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  RECORD_SINGLE_DAY: {
    position: '点击某天进入记录复访落地页',
    spma: 'plan',
    spmb: 'record_tab',
    spmc: 'single_day',
    spmd: 'click',
    type: 'click' as const,
  },
  RECORD_REVIEW_EXPO: {
    position: '记录复访落地页展现',
    spma: 'plan',
    spmb: 'record_review',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  RECORD_REVIEW_DIARY: {
    position: '记录复访落地页点击复访某条日记',
    spma: 'plan',
    spmb: 'record_review',
    spmc: 'single_diary',
    spmd: 'click',
    type: 'click' as const,
  },
  RECORD_REVIEW_CHAT: {
    position: '记录复访落地页点击查看对话记录',
    spma: 'plan',
    spmb: 'record_review',
    spmc: 'chat_history',
    spmd: 'click',
    type: 'click' as const,
  },
  
  // 设置页
  SETTING_PAGE_EXPO: {
    position: '设置&个人中心页面曝光',
    spma: 'setting',
    spmb: 'setting_page',
    spmc: 'page',
    spmd: 'expo',
    type: 'expo' as const,
  },
  SETTING_RECENT_DELETE: {
    position: '点击最近删除',
    spma: 'setting',
    spmb: 'setting_page',
    spmc: 'recent_delete',
    spmd: 'click',
    type: 'click' as const,
  },
  SETTING_ABOUT_ME: {
    position: '点击关于小满',
    spma: 'setting',
    spmb: 'setting_page',
    spmc: 'about_me',
    spmd: 'click',
    type: 'click' as const,
  },
  SETTING_CHECK_UPDATE: {
    position: '点击检查更新',
    spma: 'setting',
    spmb: 'setting_page',
    spmc: 'check_update',
    spmd: 'click',
    type: 'click' as const,
  },
};

/**
 * 发送日志（异步，不阻塞主流程）
 */
export const sendLog = async (
  logConfig: typeof LOG_POSITIONS[keyof typeof LOG_POSITIONS],
  userId: string,
  extraInfo?: Record<string, any>
): Promise<void> => {
  try {
    const logData: LogParams = {
      type: logConfig.type,
      spma: logConfig.spma,
      spmb: logConfig.spmb,
      spmc: logConfig.spmc,
      spmd: logConfig.spmd,
      user_id: userId,
    };

    // 添加额外信息
    if (extraInfo) {
      logData.extrinfo = JSON.stringify(extraInfo);
    }

    // 异步发送，不等待结果
    fetch(`${apiUrl}/api/user-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData),
    }).catch((error) => {
      // 静默处理错误，不影响主流程
      console.log('发送日志失败:', error);
    });
  } catch (error) {
    // 静默处理错误
    console.log('发送日志异常:', error);
  }
};

/**
 * 便捷方法：根据位置名称发送日志
 */
export const logByPosition = (
  positionKey: keyof typeof LOG_POSITIONS,
  userId: string,
  extraInfo?: Record<string, any>
): void => {
  const logConfig = LOG_POSITIONS[positionKey];
  if (logConfig) {
    sendLog(logConfig, userId, extraInfo);
  }
};
