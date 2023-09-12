export const animateText = function (refVariable, targetText, options) {
  let {interval = 20, skipText = ''} = options || {}
  refVariable.value = '' + skipText

  let length = targetText.length

  let s = setInterval(function () {
    if (refVariable.value.length === length) {
      clearInterval(s)
      return false
    }

    refVariable.value += targetText[refVariable.value.length]
  }, interval)
}