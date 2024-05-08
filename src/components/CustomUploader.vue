<template>
  <div>
    <form action="javascript:">
      <div class="font-bold italic"> Upload Files</div>
      <div>
        <label
          for="fileInput"
          class="rounded bg-emerald-200 dark:bg-emerald-800 px-4 py-2 inline-block mt-4 mb-4 cursor-pointer text-sm shadow hover:shadow-xl"
          :style="{
            opacity: uploading ? 0.5 : 1
          }"
        >{{ chooseFileBtnText }}
        </label>

        <label
          v-show="browserSupportsDirectoryUpload"
          class="ml-2 rounded bg-emerald-100 dark:bg-emerald-900 px-4 py-2 inline-block mt-4 mb-4 cursor-pointer text-sm shadow hover:shadow-xl"
          :style="{
            opacity: uploading ? 0.5 : 1
          }"
          @click="handleFolder"
        >Choose Folder 📂</label
        >

        <input
          id="fileInput"
          type="file"
          @change="handleFilesChange"
          multiple
          class="absolute left-[-9999rem]"
          :disabled="uploading"
        />
      </div>
      <div class="mt-2" v-show="fileList.length">
        <button
          class="inline-block w-auto shadow transition-all hover:shadow-xl hover:rounded-3xl"
          @click="upload"
          :disabled="uploading"
        >🔥 Upload
        </button
        >
      </div>
      <div>
        <div class="text-xs opacity-50 mb-2"
        >{{ fileList.length }} File{{ fileList.length === 1 ? '' : 's' }},
          {{ parseByteSize(allFileSize) }} total.
          <span v-show="skipFilesWithTheSameName && !uploading">
            Will skip
            <span v-show="calcSkipFiles() === fileList.length && !uploading"
            >all.
            </span>
            <span v-show="calcSkipFiles() !== fileList.length"
            >{{ calcSkipFiles() }} file{{ calcSkipFiles() === 1 ? '' : 's' }}.
            </span>
          </span>
        </div>
        <div v-show="fileList.length + uploadedList.length > 0">
          <div
            class="text-center text-xs py-4"
            v-show="uploading || uploadedList.length > 0"
          >
            {{ uploadIsDone ? 'Uploaded' : 'Uploading' }} at
            <span class="dark:text-green-200 text-green-800 italic font-bold">{{
                globalSpeed
              }}</span
            ><span v-show="uploadIsDone">, All done.</span>
          </div>
        </div>

        <div
          v-show="fileList.length + uploadedList.length > 0"
          class="pb-4 pt-2"
        >
          <!--          upload status map -->
          <div class="flex flex-wrap dark:bg-neutral-950 bg-neutral-50 pt-2 px-2 pb-1 rounded-xl shadow">
            <div
              v-for="item in uploadedList"
              class="bg-green-400 rounded-xl w-[.5rem] h-[.5rem] mb-1 mr-1"
            >
            </div>
            <div
              v-for="item in fileList"
              class="bg-gray-300 dark:bg-neutral-700 w-[.5rem] h-[.5rem] mb-1 mr-1 relative rounded-xl overflow-hidden"
            >
              <div
                class="absolute w-full bottom-0 left-0"
                style="height: 0"
                :style="{
                  height: progressMap[item.key] + '%'
                }"
                :class="{
                  'bg-red-500': statusMap[item.key] === 'error',
                  'bg-green-400': statusMap[item.key] !== 'error',
                  'dark:bg-green-600': statusMap[item.key] !== 'error'
                }"
              ></div>
            </div>
          </div>
        </div>
        <div v-show="uploadIsDone" class="text-center">
          <button class="inline-block border-0 w-auto text-xs outline dark:bg-neutral-800 bg-neutral-100 hover:bg-neutral-300 hover:dark:bg-neutral-700 rounded-3xl" style="border: none;" @click="clearUploadedFiles">Dismiss</button>
        </div>
        <div class="pb-4" v-show="fileList.length > 0 && !uploading">
          <div class="flex mb-2">
            <input
              :disabled="uploading"
              class="text-xs shrink-0"
              type="checkbox"
              id="skip_uploading_if_filename_is_the_same"
              v-model="skipFilesWithTheSameName"
            />
            <label for="skip_uploading_if_filename_is_the_same" class="text-xs"
            >Skip uploading files with the same name</label
            >
          </div>
          <div class="flex mb-2">
            <input
              type="checkbox"
              class="text-xs shrink-0"
              :disabled="uploading"
              v-model="renameFileWithRandomId"
              id="renameFileWithRandomId"
            />
            <label class="text-xs" for="renameFileWithRandomId"
            >Rename each file with a random ID</label
            >
          </div>
          <div class="flex">
            <input
              type="checkbox"
              class="text-xs shrink-0"
              :disabled="uploading"
              v-model="compressImagesBeforeUploading"
              id="compressImagesBeforeUploading"
            />
            <label class="text-xs" for="compressImagesBeforeUploading">
              Compress images before uploading
            </label>
          </div>
          <div v-show="compressImagesBeforeUploading" class="text-xs pt-4 pl-2">
            <div>
              <label for="removeEXIF" class="flex items-center"><input id="removeEXIF" type="checkbox" v-model="defaultCompressOptions.removeEXIF"> Remove EXIF</label>
            </div>
            <div class="flex">
              <label for="covertImageType" class="flex items-center">
                <input id="covertImageType" type="checkbox" class="shrink-0" v-model="defaultCompressOptions.convertImageType">
                <span class="shrink-0">Covert to</span>
                <select :disabled="!defaultCompressOptions.convertImageType" class="shrink-0 mb-0 ml-2 text-sm py-1 px-2" v-model="defaultCompressOptions.imageType">
                  <option value="jpeg">jpg</option>
                  <option value="png">png</option>
                  <option value="webp">webp</option>
                </select>
              </label>
            </div>
            <div class="flex">
              <label for="maxWidth" class="flex items-center">
                <span class="shrink-0">Max Width:</span>
                <input type="number" class="text-xs py-1 px-2 ml-1 mb-0" style="margin-bottom: 0; padding: .25rem .25rem; height: auto" v-model="defaultCompressOptions.maxWidth" id="maxWidth" placeholder="Infinity">
              </label>
            </div>
            <div class="flex">
              <label for="maxHeight" class="flex items-center">
                <span class="shrink-0">Max Height:</span>
                <input type="number" class="text-xs py-1 px-2 ml-1 mb-0" style="margin-bottom: 0; padding: .25rem .25rem; height: auto" v-model="defaultCompressOptions.maxHeight" id="maxHeight" placeholder="Infinity">
              </label>
            </div>
            <div class="flex">
              <label for="quality" class="flex items-center">
                <span class="shrink-0">Image Quality:</span>
                <input type="number" class="text-xs py-1 px-2 ml-1 mb-0" style="margin-bottom: 0; padding: .25rem .25rem; height: auto" v-model="defaultCompressOptions.quality" id="quality">
              </label>
            </div>
          </div>
        </div>

        <div class="pt-4 pb-2 text-xs" v-show="fileList.length">
          Files Queued:
        </div>
        <div
          class="item rounded text-sm flex w-full mb-2 relative items-center"
          v-for="(item, index) in fileList"
          :key="item.key"
        >
          <div
            class="w-full bg-neutral-50 text-xs rounded dark:bg-[#333] px-2 py-2 relative shadow"
          >
            <div
              class="progress absolute h-[.1rem] bottom-0 left-0 bg-green-500 transition-all"
              :style="{
                width: progressMap[item.key] + '%'
              }"
              :class="{
                'bg-red-500': statusMap[item.key] === 'error'
              }"
            ></div>
            <div v-show="editKey === item.key" class="flex">
              <form
                action="javascript:"
                @submit="renameThisFile(item)"
                class="flex mb-0 w-full"
              >
                <input
                  class="text-xs w-full"
                  type="text"
                  style="padding: 0.2rem 0.4rem; margin: 0; height: auto"
                  :value="renameFileWithRandomId ? item.id_key : item.key"
                  :id="'input_' + item.key"
                />
                <button
                  class="ml-2 inline-block w-auto shrink-0 outline text-xs text-emerald-500 mb-0"
                  style="padding: 0; border: none; background: transparent"
                  type="submit"
                >Rename
                </button>
                <button
                  type="button"
                  @click="editKey = null"
                  class="inline-block mb-0 w-auto shrink-0 outline ml-2 dark:text-white text-black text-xs"
                  style="padding: 0; border: 0"
                >Cancel
                </button>
              </form>
            </div>
            <span
              :data-tooltip="uploading ? 'Can\'t rename now' : 'Click to rename'"
              v-show="editKey !== item.key"
              class="inline-block break-all"
              @click="showRenameInput(item.key)"
            >{{ renameFileWithRandomId ? item.id_key : item.key }}</span
            ><br/><span
            :style="{
                marginTop: editKey === item.key ? '0' : '0.25rem',
                top: editKey !== item.key ? 0 : '-.2rem'
              }"
            class="opacity-80 text-green-500 mt-1 inline-block relative"
            :class="{
                'text-red-500': statusMap[item.key] === 'error'
              }"
          >{{ parseByteSize(item.size) }}
              <span v-show="uploading && !item.compressing"> / {{ progressMap[item.key] }}%</span><span v-show="item.compressing">Compressing...</span></span>
          </div>
          <div
            v-show="editKey !== item.key"
            class="rounded text0-xs px-2 cursor-pointer hover:text-red-500"
            @click="removeThisFile(index, item.key)"
          >
            <i class="iconfont icon-error"></i>
          </div>
          <div
            title="Re-Upload this file"
            v-show="statusMap[item.key] === 'error'"
            class="rounded text0-xs px-2 cursor-pointer"
            @click="reUploadThisFile(index, item.key)"
          >
            <i class="iconfont icon-reload"></i>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import {reactive, ref, watch, onMounted} from 'vue'
