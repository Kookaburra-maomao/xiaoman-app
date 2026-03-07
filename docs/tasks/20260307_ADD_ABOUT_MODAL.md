# 添加关于小满全屏弹窗

## 任务时间
2026-03-07

## 任务目标
在设置页面点击"关于小满"时，打开一个全屏弹窗，使用 WebView 渲染 http://xiaomanriji.com 页面，并在左上角显示关闭按钮。

## 执行步骤

### 1. 安装依赖
需要安装 `react-native-webview` 包：

```bash
npx expo install react-native-webview
```

或运行安装脚本：
```bash
./install-webview.sh
```

### 2. 修改 settings.tsx

#### 2.1 添加导入
```typescript
import { Modal } from 'react-native';
import { WebView } from 'react-native-webview';
```

#### 2.2 添加状态
```typescript
const [showAboutModal, setShowAboutModal] = useState(false); // 关于小满弹窗
```

#### 2.3 修改点击事件
```typescript
onPress={() => {
  log('SETTING_ABOUT_ME');
  setShowAboutModal(true);
}}
```

#### 2.4 添加弹窗组件
在 `</ScrollView>` 和 `</SafeAreaView>` 之间添加：

```typescript
{/* 关于小满全屏弹窗 */}
<Modal
  visible={showAboutModal}
  animationType="slide"
  presentationStyle="fullScreen"
  onRequestClose={() => setShowAboutModal(false)}
>
  <View style={styles.aboutModalContainer}>
    {/* WebView 显示关于页面 */}
    <WebView
      source={{ uri: 'http://xiaomanriji.com' }}
      style={styles.aboutWebView}
    />
    
    {/* 左上角关闭按钮 */}
    <TouchableOpacity
      style={styles.aboutCloseButton}
      onPress={() => setShowAboutModal(false)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-top-close.png' }}
        style={styles.aboutCloseIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
</Modal>
```

#### 2.5 添加样式
```typescript
// 关于小满弹窗样式
aboutModalContainer: {
  flex: 1,
  backgroundColor: '#FFFFFF',
},
aboutWebView: {
  flex: 1,
},
aboutCloseButton: {
  position: 'absolute',
  top: scaleSize(50),
  left: scaleSize(20),
  width: scaleSize(40),
  height: scaleSize(40),
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  borderRadius: scaleSize(20),
},
aboutCloseIcon: {
  width: scaleSize(24),
  height: scaleSize(24),
},
```

### 3. 添加检查更新提示
修改"检查更新"的点击事件：

```typescript
onPress={() => {
  log('SETTING_CHECK_UPDATE');
  Alert.alert('提示', '当前已经是最新版');
}}
```

## 完成情况

- ✅ 点击"关于小满"打开全屏弹窗
- ✅ 使用 WebView 渲染 http://xiaomanriji.com
- ✅ 左上角显示关闭按钮（40x40px）
- ✅ 关闭按钮使用指定图标
- ✅ 关闭按钮有半透明背景
- ✅ 点击"检查更新"显示提示
- ⏳ 需要安装 react-native-webview 依赖

## 相关文件

### 修改的文件
- `app/settings.tsx` - 添加关于小满弹窗和检查更新提示

### 新增的文件
- `install-webview.sh` - WebView 依赖安装脚本

## 技术要点

### 1. Modal 全屏显示
使用 `presentationStyle="fullScreen"` 确保弹窗全屏显示：

```typescript
<Modal
  visible={showAboutModal}
  animationType="slide"
  presentationStyle="fullScreen"
  onRequestClose={() => setShowAboutModal(false)}
>
```

### 2. WebView 使用
使用 `react-native-webview` 渲染网页：

```typescript
<WebView
  source={{ uri: 'http://xiaomanriji.com' }}
  style={styles.aboutWebView}
/>
```

### 3. 悬浮关闭按钮
使用绝对定位将关闭按钮悬浮在左上角：

```typescript
aboutCloseButton: {
  position: 'absolute',
  top: scaleSize(50),
  left: scaleSize(20),
  width: scaleSize(40),
  height: scaleSize(40),
  backgroundColor: 'rgba(0, 0, 0, 0.3)', // 半透明背景
  borderRadius: scaleSize(20), // 圆形按钮
}
```

### 4. 打点上报
点击时先上报打点，再执行操作：

```typescript
onPress={() => {
  log('SETTING_ABOUT_ME');
  setShowAboutModal(true);
}}
```

## 样式说明

### 关闭按钮样式
- 尺寸：40x40px
- 位置：左上角（top: 50px, left: 20px）
- 背景：半透明黑色 `rgba(0, 0, 0, 0.3)`
- 形状：圆形（borderRadius: 20px）
- 图标：24x24px

### WebView 样式
- 占满整个弹窗
- 背景色：白色

## 使用说明

### 安装依赖
在运行应用前，需要先安装 `react-native-webview`：

```bash
# 方法1：使用 expo 安装（推荐）
npx expo install react-native-webview

# 方法2：使用安装脚本
./install-webview.sh
```

### 测试步骤
1. 打开设置页面
2. 点击"关于小满"
3. 验证全屏弹窗打开
4. 验证 WebView 加载 http://xiaomanriji.com
5. 验证左上角关闭按钮显示
6. 点击关闭按钮，验证弹窗关闭
7. 点击"检查更新"，验证提示显示

## 注意事项

1. **依赖安装**：必须先安装 `react-native-webview` 才能运行
2. **网络权限**：确保应用有网络访问权限
3. **iOS 配置**：iOS 可能需要在 Info.plist 中配置 NSAppTransportSecurity
4. **Android 配置**：Android 可能需要在 AndroidManifest.xml 中配置网络权限
5. **WebView 性能**：首次加载可能较慢，可以考虑添加 loading 状态

## 后续优化建议

### 1. 添加加载状态
```typescript
<WebView
  source={{ uri: 'http://xiaomanriji.com' }}
  style={styles.aboutWebView}
  startInLoadingState={true}
  renderLoading={() => (
    <ActivityIndicator size="large" color={Colors.light.tint} />
  )}
/>
```

### 2. 添加错误处理
```typescript
<WebView
  source={{ uri: 'http://xiaomanriji.com' }}
  style={styles.aboutWebView}
  onError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error: ', nativeEvent);
    Alert.alert('错误', '页面加载失败，请检查网络连接');
  }}
/>
```

### 3. 支持返回按钮
在 Android 上，可以监听返回按钮关闭弹窗：

```typescript
import { BackHandler } from 'react-native';

useEffect(() => {
  if (showAboutModal) {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowAboutModal(false);
      return true;
    });
    return () => backHandler.remove();
  }
}, [showAboutModal]);
```

## 相关文档
- [React Native WebView 文档](https://github.com/react-native-webview/react-native-webview)
- [Expo WebView 文档](https://docs.expo.dev/versions/latest/sdk/webview/)
- [AI 协作约定](../../AI_CONVENTIONS.md)
