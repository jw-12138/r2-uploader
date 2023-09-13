// bun file: gen_markdown.js
// generate html from markdown, the html should be placed in the same directory as the markdown file

import {marked} from 'marked'
import fs from 'fs'

let baseDir = './public/setup-guide/'
let files = fs.readdirSync(baseDir)
let generate_list = files.filter(el => {
  return el.endsWith('.md')
})

const html_template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>R2 Uploader</title>
  <link rel="shortcut icon" href="https://emojicdn.elk.sh/🗄️" type="image/x-icon">
  <link rel="stylesheet" href="https://worker-shrill-water-2ae4.jw1dev.workers.dev/main.css">
  <link rel="stylesheet" href="https://worker-shrill-water-2ae4.jw1dev.workers.dev/pico.min.css">
  <link rel="stylesheet" href="https://worker-shrill-water-2ae4.jw1dev.workers.dev/custom.css">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Koulen&display=swap" rel="stylesheet">
  <meta name="description" content="Web Interface for Cloudflare R2">
  <style>
    #app {
      max-width: 40rem;
      margin: 0 auto;
      padding: 1rem 1.5rem;
    }
    
    h3 {
      margin-bottom: 1rem;
    }
    
    #app a {
      text-decoration: underline;
    }
    
    #app h1 a {
      text-decoration: none;
    }
    
    hr{
      margin: 4rem 2rem;
    }
  </style>
</head>
<body>
<div id="app">
<h1>
  <a href="/"><img src="https://emojicdn.elk.sh/🗄️" alt="logo" style="height: 1.5rem"> R2 Uploader</a>
</h1>
###HTML###

<footer style="text-align: center; font-size: .6rem; padding: 2rem 0">
  Made by <a href="https://github.com/jw-12138">jw-12138</a> with ❤️
</footer>
</div>
</body>
</html>
`

console.log();
for (const path of generate_list) {
  let start = Date.now()
  let file = Bun.file(baseDir + path)
  let md = await file.text()
  let html = marked.parse(md)

  let html_path = baseDir + path.replace('.md', '.html')
  await Bun.write(html_path, html_template.replace('###HTML###', html))

  let end = Date.now()

  console.log(`Generated ${html_path} in ${end - start}ms`)
}
console.log();



