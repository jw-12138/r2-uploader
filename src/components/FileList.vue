<template>
  <form action="javascript:">
    <div class='font-bold italic'>
      <div>
        File List
      </div>
    </div>

    <div class="mt-4 mb-4 flex items-center">
      <button class="text-xs inline-block w-auto outline mb-0" style="padding: .3rem .5rem" @click="loadData"
              :aria-busy="loading" :disabled="loading || !endPoint">Refresh
      </button>
      <button class="text-xs inline-block w-auto outline mb-0 ml-2" style="padding: .3rem .5rem"
              @click="toggleSelectMode" :disabled="fileList.length === 0">
        {{ selectMode && fileList.length ? 'Cancel' : 'Select' }}
      </button>
      <button :disabled="selectedFiles.length === 0"
              class="text-xs inline-block w-auto outline mb-0 ml-2 border-red-500 text-red-500"
              style="padding: .3rem .5rem" @click="deleteSelectedFiles">Delete Selected
      </button>
    </div>

    <div>
      <div class="text-xs" v-show="!loading && fileList.length === 0 && !loadDataErrorText">
        Seems like we got nothing here.
      </div>
      <div class="text-red-500 text-xs" v-show="loadDataErrorText">
        {{ loadDataErrorText }}

        <pre class="mt-2"><code class="text-xs">{{ loadDataErrorStack }}</code></pre>
      </div>
      <div class="text-xs mb-2" v-show="fileList.length > 0">
        {{ fileList.length }} File{{ fileList.length === 1 ? '' : 's' }},
        {{ parseByteSize(allFileSize) }} total.
      </div>
      <div>
        <div class="bg-[#eee] dark:bg-[#333] rounded p-2 mb-2" v-for="folder in Object.keys(dirMap)">
          <div class="mb-2 text-xs opacity-60 italic">{{ folder }}/</div>
          <div class="mb-2 text-xs" v-show="selectMode">
            <input type="checkbox" :id="folder + '/'" @change="handleFolderSelect(folder)"> <label :for="folder + '/'">Select
            All</label>
          </div>
          <div class="item mb-2 rounded text-sm pl-4 py-1 flex items-center justify-between"
               v-for="item in dirMap[folder]">
            <div class="w-[2rem]" v-show="selectMode">
              <input type="checkbox" @change="updateSelectedFiles(item, folder)" v-model="item.selected" :id="item.key">
            </div>
            <div class="name whitespace-nowrap text-left text-ellipsis overflow-hidden break-all"
                 style="width: calc(100% - 7rem);" :style="{
              width: selectMode ? 'calc(100% - 2rem)' : 'calc(100% - 5rem)'
            }">
              <div class="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                <a :href=" 'https://blog-r2.jw1.dev/' + item.key " target="_blank" v-show="!selectMode">{{ item.fileName }}</a>
                <label v-show="selectMode" :for="item.key" class="mb-0">{{ item.fileName }}</label>
              </div>
            </div>
            <div class="actions w-[5rem] shrink-0 text-right" v-show="!selectMode">
              <button style="border: none; padding: .2rem .3rem"
                      class="w-auto inline-block outline text-xs text-red-500 mb-0" @click="deleteThisFile(item.key)"
                      :aria-busy="deletingKey === item.key"
                      :disabled="deletingKey === item.key">Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import {ref, watch} from 'vue'
import axios from 'axios'
import {useStatusStore} from '../store/status'
import {storeToRefs} from 'pinia'

let statusStore = useStatusStore()
let {uploading, endPointUpdated} = storeToRefs(statusStore)

let selectMode = ref(false)

let endPoint = localStorage.getItem('endPoint')
let apiKey = localStorage.getItem('apiKey')

watch(uploading, (newVal) => {
  if (!newVal) {
    loadData()
  }
})

watch(endPointUpdated, (newVal) => {
  endPoint = localStorage.getItem('endPoint')
  apiKey = localStorage.getItem('apiKey')
  fileList.value = []
  dirMap.value = {}
  loadData()
})

let allFileSize = ref(0)

