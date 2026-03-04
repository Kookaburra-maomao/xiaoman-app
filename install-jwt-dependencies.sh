#!/bin/bash

# JWT 自动续期功能依赖安装脚本

echo "🚀 开始安装 JWT 自动续期功能所需依赖..."
echo ""

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm 命令"
    echo "请先安装 Node.js 和 npm"
    exit 1
fi

# 安装核心依赖
echo "📦 安装核心依赖..."
npm install axios

# 安装 AsyncStorage
echo "📦 安装 AsyncStorage..."
npm install @react-native-async-storage/async-storage

# 安装 SecureStore（可选，更安全）
echo "📦 安装 SecureStore（可选）..."
npm install expo-secure-store

# 安装 NetInfo（网络状态监听）
echo "📦 安装 NetInfo..."
npm install @react-native-community/netinfo

echo ""
echo "✅ 所有依赖安装完成！"
echo ""
echo "📝 下一步："
echo "1. 查看 JWT_IMPLEMENTATION_GUIDE.md 了解使用方法"
echo "2. 修改 app/_layout.tsx 使用 JwtAuthProvider"
echo "3. 参考 app/jwt-login-example.tsx 修改登录页面"
echo "4. 将 API 调用改为使用 jwtGet/jwtPost/jwtPut/jwtDel"
echo ""
echo "🎉 祝你使用愉快！"
