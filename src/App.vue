<template>
  <div class="max-w-[30rem] mx-auto flex justify-between items-center">
    <h1 class="mb-0">
      <img src="https://emojicdn.elk.sh/🗄️" alt="logo" class="h-[1.5rem]"> {{ t('app.title') }}
    </h1>
    <LanguageSwitcher />
  </div>

  <div class="max-w-[30rem] mx-auto">
    <div>
      <EndPointManage></EndPointManage>
    </div>

    <div>
      <CustomUploader></CustomUploader>
    </div>
    <div class="mt-8">
      <FileList></FileList>
    </div>
  </div>

  <footer class="text-center text-xs py-[2rem] opacity-80">
    <span>{{ t('app.madeBy') }} <a href="https://github.com/jw-12138">jw-12138</a> {{ t('app.with') }}
      <br>
      <a href="/setup-guide/">{{ t('app.setupGuide') }}</a> | 
      <a href="https://github.com/jw-12138/r2-uploader">{{ t('app.openSource') }}</a></span>
  </footer>
</template>

<script setup>
import CustomUploader from './components/CustomUploader.vue'
import FileList from './components/FileList.vue'
import EndPointManage from './components/EndPointManage.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import { useI18n } from './i18n'

const { t } = useI18n()
</script>