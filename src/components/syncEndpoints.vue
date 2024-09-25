<template>
  <div>
    <div class="pb-2 text-xs opacity-80">
      Sync Endpoints
    </div>
    <div aria-busy="true" v-show="findingUser">

    </div>
    <div class="text-sm" v-show="!isLogin && !findingUser">
      To sync your endpoints across devices, you can login with your GitHub account. All the information will be
      AES encrypted locally and then stored in our database.
    </div>
    <div class="mt-6" v-show="!isLogin && !findingUser">
      <button class="text-sm inline-block w-auto mb-0" @click="goToLogin">Login With <img
        class="h-[1.3rem] relative top-[-.1rem]"
        :src="isDark ? 'https://r2-cf-api.jw1.dev/GitHub_Logo.png' : 'https://r2-cf-api.jw1.dev/GitHub_Logo_White.png'"
        alt="GitHub"></button>
    </div>

    <div v-show="isLogin">
      <div class="text-sm mb-4 mt-4">
        Welcome, {{ userInfo.login }}!
      </div>
      <div>
        <div>
          <div class="text-xs mb-4" v-show="!hasEncryptionPassword">
            Since now you've logged in, you can sync your endpoints across devices. But first, you need to provide a
            password to encrypt and decrypt your data. Remember, this password will be stored locally and will not be
            sent to our
            server. Meaning <b>if you forget it, you'll lose all previously saved data</b>.
          </div>
          <form action="javascript:" @submit="saveEncryptionPassword">
            <label for="en_password" class="text-sm">Encryption/Decryption Password</label>
            <div class="flex">
              <input class="mb-0" type="password" id="en_password" min="16" required v-model="encryptionPassword"
                     v-if="!showPassword"
                     @focus="encryptionPasswordInputFocus = true" @blur="encryptionPasswordInputFocus = false">
              <input class="mb-0" type="text" id="en_password" min="16" required v-model="encryptionPassword" v-else>
              <button class="shrink-0 text-xs outline inline-block w-auto ml-2" type="submit">
                {{ hasEncryptionPassword ? 'Update' : 'Save' }}
              </button>
            </div>
            <div>
              <input type="checkbox" v-model="showPassword" id="show_password"> <label for="show_password"
                                                                                       class="text-xs">Show
              password</label>
            </div>

          </form>
        </div>
        <div class="text-xs">
          <button class="inline-block w-auto text-xs mb-2" :disabled="!hasEncryptionPassword || syncingMyData"
                  @click="syncMyData" :aria-busy="syncingMyData">🔼 Push
          </button>
          <button class="inline-block w-auto text-xs ml-2 mb-2" :disabled="!hasEncryptionPassword || pullingMyData"
                  @click="pullMyData" :aria-busy="pullingMyData">🔽 Pull
          </button>
          <br>
          <button class="inline-block w-auto text-xs outline" @click="logout">Log Out</button>
          <button class="ml-2 inline-block w-auto text-xs outline border-red-500 text-red-500" @click="deleteMyData"
                  :disabled="deletingMyData" :aria-busy="deletingMyData">Delete all synced endpoints
          </button>
        </div>
        <div class="text-xs opacity-50 mt-2">
          status: {{ sync_status }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, watch} from 'vue'
import AES from 'crypto-js/aes'
import {useStatusStore} from '../store/status'

let statusStore = useStatusStore()
import * as encoding from 'crypto-js/enc-utf8'
import {animateText} from '../utils/animateText.js'
import axios from 'axios'

let isDark = ref(false)
let GITHUB_CLIENT_ID = '8318b6fc09ace8ab9747'

let showPassword = ref(false)

let getWindowTheme = () => {
  isDark.value = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

let logout = function () {
  let c = confirm('Are you sure to log out?')

  if (!c) {
    return false
  }

  isLogin.value = false
  encryptionPassword.value = ''
  localStorage.removeItem('access_token')
  localStorage.removeItem('encryption_password')
}

let encryptionPassword = ref('')
let hasEncryptionPassword = ref(false)
let encryptionPasswordInputFocus = ref(false)

let saveEncryptionPassword = () => {
  localStorage.setItem('encryption_password', encryptionPassword.value)

  // first time
  if (localStorage.getItem('encryptedEndpointList')) {
    let decryptedData = decryptData(localStorage.getItem('encryptedEndpointList'))
    localStorage.setItem('endPointList', decryptedData)
    statusStore.endPointUpdated += 1
    localStorage.removeItem('encryptedEndpointList')

    animateText(sync_status, 'decrypted and saved')
  }

  hasEncryptionPassword.value = true
}

let restoreEncryptionPassword = () => {
  let password = localStorage.getItem('encryption_password')
  if (password) {
    encryptionPassword.value = password
    hasEncryptionPassword.value = true
  }
}

restoreEncryptionPassword()

let listenWindowTheme = () => {
  let mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', e => {
    isDark.value = e.matches
  })
}

getWindowTheme()
listenWindowTheme()

let sync_status = ref('waiting for user action')

let encryptData = function (data) {
  let key = encryptionPassword.value

  return AES.encrypt(data, key).toString()
}