import axios from 'axios'
import {useStatusStore} from '../store/status'
import {nanoid} from 'nanoid'
import Compressor from 'compressorjs'

let statusStore = useStatusStore()

let browserSupportsDirectoryUpload = ref(true)
let fileList = ref([])
let chooseFileBtnText = ref('Choose Files')
let allFileSize = ref(0)
let progressMap = ref({})
let statusMap = ref({})
let abortControllerMap = ref({})
let uploading = ref(false)
let skipFilesWithTheSameName = ref(false)
let uploadIsDone = ref(false)

let realTimeSpeedRecords = ref({})

let editKey = ref('')
let renameFileWithRandomId = ref(false)
let compressImagesBeforeUploading = ref(false)

let clearUploadedFiles = function () {
  uploadedList.value = []
  progressMap.value = {}
  statusMap.value = {}
  abortControllerMap.value = {}
  fileList.value = []
  uploadIsDone.value = false
}

let defaultCompressOptions = reactive({
  quality: 0.9,
  removeEXIF: true,
  convertImageType: true,
  imageType: 'webp',
  maxWidth: '',
  maxHeight: ''
})

watch(defaultCompressOptions, function (val) {
  localStorage.setItem('defaultCompressOptions', JSON.stringify(val))
})

onMounted(() => {
  let defaultCompressOptionsStr = localStorage.getItem('defaultCompressOptions')
  if (defaultCompressOptionsStr) {
    try {
      let config = JSON.parse(defaultCompressOptionsStr)

      defaultCompressOptions.quality = config.quality
      defaultCompressOptions.removeEXIF = config.removeEXIF
      defaultCompressOptions.convertImageType = config.convertImageType
      defaultCompressOptions.imageType = config.imageType
      defaultCompressOptions.maxWidth = config.maxWidth
      defaultCompressOptions.maxHeight = config.maxHeight
    } catch (e) {
      console.log(e)
    }
  }
})

