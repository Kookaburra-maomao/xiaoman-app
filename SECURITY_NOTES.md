# 安全注意事项

## 🔐 敏感文件保护

### Keystore 文件
以下文件包含签名密钥，**绝对不能**提交到公开仓库：

```
android/app/my-release-key.keystore  ⚠️ 敏感文件
android/app/debug.keystore           ✅ 可以提交（仅用于开发）
```

### 配置文件
`android/gradle.properties` 包含签名密码，需要特别处理：

```properties
# 这些配置包含敏感信息
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=521303  ⚠️ 敏感信息
MYAPP_RELEASE_KEY_PASSWORD=521303    ⚠️ 敏感信息
```

## 🛡️ 推荐做法

### 方案一：使用环境变量（推荐）

1. 从 `gradle.properties` 中移除密码配置
2. 使用环境变量：

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
export MYAPP_RELEASE_STORE_PASSWORD=521303
export MYAPP_RELEASE_KEY_PASSWORD=521303
```

3. 更新 `android/app/build.gradle`：

```groovy
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword System.getenv("MYAPP_RELEASE_STORE_PASSWORD") ?: MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword System.getenv("MYAPP_RELEASE_KEY_PASSWORD") ?: MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

### 方案二：使用本地配置文件

1. 创建 `android/keystore.properties`（不提交到 Git）：

```properties
storeFile=my-release-key.keystore
storePassword=521303
keyAlias=my-key-alias
keyPassword=521303
```

2. 在 `.gitignore` 中添加：

```
android/keystore.properties
```

3. 更新 `android/app/build.gradle`：

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'] ?: 'my-release-key.keystore')
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

### 方案三：CI/CD 环境变量

如果使用 GitHub Actions、GitLab CI 等：

1. 在 CI/CD 平台设置密钥变量
2. 在构建脚本中注入：

```yaml
# GitHub Actions 示例
- name: Build Release APK
  env:
    MYAPP_RELEASE_STORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    MYAPP_RELEASE_KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
  run: |
    cd android
    ./gradlew assembleRelease
```

## 📋 .gitignore 建议

如果 android 文件夹需要提交到仓库，建议添加以下规则：

```gitignore
# Keystore 文件（保护签名密钥）
*.keystore
!debug.keystore

# 本地配置文件
android/keystore.properties
android/local.properties

# 构建输出
android/app/build/
android/build/
android/.gradle/

# 敏感配置（可选）
android/gradle.properties
```

## ⚠️ 当前状态

**当前配置状态**：
- ✅ Keystore 文件已创建
- ⚠️ 密码明文存储在 `gradle.properties` 中
- ⚠️ 如果提交到公开仓库，密码会泄露

**建议操作**：
1. 如果是私有仓库：可以保持当前配置
2. 如果是公开仓库：**必须**使用上述方案之一保护密码
3. 如果已经提交：需要重新生成 keystore 并更新配置

## 🔄 如果密码已泄露

如果不小心将密码提交到公开仓库：

1. **立即重新生成 keystore**：
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore my-release-key-new.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass NEW_PASSWORD \
  -keypass NEW_PASSWORD \
  -dname "CN=Kookaburra, OU=xiaomanriji, O=xiaomanriji, L=shanghai, ST=shanghai, C=CN"
```

2. **更新配置使用新 keystore**

3. **从 Git 历史中删除敏感信息**：
```bash
# 使用 git-filter-repo 或 BFG Repo-Cleaner
git filter-repo --path android/gradle.properties --invert-paths
```

## 📚 参考资源

- [Android 应用签名文档](https://developer.android.com/studio/publish/app-signing)
- [保护 API 密钥](https://developer.android.com/studio/publish/app-signing#secure-shared-keystore)
- [Git 敏感信息处理](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

## ✅ 检查清单

在提交代码前，请确认：

- [ ] Keystore 文件不在 Git 中（或使用 Git LFS）
- [ ] 密码不在代码中明文存储
- [ ] `.gitignore` 已正确配置
- [ ] 团队成员知道如何获取 keystore
- [ ] 有 keystore 的备份（安全存储）
- [ ] CI/CD 配置了正确的密钥变量