let parseByteSize = function (size) {
  let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let index = 0
  while (size > 1000) {
    size /= 1000
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

let fileList = ref([])
let loading = ref(false)

function handleFolderSelect(folder) {
  let files = dirMap.value[folder]
  let isInputChecked = document.getElementById(folder + '/').checked

  if (isInputChecked) {
    files.forEach(file => {
      file.selected = true
      updateSelectedFiles(file, folder)
    })
  } else {
    files.forEach(file => {
      file.selected = false
      updateSelectedFiles(file, folder)
    })
  }
}

function updateSelectedFiles(file, folder) {
  if (file.selected) {
    selectedFiles.value.push(file)
  } else {
    selectedFiles.value = selectedFiles.value.filter(item => item.key !== file.key)
  }

  if (folder !== undefined) {
    let files = dirMap.value[folder]
    let isAllSelected = files.every(item => item.selected)
    document.getElementById(folder + '/').checked = isAllSelected
  }
}

let selectedFiles = ref([])

function deleteSelectedFiles() {
  let c = confirm('Are you sure to delete these files?')

  if (!c) {
    return false
  }

  selectedFiles.value.forEach(file => {
    deleteThisFile(file.key, true, {
      callback: () => {
        selectedFiles.value = selectedFiles.value.filter(item => item.key !== file.key)

        if (selectedFiles.value.length === 0) {
          setTimeout(() => {
            console.log('All selected files have been deleted.')
            clearSelection()
          }, 50)
        }

        if (fileList.value.length === 0) {
          selectMode.value = false
        }
      }
    })
  })
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  selectedFiles.value = []

  if (!selectMode.value) {
    clearSelection()
  }
}

function clearSelection() {
  selectedFiles.value = []
  let folders = Object.keys(dirMap.value)
  folders.forEach(folder => {
    document.getElementById(folder + '/').checked = false
    let files = dirMap.value[folder]
    files.forEach(file => {
      file.selected = false
    })
  })
}


let dirMap = ref({})

function parseDirs(file) {
  let dirs = file.key.split('/')

  let fileName = dirs[dirs.length - 1]

  dirs = dirs.slice(0, dirs.length - 1)

  let dirKey = dirs.join('/')

  if (dirMap.value[dirKey]) {
    dirMap.value[dirKey].push({
      fileName: fileName,
      key: file.key
    })
  } else {
    dirMap.value[dirKey] = [{
      fileName: fileName,
      key: file.key
    }]
  }
}

let deletingKey = ref('')
let deleteThisFile = function (key, isBatchDelete = false, options = {}) {
  let c = true

  if (!isBatchDelete) {
    c = confirm('Are you sure to delete this file?')
  }

  if (!c) {
    return false
  }


  deletingKey.value = key

  let fileName = '/' + key
  if (endPoint[endPoint.length - 1] === '/') {
    fileName = key
  }

  axios({
    method: 'delete',
    headers: {
      'x-api-key': localStorage.getItem('apiKey')
    },
    url: endPoint + fileName
  }).then(() => {
    deletingKey.value = ''
    fileList.value = fileList.value.filter(item => item.key !== key)
    dirMap.value = {}
    fileList.value.forEach(item => {
      parseDirs(item)
    })

    if (options.callback) {
      options.callback()
    }
  }).catch(() => {
    deletingKey.value = ''
    alert('Failed to delete file.')
  })
}

watch(fileList, (newVal) => {
  allFileSize.value = 0
  newVal.forEach(item => {
    allFileSize.value += item.size
  })

  statusStore.uploadedFiles = newVal
})

let loadDataErrorText = ref('')
let loadDataErrorStack = ref('')
let loadData = async function () {
  loading.value = true
  loadDataErrorText.value = ''
  loadDataErrorStack.value = ''

  if (!endPoint || !apiKey) {
    loading.value = false
    return false
  }

  axios({
    method: 'patch',
    headers: {
      'x-api-key': apiKey
    },
    url: endPoint
  }).then(res => {
    loading.value = false

    fileList.value = res.data.objects

    dirMap.value = {}
    fileList.value.forEach(item => {
      parseDirs(item)
    })
  }).catch(e => {
    loading.value = false
    let errorJson = e.toJSON()
    console.log(errorJson)
    loadDataErrorText.value = `[${errorJson.message}], please check your endpoint and API key.`
    loadDataErrorStack.value = errorJson.stack
    return false
  })
}

loadData()
</script>