let compressImage = async function (file) {
  const allowedType = 'image/'

  if (file.type.startsWith(allowedType) === false) {
    return file
  }

  return new Promise((resolve, reject) => {

    new Compressor(file, {
      quality: 0.8,
      convertSize: Infinity,
      retainExif: !defaultCompressOptions.removeEXIF,
      mimeType: defaultCompressOptions.convertImageType ? ('image/' + defaultCompressOptions.imageType) : 'auto',
      maxWidth: defaultCompressOptions.maxWidth ? defaultCompressOptions.maxWidth : undefined,
      maxHeight: defaultCompressOptions.maxHeight ? defaultCompressOptions.maxHeight : undefined,
      success(result) {
        // result is a blob, convert it into a file
        let newFile = new File([result], result.name, {
          type: result.type
        })

        let extension = newFile.name.split('.').pop()
        newFile.id_key = file.id_key.split('.').shift() + '.' + extension
        newFile.key = file.key.split('.').shift() + '.' + extension

        console.log(newFile)
        console.log(`compressed ${file.name} from ${parseByteSize(file.size)} to ${parseByteSize(newFile.size)}`)
        resolve(newFile)
      },
      error(err) {
        reject(err)
      }
    })
  })
}

let calcSkipFiles = function () {
  return fileList.value.filter((item) => item.shouldBeSkipped).length
}

let calcUploadSpeed = function (bytes, time_ms) {
  return parseByteSize((bytes / time_ms) * 1000) + '/s'
}

