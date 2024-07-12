<template>
  <form action="javascript:">
    <div class="font-bold italic">
      <div> File List</div>
    </div>

    <div class="mt-4 mb-4 flex items-center">
      <button
        class="text-xs inline-block w-auto outline mb-0"
        style="padding: 0.3rem 0.5rem"
        @click="loadData"
        :aria-busy="loading"
        :disabled="loading || !endPoint"
      >Refresh
      </button>
      <button
        class="text-xs inline-block w-auto outline mb-0 ml-2"
        style="padding: 0.3rem 0.5rem"
        @click="toggleSelectMode"
        :disabled="fileList.length === 0"
      >
        {{ selectMode && fileList.length ? 'Cancel' : 'Select' }}
      </button>
      <button
        :disabled="selectedFiles.length === 0"
        class="text-xs inline-block w-auto outline mb-0 ml-2 border-red-500 text-red-500"
        style="padding: 0.3rem 0.5rem"
        @click="deleteSelectedFiles"
      >Delete Selected
      </button>
    </div>

    <div>
      <div
        class="text-xs"
        v-show="!loading && fileList.length === 0 && !loadDataErrorText"
      >
        Seems like we got nothing here.
      </div>
      <div class="text-red-500 text-xs" v-show="loadDataErrorText">
        {{ loadDataErrorText }}

        <pre
          class="mt-2"
        ><code class="text-xs">{{ loadDataErrorStack }}</code></pre>
      </div>
      <div class="text-xs mb-4" v-show="fileList.length > 0">
        <span class="font-bold">{{ globalCursor ? 'More than' : '' }}</span> {{ fileList.length }} file{{ fileList.length === 1 ? '' : 's' }},
        {{ parseByteSize(allFileSize) }} total.
        <button class="inline outline px-2 py-1 text-xs w-auto mb-0" v-show="globalCursor" @click="loadData('more')" :aria-busy="loading">Load more</button>
      </div>

      <div class="text-xs mb-2" v-show="fileList.length > 0">
        Sort by
        <select class="text-xs inline-block w-[10rem] mb-0" v-model="sort">
          <option value="0">Default</option>
          <option value="1">Date(newest first)</option>
          <option value="2">Date(oldest first)</option>
          <option value="3">Size(largest first)</option>
          <option value="4">Size(smallest first)</option>
        </select>
      </div>

      <div class="pb-4" v-show="fileList.length > 0">
        <label for="seeFolderStructure" class="text-xs" :aria-busy="reconstructing">
          <input type="checkbox" id="seeFolderStructure" v-model="seeFolderStructure" class="mr-2" :disabled="reconstructing"> Folder Structure
        </label>
      </div>

      <div>
        <div
          class="rounded-lg mb-2"
          :class="seeFolderStructure ? 'bg-neutral-50 dark:bg-[#333] p-2 shadow' : ''"
          v-for="folder in Object.keys(dirMap).map(el => {
            return {
              name: el,
              timestamp: Date.now()
            }
          })"
          :key="folder.name + '_' + structureId"
        >
          <details open class="mb-0 pb-1">
            <summary class="text-xs" v-show="seeFolderStructure">
              {{ folder.name }}
            </summary>

            <div class="mb-2 text-xs" v-show="selectMode" @mouseenter="mouseOnSelectionCheckbox = true" @mouseleave="mouseOnSelectionCheckbox = false">
              <label :for="folder.name"><input
                name="select_all_for_folder"
                class="mr-2"
                type="checkbox"
                :id="folder.name"
                @change="handleFolderSelect(folder.name)"
              /> Select All</label>
            </div>
            <div
              class="item mb-2 rounded text-sm py-1 flex items-center justify-between"
              :class="seeFolderStructure ? 'pl-4' : ''"
              v-for="item in dirMap[folder.name]"
            >
              <div class="w-[2rem]" v-show="selectMode">
                <input
                  type="checkbox"
                  @change="updateSelectedFiles(item, folder.name)"
                  v-model="item.selected"
                  :id="item.key"
                />
              </div>
              <div
                class="name whitespace-nowrap text-left text-ellipsis overflow-hidden break-all"
                style="width: calc(100% - 7rem)"
                :style="{
                width: selectMode ? 'calc(100% - 2rem)' : 'calc(100% - 5rem)'
              }"
              >
                <div
                  class="w-full overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  <a
                    :href="(customDomain ? customDomain : endPoint) + item.key"
                    target="_blank"
                    v-show="!selectMode"
                  >{{ item.fileName }}</a
                  >
                  <label v-show="selectMode" :for="item.key" class="mb-0">{{
                      item.fileName
                    }}</label>
                </div>
              </div>
              <div
                class="actions w-[5rem] shrink-0 text-right"
                v-show="!selectMode"
              >
                <button
                  style="border: none; padding: 0.2rem 0.3rem"
                  class="w-auto inline-block outline text-xs text-red-500 mb-0"
                  @click="deleteThisFile(item.key)"
                  :aria-busy="deletingKey === item.key"
                  :disabled="deletingKey === item.key"
                >Delete
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import {onMounted, ref, watch} from 'vue'
import axios from 'axios'
import {useStatusStore} from '../store/status'
import {storeToRefs} from 'pinia'
import {nanoid} from 'nanoid'