let decryptData = function (data) {
  let key = encryptionPassword.value
  let decryptedData

  try {
    decryptedData = AES.decrypt(data, key).toString(encoding)
  } catch (e) {
    decryptedData = 'decryption failed'
  }

  return decryptedData
}

let syncingMyData = ref(false)
let syncMyData = async function () {
  let endPointList = localStorage.getItem('endPointList')
  let encryptedData = encryptData(endPointList)
  let apiEndpoint = '/api/sync_config'

  animateText(sync_status, 'pushing...hold on')

  syncingMyData.value = true
  let req = await axios(apiEndpoint, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    data: {
      config: encryptedData
    }
  })

  syncingMyData.value = false

  if (req.status !== 200) {
    animateText(sync_status, 'push failed')
    return false
  }

  animateText(sync_status, 'pushed')
}

let pullingMyData = ref(false)
let pullMyData = async function () {
  let apiEndpoint = '/api/pull_config'

  animateText(sync_status, 'pulling...hold on')

  pullingMyData.value = true
  let req = await fetch(apiEndpoint, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    method: 'GET'
  }).catch(e => {
    pullingMyData.value = false
    animateText(sync_status, 'pull failed')
  })

  pullingMyData.value = false

  let data = await req.json()

  if (!hasEncryptionPassword.value) {
    localStorage.setItem('encryptedEndpointList', data.config)

    animateText(sync_status, 'pulled, insert your password to decrypt the data')

    return false
  }

  let decryptedData = decryptData(data.config)

  if (decryptedData === '') {
    animateText(sync_status, 'pulled, but found nothing')
    return false
  }

  let currentEndpointList = localStorage.getItem('endPointList')
  let currentEndpointListJson = JSON.parse(currentEndpointList)

  let remoteEndpointListJson

  try {
    remoteEndpointListJson = JSON.parse(decryptedData)
  } catch (e) {
    animateText(sync_status, 'pulled, but the data seems to be corrupted, check your password please')
    return false
  }

  if (currentEndpointListJson === null) {
    currentEndpointListJson = []
  }
  let mergedEndpointList = [...currentEndpointListJson, ...remoteEndpointListJson]

  mergedEndpointList = mergedEndpointList.filter((item, index, self) => {
    return self.findIndex(t => t.endPoint === item.endPoint) === index
  })

  localStorage.setItem('endPointList', JSON.stringify(mergedEndpointList))

  animateText(sync_status, 'pulled')

  statusStore.endPointPulled += 1
}

let deletingMyData = ref(false)
let deleteMyData = async function () {
  let c = confirm('This action will delete all your data on our server. Are you sure?')

  if (!c) {
    return false
  }

  let c2 = confirm('Are you really sure? This action cannot be undone.')

  if (!c2) {
    return false
  }

  deletingMyData.value = true
  animateText(sync_status, 'deleting...hold on')
  let apiEndpoint = '/api/delete_config'

  let req = await axios(apiEndpoint, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    method: 'DELETE'
  })

  deletingMyData.value = false

  if (req.status === 204) {
    animateText(sync_status, 'deleted')
  } else {
    animateText(sync_status, 'delete Failed, try again please')
  }
}

let loginEndpoint = 'https://github.com/login/oauth/authorize'
let scope = 'public_repo'
let redirect_uri = 'https://r2.jw1.dev/api/auth_callback'
let goBackURL = `${location.protocol}//${location.host}`
goBackURL = encodeURIComponent(goBackURL)
redirect_uri += `?r=${goBackURL}`
let loginURL = `${loginEndpoint}?client_id=${GITHUB_CLIENT_ID}&scope=${scope}&redirect_uri=${redirect_uri}`
let goToLogin = function () {
  location.href = loginURL
}

let isLogin = ref(false)
let findingUser = ref(false)

let findTokenInUrl = function () {
  let accessToken = ''
  let url = new URL(location.href)

  if (url.searchParams.has('access_token')) {
    accessToken = url.searchParams.get('access_token')
    localStorage.setItem('access_token', accessToken)

    let refreshUrl = window.location.href.split('?')
    refreshUrl = refreshUrl[0]

    location.href = refreshUrl
  }
}

findTokenInUrl()


let findTokenInLocalStorage = function () {
  let accessToken = localStorage.getItem('access_token')
  if (accessToken) {
    checkUser()
  }
}

findTokenInLocalStorage()

let findUserGotError = ref(false)

let userInfo = ref({})

async function checkUser() {
  let endPoint = '/api/check_github_user'

  findingUser.value = true

  let user = await axios(endPoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
  })

  findingUser.value = false

  if (user.status !== 200) {
    findUserGotError.value = true
    console.log(user)
  } else {
    let userJson = user.data
    userInfo.value = userJson

    isLogin.value = true
  }
}

let cleanSyncStatusTimeout = null

watch(sync_status, val => {
  clearTimeout(cleanSyncStatusTimeout)
  cleanSyncStatusTimeout = setTimeout(() => {
    animateText(sync_status, 'waiting for user action')
  }, 10000)
})
</script>