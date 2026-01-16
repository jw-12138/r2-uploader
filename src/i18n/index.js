/**
 * Simple i18n (internationalization) system for R2 Uploader
 * Supports English and Chinese
 */

import { ref, computed } from 'vue'

// Available languages
export const LANGUAGES = {
  en: 'English',
  zh: '中文'
}

// Current language (reactive)
export const currentLang = ref(localStorage.getItem('r2_uploader_lang') || 'en')

// Translations
const translations = {
  en: {
    // App
    'app.title': 'R2 Uploader',
    'app.madeBy': 'Made by',
    'app.with': 'with',
    'app.setupGuide': 'Setup Guide',
    'app.openSource': 'Open Source',
    
    // Endpoints
    'endpoints.title': 'Endpoints',
    'endpoints.hasOne': 'You have 1 endpoint, and it is selected.',
    'endpoints.hasMultiple': 'Choose between different endpoints, you have {count} endpoints',
    'endpoints.needWorker': 'You need Cloudflare Workers to upload files to Cloudflare R2. Have a look at the',
    'endpoints.setupGuide': 'setup guide',
    'endpoints.edit': 'Edit',
    'endpoints.cancel': 'Cancel',
    'endpoints.delete': 'Delete',
    'endpoints.addNew': 'Add a new endpoint',
    'endpoints.editThis': 'Edit this endpoint',
    'endpoints.workerEndpoint': 'Workers Endpoint',
    'endpoints.apiKey': 'Workers Endpoint API Key',
    'endpoints.apiKeyPlaceholder': 'treat it like your browser history',
    'endpoints.customDomain': 'Custom Domain (Optional)',
    'endpoints.customDomainHint': 'Use your own domain name to access the files instead of',
    'endpoints.save': 'Save To LocalStorage',
    'endpoints.saved': 'Saved!',
    'endpoints.confirmDelete': 'Are you sure to delete this endpoint?',
    'endpoints.invalidUrl': 'Invalid endpoint format, it should be a valid URL.',
    'endpoints.invalidDomain': 'Invalid custom domain format, it should be a valid URL.',
    
    // Sync Endpoints
    'sync.title': 'Sync Endpoints',
    'sync.description': 'To sync your endpoints across devices, you can login with your GitHub account. All the information will be AES encrypted locally and then stored in our database.',
    'sync.loginWith': 'Login With',
    'sync.welcome': 'Welcome,',
    'sync.passwordHint': 'Since now you\'ve logged in, you can sync your endpoints across devices. But first, you need to provide a password to encrypt and decrypt your data. Remember, this password will be stored locally and will not be sent to our server. Meaning if you forget it, you\'ll lose all previously saved data.',
    'sync.encryptionPassword': 'Encryption/Decryption Password',
    'sync.update': 'Update',
    'sync.save': 'Save',
    'sync.showPassword': 'Show password',
    'sync.push': '🔼 Push',
    'sync.pull': '🔽 Pull',
    'sync.logout': 'Log Out',
    'sync.deleteAll': 'Delete all synced endpoints',
    'sync.status': 'status',
    'sync.waiting': 'waiting for user action',
    'sync.pushing': 'pushing...hold on',
    'sync.pushed': 'pushed',
    'sync.pushFailed': 'push failed',
    'sync.pulling': 'pulling...hold on',
    'sync.pulled': 'pulled',
    'sync.pullFailed': 'pull failed',
    'sync.noDataFound': 'no data found on server',
    'sync.serverError': 'server error, please try again later',
    'sync.decrypted': 'decrypted and saved',
    'sync.enterPassword': 'pulled, insert your password to decrypt the data',
    'sync.dataCorrupted': 'pulled, but the data seems to be corrupted, check your password please',
    'sync.deleting': 'deleting...hold on',
    'sync.deleted': 'deleted',
    'sync.deleteFailed': 'delete Failed, try again please',
    'sync.confirmDelete': 'This action will delete all your data on our server. Are you sure?',
    'sync.confirmDeleteAgain': 'Are you really sure? This action cannot be undone.',
    'sync.confirmLogout': 'Are you sure to log out?',
    
    // Upload
    'upload.title': 'Upload Files',
    'upload.addMore': 'Add More Files',
    'upload.chooseFolder': 'Choose Folder',
    'upload.button': '🔥 Upload',
    'upload.files': 'File',
    'upload.filesPlural': 'Files',
    'upload.total': 'total',
    'upload.willSkip': 'Will skip',
    'upload.all': 'all',
    'upload.file': 'file',
    'upload.filePlural': 'files',
    'upload.uploadingAt': 'Uploading at',
    'upload.uploadedAt': 'Uploaded at',
    'upload.allDone': 'All done.',
    'upload.dismiss': 'Dismiss',
    'upload.skipSameName': 'Skip uploading files with the same name',
    'upload.renameRandom': 'Rename each file with a random ID',
    'upload.compressImages': 'Compress images before uploading',
    'upload.uploadToFolder': 'Upload to folder',
    'upload.folderName': 'Folder name',
    'upload.previewFolder': 'Preview folder structure',
    'upload.setEndpoint': 'Please set an endpoint and api key first.',
    'upload.abort': 'Abort',
    'upload.aborted': 'Aborted',
    'upload.splitting': 'Splitting...',
    'upload.compressing': 'Compressing...',
    'upload.removeFile': 'Remove this file',
    'upload.clickToRename': 'Click to rename',
    'upload.cantRenameNow': 'Can\'t rename now',
    
    // File List
    'fileList.title': 'Uploaded Files',
    'fileList.loading': 'Loading...',
    'fileList.empty': 'No files uploaded yet.',
    'fileList.loadMore': 'Load More',
    'fileList.refresh': 'Refresh',
    'fileList.delete': 'Delete',
    'fileList.confirmDelete': 'Are you sure to delete this file?',
    'fileList.deleteFailed': 'Failed to delete file.',
    'fileList.checkEndpoint': 'please check your endpoint and API key.',
    'fileList.sortBy': 'Sort by',
    'fileList.name': 'Name',
    'fileList.size': 'Size',
    'fileList.date': 'Date',
    'fileList.ascending': 'Ascending',
    'fileList.descending': 'Descending',
    'fileList.folderView': 'Folder view',
    'fileList.listView': 'List view',
    'fileList.selected': 'selected',
    'fileList.clearSelection': 'Clear selection',
    'fileList.deleteSelected': 'Delete selected',
    'fileList.confirmDeleteSelected': 'Are you sure to delete {count} files?',
    'fileList.copied': 'Copied!',
    'fileList.copy': 'Copy',
    'fileList.copyUrl': 'Copy URL',
    
    // Language
    'lang.switch': 'Language',
  },
  
  zh: {
    // App
    'app.title': 'R2 上传器',
    'app.madeBy': '由',
    'app.with': '用 ❤️ 制作',
    'app.setupGuide': '设置指南',
    'app.openSource': '开源代码',
    
    // Endpoints
    'endpoints.title': '端点配置',
    'endpoints.hasOne': '您有 1 个端点，已选中。',
    'endpoints.hasMultiple': '选择不同的端点，您有 {count} 个端点',
    'endpoints.needWorker': '您需要 Cloudflare Workers 才能上传文件到 Cloudflare R2。请查看',
    'endpoints.setupGuide': '设置指南',
    'endpoints.edit': '编辑',
    'endpoints.cancel': '取消',
    'endpoints.delete': '删除',
    'endpoints.addNew': '添加新端点',
    'endpoints.editThis': '编辑此端点',
    'endpoints.workerEndpoint': 'Worker 端点',
    'endpoints.apiKey': 'Worker 端点 API 密钥',
    'endpoints.apiKeyPlaceholder': '像对待浏览器历史记录一样保密',
    'endpoints.customDomain': '自定义域名（可选）',
    'endpoints.customDomainHint': '使用您自己的域名访问文件，而不是',
    'endpoints.save': '保存到本地存储',
    'endpoints.saved': '已保存！',
    'endpoints.confirmDelete': '确定要删除此端点吗？',
    'endpoints.invalidUrl': '端点格式无效，应为有效的 URL。',
    'endpoints.invalidDomain': '自定义域名格式无效，应为有效的 URL。',
    
    // Sync Endpoints
    'sync.title': '同步端点',
    'sync.description': '要在不同设备之间同步端点，您可以使用 GitHub 账号登录。所有信息将在本地进行 AES 加密后存储到我们的数据库。',
    'sync.loginWith': '登录',
    'sync.welcome': '欢迎，',
    'sync.passwordHint': '既然您已登录，现在可以在不同设备之间同步端点。但首先，您需要提供一个密码来加密和解密数据。请记住，此密码将存储在本地，不会发送到我们的服务器。这意味着如果您忘记密码，将丢失所有之前保存的数据。',
    'sync.encryptionPassword': '加密/解密密码',
    'sync.update': '更新',
    'sync.save': '保存',
    'sync.showPassword': '显示密码',
    'sync.push': '🔼 推送',
    'sync.pull': '🔽 拉取',
    'sync.logout': '退出登录',
    'sync.deleteAll': '删除所有已同步的端点',
    'sync.status': '状态',
    'sync.waiting': '等待用户操作',
    'sync.pushing': '正在推送...请稍候',
    'sync.pushed': '已推送',
    'sync.pushFailed': '推送失败',
    'sync.pulling': '正在拉取...请稍候',
    'sync.pulled': '已拉取',
    'sync.pullFailed': '拉取失败',
    'sync.noDataFound': '服务器上未找到数据',
    'sync.serverError': '服务器错误，请稍后重试',
    'sync.decrypted': '已解密并保存',
    'sync.enterPassword': '已拉取，请输入密码解密数据',
    'sync.dataCorrupted': '已拉取，但数据似乎已损坏，请检查密码',
    'sync.deleting': '正在删除...请稍候',
    'sync.deleted': '已删除',
    'sync.deleteFailed': '删除失败，请重试',
    'sync.confirmDelete': '此操作将删除您在服务器上的所有数据。确定吗？',
    'sync.confirmDeleteAgain': '真的确定吗？此操作无法撤销。',
    'sync.confirmLogout': '确定要退出登录吗？',
    
    // Upload
    'upload.title': '上传文件',
    'upload.addMore': '添加更多文件',
    'upload.chooseFolder': '选择文件夹',
    'upload.button': '🔥 上传',
    'upload.files': '个文件',
    'upload.filesPlural': '个文件',
    'upload.total': '共计',
    'upload.willSkip': '将跳过',
    'upload.all': '全部',
    'upload.file': '个文件',
    'upload.filePlural': '个文件',
    'upload.uploadingAt': '上传速度',
    'upload.uploadedAt': '上传速度',
    'upload.allDone': '全部完成。',
    'upload.dismiss': '关闭',
    'upload.skipSameName': '跳过同名文件',
    'upload.renameRandom': '使用随机 ID 重命名每个文件',
    'upload.compressImages': '上传前压缩图片',
    'upload.uploadToFolder': '上传到文件夹',
    'upload.folderName': '文件夹名称',
    'upload.previewFolder': '预览文件夹结构',
    'upload.setEndpoint': '请先设置端点和 API 密钥。',
    'upload.abort': '中止',
    'upload.aborted': '已中止',
    'upload.splitting': '正在分片...',
    'upload.compressing': '正在压缩...',
    'upload.removeFile': '移除此文件',
    'upload.clickToRename': '点击重命名',
    'upload.cantRenameNow': '现在无法重命名',
    
    // File List
    'fileList.title': '已上传文件',
    'fileList.loading': '加载中...',
    'fileList.empty': '暂无上传文件。',
    'fileList.loadMore': '加载更多',
    'fileList.refresh': '刷新',
    'fileList.delete': '删除',
    'fileList.confirmDelete': '确定要删除此文件吗？',
    'fileList.deleteFailed': '删除文件失败。',
    'fileList.checkEndpoint': '请检查您的端点和 API 密钥。',
    'fileList.sortBy': '排序方式',
    'fileList.name': '名称',
    'fileList.size': '大小',
    'fileList.date': '日期',
    'fileList.ascending': '升序',
    'fileList.descending': '降序',
    'fileList.folderView': '文件夹视图',
    'fileList.listView': '列表视图',
    'fileList.selected': '已选择',
    'fileList.clearSelection': '清除选择',
    'fileList.deleteSelected': '删除已选',
    'fileList.confirmDeleteSelected': '确定要删除 {count} 个文件吗？',
    'fileList.copied': '已复制！',
    'fileList.copy': '复制',
    'fileList.copyUrl': '复制链接',
    
    // Language
    'lang.switch': '语言',
  }
}

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {object} params - Parameters for interpolation
 * @returns {string} Translated text
 */
export function t(key, params = {}) {
  const lang = currentLang.value
  let text = translations[lang]?.[key] || translations['en'][key] || key
  
  // Replace parameters like {count}
  Object.keys(params).forEach(param => {
    text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param])
  })
  
  return text
}

/**
 * Switch language
 * @param {string} lang - Language code ('en' or 'zh')
 */
export function setLanguage(lang) {
  if (LANGUAGES[lang]) {
    currentLang.value = lang
    localStorage.setItem('r2_uploader_lang', lang)
  }
}

/**
 * Vue composable for i18n
 */
export function useI18n() {
  return {
    t,
    currentLang,
    setLanguage,
    LANGUAGES
  }
}