let sort = ref('0')

onMounted(() => {
  if (localStorage.getItem('seeFolderStructure') === '1') {
    seeFolderStructure.value = true
  }

  if (localStorage.getItem('seeFolderStructure') === '0') {
    seeFolderStructure.value = false
  }
})

watch(sort, function (val) {
  localStorage.setItem('sort', val)

  mapFilesToDir()
})

function getSortVariables(val) {
  let sortKey
  let sortType

  if (val === '1') {
    sortKey = 'uploaded_timestamp'
    sortType = 'desc'
  } else if (val === '2') {
    sortKey = 'uploaded_timestamp'
    sortType = 'asc'
  } else if (val === '3') {
    sortKey = 'size'
    sortType = 'desc'
  } else if (val === '4') {
    sortKey = 'size'
    sortType = 'asc'
  }

  return {sortKey, sortType}
}

let sortFileList = function (sortKey, sortType) {
  let temp = JSON.parse(JSON.stringify(fileList.value))
  temp.map((el) => {
    return (el.uploaded_timestamp = new Date(el.uploaded).getTime())
  })

  temp = temp.sort((a, b) => {
    if (sortType === 'desc') {
      return b[sortKey] - a[sortKey]
    } else {
      return a[sortKey] - b[sortKey]
    }
  })

  return temp
}

let statusStore = useStatusStore()
let {uploading, endPointUpdated} = storeToRefs(statusStore)

let selectMode = ref(false)

let endPoint = localStorage.getItem('endPoint')
let apiKey = localStorage.getItem('apiKey')
let customDomain = localStorage.getItem('customDomain')

watch(uploading, (newVal) => {
  if (!newVal) {
    endPoint = localStorage.getItem('endPoint')
    apiKey = localStorage.getItem('apiKey')
    customDomain = localStorage.getItem('customDomain')
    loadData()
  }
})