let parseByteSize = function (size) {
  let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let index = 0
  while (size > 1000) {
    size /= 1000
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

try {
  showDirectoryPicker
  console.log('browser supports directory upload')
} catch (e) {
  browserSupportsDirectoryUpload.value = false
}

watch(skipFilesWithTheSameName, (val) => {
  if (val) {
    updateFileSkipProperty()
  } else {
    fileList.value.forEach((file) => {
      file.shouldBeSkipped = false
    })
  }
})

watch(renameFileWithRandomId, () => {
  updateFileSkipProperty()
})

let updateFileSkipProperty = function () {
  let uploadedFiles = statusStore.uploadedFiles

  fileList.value.forEach((file) => {
    let diff_key = renameFileWithRandomId.value ? 'id_key' : 'key'
    let match = uploadedFiles.findIndex(
      (el) => el[diff_key] === formatFileName(file[diff_key])
    )
    file.shouldBeSkipped = match !== -1
  })
}

let reUploadThisFile = function (index, key) {
  let file = fileList.value.find((el) => key === el.key)
  uploadFile(file)
}

let renameThisFile = function (file) {
  let input = document.getElementById('input_' + file.key)

  if (renameFileWithRandomId.value) {
    if (input.value === file.id_key) {
      editKey.value = ''
      return false
    }

    let match = fileList.value.findIndex((el) => el.id_key === input.value)

    if (match !== -1) {
      alert('File with the same name already exists.')
      return false
    }

    file.id_key = input.value
    editKey.value = ''
  } else {
    if (input.value === file.key) {
      editKey.value = ''
      return false
    }

    let match = fileList.value.findIndex((el) => el.key === input.value)

    if (match !== -1) {
      alert('File with the same name already exists.')
      return false
    }

    file.key = input.value
    editKey.value = ''
  }
}

let showRenameInput = function (key) {
  if (uploading.value) {
    return false
  }
  editKey.value = key
}

let handleFolder = async function () {
  uploadedList.value = []
  const files = []
  const dirHandle = await showDirectoryPicker()
  const dirName = dirHandle.name
  await handleDirectoryEntry_v2(dirHandle, '', files)

  files.forEach((file) => {
    file.key = dirName + file.key

    // get extension
    let extension = file.name.split('.').pop()

    // get sub-folder str
    let subFolderArr = file.key.split('/')
    subFolderArr.pop()

    let subFolderStr = subFolderArr.join('/')

    file.id_key = subFolderStr + '/' + nanoid(16) + '.' + extension

    fileList.value.push(file)
  })
}

async function handleDirectoryEntry_v2(dirHandle, basePath, files) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      let file = await entry.getFile()
      let separator = '/'

      file['key'] = basePath + separator + entry.name
      files.push(file)
    }

    if (entry.kind === 'directory') {
      await handleDirectoryEntry_v2(entry, basePath + '/' + entry.name, files)
    }
  }
}

let formatFileName = function (name) {
  // replace all the spaces with '_'
  return name.replace(/\s/g, '_')
}

let handleFilesChange = function (e) {
  uploadedList.value = []
  progressMap.value = {}
  statusMap.value = {}
  abortControllerMap.value = {}

  Array.from(e.target.files).forEach((file) => {
    file.key = file.name

    // get extension
    let extension = file.name.split('.').pop()
    file.id_key = nanoid(16) + '.' + extension
  })

  fileList.value = [...fileList.value, ...Array.from(e.target.files)]

  // remove duplicate files

  let fileNames = fileList.value.map((item) => item.key)
  fileList.value = fileList.value.filter((item, index) => {
    return fileNames.indexOf(item.key) === index
  })
}

let calcAllFileSize = function () {
  allFileSize.value = fileList.value.reduce((prev, curr) => {
    return prev + curr.size
  }, 0)
}

let doneUploadingCleanUp = function () {
  if (fileList.value.length === 0) {
    uploadIsDone.value = true
    uploading.value = false
    statusStore.uploading = false
    skipFilesWithTheSameName.value = false

    document.getElementById('fileInput').value = ''
  }
}

let removeThisFile = function (index, name) {
  if (uploading.value) {
    let c = confirm(`Uploading is in progress, are you sure to remove ${name}?`)

    if (!c) {
      return false
    }

    abortControllerMap.value[name].abort()
    fileList.value.splice(index, 1)

    doneUploadingCleanUp()

    return false
  }

  let c = confirm(`Are you sure to remove ${name}?`)

  if (!c) {
    return false
  }

  fileList.value.splice(index, 1)
}

