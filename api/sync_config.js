// sync config for users
// running on vercel serverless function

import {MongoClient} from 'mongodb'

const url = process.env.MONGO_URL
const client = new MongoClient(url)

console.log('Connecting to MongoDB...')
await client.connect()
console.log('Connected to MongoDB')

const db = client.db('r2-sync')
const collection = db.collection('configs')

export default async function (req, res) {
  let token = req.headers['authorization']
  let {config} = req.body

  if (!token) {
    return res.status(400).json({
      message: 'no_token'
    })
  }

  if (!config) {
    console.log(config)
    return res.status(400).json({
      message: 'no_config'
    })
  }

  let user = await fetch('https://r2.jw1.dev/api/check_github_user', {
    method: 'GET',
    headers: {
      'Authorization': token
    }
  })

  if (user.status !== 200) {
    return res.status(user.status).json({
      message: 'github_error',
      detail: user.statusText
    })
  }

  let user_json = await user.json()

  let result = await collection.updateOne({
    user: user_json.login
  }, {
    $set: {
      config_text: config,
      updated_at: new Date()
    }
  })

  if (result.modifiedCount === 0) {
    await collection.insertOne({
      user: user_json.login,
      config_text: config,
      updated_at: new Date(),
      created_at: new Date()
    })
  }

  return res.json({
    message: 'success',
    status: 200
  })
}