watch(endPointUpdated, (newVal) => {
  endPoint = localStorage.getItem('endPoint')
  apiKey = localStorage.getItem('apiKey')
  customDomain = localStorage.getItem('customDomain')
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
  let isInputChecked = document.getElementById(folder).checked

  if (isInputChecked) {
    files.forEach((file) => {
      file.selected = true
      updateSelectedFiles(file, folder)
    })
  } else {
    files.forEach((file) => {
      file.selected = false
      updateSelectedFiles(file, folder)
    })
  }
}

let mouseOnSelectionCheckbox = ref(false)

function updateSelectedFiles(file, folder) {
  if (file.selected) {
    selectedFiles.value.push(file)
  } else {
    selectedFiles.value = selectedFiles.value.filter(
      (item) => item.key !== file.key
    )
  }

  if (folder !== undefined && !mouseOnSelectionCheckbox.value) {
    let files = dirMap.value[folder]
    let isAllSelected = files.every((item) => item.selected)
    console.log('isAllSelected', isAllSelected)
    console.log('document.getElementById(folder)', document.getElementById(folder))
    document.getElementById(folder).checked = isAllSelected
    console.log('document.getElementById(folder).checked', document.getElementById(folder).checked)
  }
}

function restoreSortSelection() {
  let sortFromLocal = localStorage.getItem('sort')

  // check local value is valid
  if (!['0', '1', '2', '3', '4'].includes(sortFromLocal)) {
    return false
  }

  if (sortFromLocal) {
    sort.value = sortFromLocal
  }
}

let selectedFiles = ref([])

function deleteSelectedFiles() {
  let c = confirm('Are you sure to delete these files?')

  if (!c) {
    return false
  }

  selectedFiles.value.forEach((file) => {
    deleteThisFile(file.key, true, {
      callback: () => {
        selectedFiles.value = selectedFiles.value.filter(
          (item) => item.key !== file.key
        )

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

  document.querySelectorAll('input[type="checkbox"][name="select_all_for_folder"]').forEach(el => {
    el.checked = false
  })

  let folders = Object.keys(dirMap.value)
  folders.forEach((folder) => {
    document.getElementById(folder).checked = false
    let files = dirMap.value[folder]
    files.forEach((file) => {
      file.selected = false
    })
  })
}

let dirMap = ref({})
let seeFolderStructure = ref(true)
let reconstructing = ref(false)

async function parseDirs(file) {
  if (seeFolderStructure.value) {
    let dirs = file.key.split('/')

    let fileName = dirs[dirs.length - 1]

    dirs = dirs.slice(0, dirs.length - 1)

    let dirKey = dirs.join('/') + '/'

    let item = {
      fileName: fileName,
      key: file.key
    }
    if (dirMap.value[dirKey]) {
      dirMap.value[dirKey].push(item)
    } else {
      dirMap.value[dirKey] = [
        item
      ]
    }
  } else {
    let item = {
      fileName: file.key,
      key: file.key
    }
    if (dirMap.value['/']) {
      dirMap.value['/'].push(item)
    } else {
      dirMap.value['/'] = [
        item
      ]
    }
  }
}

async function mapFilesToDir() {
  dirMap.value = {}
  reconstructing.value = true

  let start = Date.now()

  let {sortKey, sortType} = getSortVariables(sort.value)
  let temp = sortFileList(sortKey, sortType)

  fileList.value = temp

  await Promise.all(fileList.value.map(async (item) => {
    await parseDirs(item)
  }))

  let end = Date.now()

  reconstructing.value = false

  console.log('reconstructed dirMap, took ', end - start, 'ms')
}

let structureId = nanoid()
watch(seeFolderStructure, async () => {
  structureId = nanoid()
  localStorage.setItem('seeFolderStructure', seeFolderStructure.value ? '1' : '0')
  await mapFilesToDir()
})

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
  })
    .then(async () => {
      deletingKey.value = ''
      fileList.value = fileList.value.filter((item) => item.key !== key)
      await mapFilesToDir()

      if (options.callback) {
        options.callback()
      }
    })
    .catch(() => {
      deletingKey.value = ''
      alert('Failed to delete file.')
    })
}

watch(fileList, (newVal) => {
  allFileSize.value = 0
  newVal.forEach((item) => {
    allFileSize.value += item.size
  })

  statusStore.uploadedFiles = newVal
})

let loadDataErrorText = ref('')
let loadDataErrorStack = ref('')

let globalCursor = ref('')

let loadData = async function (action) {
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
    url: endPoint + (action === 'more' && globalCursor.value ? '?cursor=' + globalCursor.value : '')
  })
    .then(async (res) => {
      loading.value = false

      if (globalCursor.value && action === 'more') {
        fileList.value.push(...res.data.objects)
      } else {
        fileList.value = res.data.objects
      }

      if (res.data.truncated && res.data.cursor) {
        globalCursor.value = res.data.cursor
      } else {
        globalCursor.value = ''
      }

      restoreSortSelection()

      await mapFilesToDir()
    })
    .catch((e) => {
      loading.value = false
      let errorJson = e.toJSON()
      console.log(errorJson)
      loadDataErrorText.value = `[${errorJson.message}], please check your endpoint and API key.`
      loadDataErrorStack.value = errorJson.stack
      return false
    })
    .finally(() => {
      clearSelection()
    })
}

loadData()
</script>
