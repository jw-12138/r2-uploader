<template>
  <div>
    <details :open="panelOpen === '1'" id="panel">
      <summary class='font-bold italic'>
        Endpoints
      </summary>
      <article>
        <form action="javascript:" class="mb-0">
          <div class="pb-2 text-xs opacity-80">
            <span v-show="endPointList.length === 1">You have 1 endpoint, and it is selected.</span>
            <span v-show="endPointList.length > 1">
            Choose between different endpoints, {{ 'you have ' + endPointList.length + ' endpoints' }}
          </span>
          </div>
          <div v-show="endPointList.length === 0" class="text-sm">
            You need Cloudflare Workers to upload files to Cloudflare R2. Have a look at the
            <a href="/setup-guide/" class="underline">setup guide</a>.
          </div>
          <div v-for="item in endPointList" class="flex mt-2">
            <input type="radio" name="current_endpoint" :id="item.endPoint" :data-id="item.endPoint" :checked="item.endPoint === endPoint"
                   @change="updateCurrentEndPoint(item.endPoint)" class="w-[2rem] shrink-0"><label
            :for="item.endPoint" class="text-xs w-full">{{ item.endPoint }}</label>

            <button class="shrink-0 bg-transparent w-auto outline inline-block text-xs text-emerald-500 mb-0 mr-2"
                    style="padding: 0; border: 0" @click="editThisEndpoint(item.endPoint)"
                    :disabled="editingEndpoint !== item.endPoint && editingEndpoint !== ''">
              {{ editingEndpoint === item.endPoint ? 'Cancel' : 'Edit' }}
            </button>
            <button class="shrink-0 bg-transparent w-auto outline inline-block text-xs text-red-500 mb-0"
                    style="padding: 0; border: 0" @click="deleteThisEndPoint(item.endPoint)" :disabled="editingEndpoint !== ''">Delete
            </button>
          </div>
        </form>
      </article>
      <article>
        <form class="mb-0" action="javascript:" @submit="saveApiInfo">
          <div class="pb-2 text-xs opacity-80">
            {{ endpointActionText }} &nbsp;
          </div>
          <div>
            <label for="" class="text-sm">Workers Endpoint</label>
            <input type="text" placeholder="https://..." v-model="newEndpoint" class="text-xs" required>
          </div>
          <div>
            <label for="api_key" class="text-sm">Workers Endpoint API Key</label>
            <input type="password" placeholder="treat it like your browser history" v-model="newApiKey" required
                   id="api_key" class="text-xs">
          </div>
          <div>
            <label for="custom_domain" class="text-sm">Custom Domain (Optional)</label>
            <input type="text" placeholder="no need for the https:// prefix" v-model="newCustomDomain"
                   id="custom_domain"
                   style="margin-bottom: .5rem" class="text-xs">
            <div class="opacity-70 text-xs leading-4 mb-8">
              Use your own domain name to access the files instead of <code
              class="text-black dark:text-white">&lt;bucket&gt;.&lt;user&gt;.workers.dev</code>.
            </div>
          </div>
          <div class="text-center mt-4">
            <button class="inline-block w-auto text-sm mb-0" :disabled="btnDisabled" type="submit"
                    style="padding: .3rem 1rem">
              &nbsp;{{ btnText }}&nbsp;
            </button>
          </div>
        </form>
      </article>
      <article>
        <sync-endpoints></sync-endpoints>
      </article>
    </details>

  </div>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import {useStatusStore} from '../store/status'
import SyncEndpoints from './syncEndpoints.vue'
import { storeToRefs } from 'pinia'
import {animateText} from '../utils/animateText.js'

let statusStore = useStatusStore()
let { endPointPulled } = storeToRefs(statusStore)

let endPoint = ref('')
let apiKey = ref('')
let btnText = ref('Save To LocalStorage')
let btnDisabled = ref(false)
let endPointList = ref([])
let panelOpen = ref('1')
let customDomain = ref('')

let newEndpoint = ref('')
let newApiKey = ref('')
let newCustomDomain = ref('')

let editingEndpoint = ref('')
let endpointActionText = ref('Add a new endpoint')
let editThisEndpoint = function (endpoint) {
  if (editingEndpoint.value === endpoint) {
    editingEndpoint.value = ''
    animateText(endpointActionText, 'Add a new endpoint')
    newEndpoint.value = ''
    newApiKey.value = ''
    newCustomDomain.value = ''
    return
  }

  newEndpoint.value = endpoint
  newApiKey.value = endPointList.value.find(item => item.endPoint === endpoint).apiKey
  newCustomDomain.value = endPointList.value.find(item => item.endPoint === endpoint).customDomain || ''

  if (newCustomDomain.value !== '') {
    let customDomainUrl = new URL(newCustomDomain.value)
    newCustomDomain.value = customDomainUrl.hostname
  }

  editingEndpoint.value = endpoint

  animateText(endpointActionText, 'Edit this endpoint')
}


