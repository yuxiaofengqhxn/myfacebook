const express = require('express')
const path = require('path')
const app = express()
const PORT = 3003

app.use(express.static(path.join(__dirname, 'public')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const HOST = '0.0.0.0'

app.listen(PORT, HOST, () => {
  console.log(`✅ 简历网站已启动: http://localhost:${PORT}`)
})
