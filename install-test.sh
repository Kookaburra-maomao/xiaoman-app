#!/bin/bash

# 小满日记 APK 快速安装脚本
# 用于将构建好的 APK 安装到连接的 Android 设备

set -e

APK_PATH="android/app/build/outputs/apk/release/app-1.0.0-release.apk"
PACKAGE_NAME="com.xiaomanriji.xiaomanapp"

echo "📱 小满日记 APK 安装工具"
echo "=========================="
echo ""

# 检查 APK 是否存在
if [ ! -f "$APK_PATH" ]; then
    echo "❌ 错误：APK 文件不存在"
    echo "   请先运行构建命令："
    echo "   cd android && ./build-apk.sh"
    exit 1
fi

# 检查 ADB 是否可用
if ! command -v adb &> /dev/null; then
    echo "❌ 错误：未找到 adb 命令"
    echo "   请安装 Android SDK Platform Tools"
    exit 1
fi

# 检查设备连接
echo "🔍 检查设备连接..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ 错误：未检测到连接的设备"
    echo "   请确保："
    echo "   1. 设备已通过 USB 连接到电脑"
    echo "   2. 设备已开启 USB 调试"
    echo "   3. 已授权电脑进行调试"
    exit 1
fi

echo "✅ 检测到 $DEVICES 个设备"
echo ""

# 检查是否已安装
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "⚠️  检测到已安装的版本"
    echo "   将覆盖安装..."
    adb install -r "$APK_PATH"
else
    echo "📦 首次安装..."
    adb install "$APK_PATH"
fi

echo ""
echo "✅ 安装成功！"
echo ""
echo "📱 应用信息："
echo "   包名: $PACKAGE_NAME"
echo "   版本: 1.0.0"
echo ""
echo "🚀 启动应用："
echo "   adb shell am start -n $PACKAGE_NAME/.MainActivity"
echo ""
echo "📋 查看日志："
echo "   adb logcat | grep xiaomanriji"