const uploadedList = ref([])
const upload = function () {
  uploading.value = true
  statusStore.uploading = true
  realTimeSpeedRecords.value = {}
  uploadIsDone.value = false

  fileList.value.forEach(async (file, index) => {
    if (file.shouldBeSkipped) {
      statusMap.value[file.key] = 'done'
      fileList.value = fileList.value.filter((item) => item.key !== file.key)

      doneUploadingCleanUp()

      return false
    }

    if (compressImagesBeforeUploading.value) {
      file['compressing'] = true
      fileList.value[index] = await compressImage(file)
      file['compressing'] = false

      uploadFile(fileList.value[index])
      return false
    }

    uploadFile(file)
  })
}

function handlePaste() {
  window.addEventListener('paste', (e) => {
    let files = e.clipboardData.files
    renameFileWithRandomId.value = true
    compressImagesBeforeUploading.value = true
    Array.from(files).forEach((file) => {
      file.key = file.name
      // get extension
      let extension = file.name.split('.').pop()
      file.id_key = nanoid(16) + '.' + extension
    })

    fileList.value = [...fileList.value, ...Array.from(files)]
  })
}

function uploadFile(file) {
  let endPoint = localStorage.getItem('endPoint')
  let apiKey = localStorage.getItem('apiKey')

  if (!endPoint || !apiKey) {
    alert('Please set an endpoint and api key first.')
    return
  }

  if (file['compressing'] !== undefined) {
    file.compressing = false
  }
  progressMap.value[file.key] = 0
  abortControllerMap.value[file.key] = new AbortController()
  statusMap.value[file.key] = 'uploading'

  let file_key = renameFileWithRandomId.value ? file.id_key : file.key

  let fileName = '/' + formatFileName(file_key)
  if (endPoint[endPoint.length - 1] === '/') {
    fileName = formatFileName(file_key)
  }
  file.startUploadingTime = new Date().getTime()

  realTimeSpeedRecords.value[file.key] = [
    {
      time: new Date().getTime(),
      loaded: 0
    }
  ]

  axios({
    method: 'put',
    url: endPoint + fileName,
    headers: {
      'x-api-key': apiKey,
      'content-type': file.type
    },
    signal: abortControllerMap.value[file.key].signal,
    data: file,
    onUploadProgress(event) {
      const percentage = Math.round((100 * event.loaded) / event.total)
      progressMap.value[file.key] = percentage

      realTimeSpeedRecords.value[file.key].push({
        time: new Date().getTime(),
        loaded: event.loaded
      })
    }
  })
    .then((res) => {
      statusMap.value[file.key] = 'done'
      if (res.status === 200) {
        file.endUploadingTime = new Date().getTime()
        file.uploadUsedTime = file.endUploadingTime - file.startUploadingTime
        file.uploadSpeed = calcUploadSpeed(file.size, file.uploadUsedTime)
        uploadedList.value.push(file)
        fileList.value = fileList.value.filter((item) => item.key !== file.key)
      }
    })
    .catch((e) => {
      console.log(e)
      statusMap.value[file.key] = 'error'
    })
    .finally(() => {
      doneUploadingCleanUp()
    })
}

let globalSpeed = ref('0B /s')
setInterval(function () {
  let keys = Object.keys(realTimeSpeedRecords.value)

  let speedMap = {}

  keys.forEach((key) => {
    let records = realTimeSpeedRecords.value[key]
    let last2Records = records.slice(-2)
    let lastRecord = last2Records[last2Records.length - 1]
    let firstRecord = last2Records[0]

    if (!lastRecord) {
      return false
    }

    let timeDiff = lastRecord.time - firstRecord.time
    let loadedDiff = lastRecord.loaded - firstRecord.loaded

    if (timeDiff === 0) {
      return false
    }

    speedMap[key] = (loadedDiff / timeDiff) * 1000 // bytes / s
  })

  let totalSpeed = 0
  let speedMapKeys = Object.keys(speedMap)

  speedMapKeys.forEach((key) => {
    totalSpeed += speedMap[key]
  })

  globalSpeed.value = parseByteSize(totalSpeed) + '/s'
}, 500)

watch(
  fileList,
  (newVal) => {
    if (newVal.length) {
      chooseFileBtnText.value = 'Add More Files'
    } else {
      chooseFileBtnText.value = 'Choose Files'
    }

    calcAllFileSize()
  },
  {
    deep: true
  }
)

handlePaste()
</script>
