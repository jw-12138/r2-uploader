<template>
  <div class="language-switcher">
    <select 
      v-model="currentLang" 
      @change="handleChange"
      class="text-xs px-2 py-1 rounded border-0 bg-neutral-100 dark:bg-neutral-800 cursor-pointer"
    >
      <option v-for="(name, code) in LANGUAGES" :key="code" :value="code">
        {{ name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { useI18n } from '../i18n'

const { currentLang, setLanguage, LANGUAGES } = useI18n()

function handleChange(event) {
  setLanguage(event.target.value)
  // Reload to apply all translations
  window.location.reload()
}
</script>

<style scoped>
.language-switcher select {
  outline: none;
}
</style>