const restoreEndPointList = function () {
  endPointList.value = JSON.parse(localStorage.getItem('endPointList')) || []
}

const deleteThisEndPoint = function (endpoint) {
  let c = confirm('Are you sure to delete this endpoint?')

  if (!c) {
    return
  }

  endPointList.value = endPointList.value.filter(item => item.endPoint !== endpoint)

  localStorage.setItem('endPointList', JSON.stringify(endPointList.value))

  if (endPointList.value.length === 0) {
    localStorage.removeItem('endPoint')
    localStorage.removeItem('apiKey')
    localStorage.removeItem('customDomain')

    endPoint.value = ''
    apiKey.value = ''
    customDomain.value = ''

    statusStore.endPointUpdated += 1
  } else {
    updateCurrentEndPoint(endPointList.value[0].endPoint)
  }
}

const restoreSavedApiInfo = function () {
  endPoint.value = localStorage.getItem('endPoint') || ''
  apiKey.value = localStorage.getItem('apiKey') || ''
  customDomain.value = localStorage.getItem('customDomain') || ''
}

let updateCurrentEndPoint = function (endpoint) {
  let item = endPointList.value.find(item => item.endPoint === endpoint)

  endPoint.value = item.endPoint
  apiKey.value = item.apiKey
  customDomain.value = item.customDomain || ''

  localStorage.setItem('endPoint', item.endPoint)
  localStorage.setItem('apiKey', item.apiKey)
  localStorage.setItem('customDomain', item.customDomain || '')
  statusStore.endPointUpdated += 1
}

const saveApiInfo = function () {
  let url
  try {
    url = new URL(newEndpoint.value)
  } catch (e) {
    alert('Invalid endpoint format, it should be a valid URL.')
    return
  }

  if (newEndpoint.value[newEndpoint.value.length - 1] !== '/') {
    newEndpoint.value += '/'
  }

  if (newCustomDomain.value !== '') {
    newCustomDomain.value = 'https://' + newCustomDomain.value
    let customDomainUrl
    try {
      customDomainUrl = new URL(newCustomDomain.value)
    } catch (e) {
      alert('Invalid custom domain format, it should be a valid URL.')
      return
    }

    if (newCustomDomain.value[newCustomDomain.value.length - 1] !== '/') {
      newCustomDomain.value += '/'
    }
  }

  // check for duplicate
  let duplicate = endPointList.value.find(item => item.endPoint === newEndpoint.value)

  // if duplicated, update the apiKey and customDomain
  if (duplicate) {
    duplicate.apiKey = newApiKey.value
    duplicate.customDomain = newCustomDomain.value
    endPointList.value = endPointList.value.filter(item => item.endPoint !== newEndpoint.value)
    endPointList.value.push(duplicate)

    if (endPoint.value === newEndpoint.value) {
      updateCurrentEndPoint(newEndpoint.value)
    }
  } else {
    endPointList.value.push({
      endPoint: newEndpoint.value,
      apiKey: newApiKey.value,
      customDomain: newCustomDomain.value
    })
  }

  editingEndpoint.value = ''
  animateText(endpointActionText, 'Add a new endpoint')

  localStorage.setItem('endPointList', JSON.stringify(endPointList.value))

  animateText(btnText, 'Saved!', {
    interval: 80,
    skipText: 'S'
  })
  btnDisabled.value = true

  if (endPointList.value.length === 1) {
    updateCurrentEndPoint(newEndpoint.value)
  }

  newEndpoint.value = ''
  newApiKey.value = ''
  newCustomDomain.value = ''

  setTimeout(() => {
    animateText(btnText, 'Save To LocalStorage', {
      interval: 20,
      skipText: 'Save '
    })
    btnDisabled.value = false
  }, 2000)
}

function restorePanelOpenStatus() {
  let status = localStorage.getItem('panelOpen')
  if (status === '1') {
    panelOpen.value = '1'
  } else {
    panelOpen.value = '0'
  }
}

watch(endPointList, val => {
  localStorage.setItem('localEndpointListUpdateTime', Date.now() + '')
}, {
  deep: true
})

watch(endPointPulled, val => {
  restoreEndPointList()

  if (endPointList.value.length >= 1) {
    endPoint.value = endPointList.value[0].endPoint
    apiKey.value = endPointList.value[0].apiKey
    customDomain.value = endPointList.value[0].customDomain || ''
    updateCurrentEndPoint(endPointList.value[0].endPoint)
  }

  restoreSavedApiInfo()
})

onMounted(() => {
  restoreSavedApiInfo()
  restoreEndPointList()

  document.getElementById('panel').addEventListener('toggle', function (e) {
    panelOpen.value = e.target.open ? '1' : '0'
    localStorage.setItem('panelOpen', panelOpen.value)
  })

  restorePanelOpenStatus()
})
</script>