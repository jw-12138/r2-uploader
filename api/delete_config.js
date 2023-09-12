// pull config for users
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
  let allowedMethods = ['DELETE', 'OPTIONS']
  if(!allowedMethods.includes(req.method)){
    return res.status(405).json({
      message: 'method_not_allowed'
    })
  }

  let token = req.headers['authorization']

  if (!token) {
    return res.status(400).json({
      message: 'no_token'
    })
  }

  let user = await fetch('https://r2.jw1.dev/api/check_github_user', {
    method: 'GET',
    headers: {
      Authorization: token
    }
  })

  if (user.status !== 200) {
    return res.status(user.status).json({
      message: 'github_error',
      detail: user.statusText
    })
  }

  let user_json = await user.json()

  let result = await collection.deleteOne({
    user: user_json.login
  })

  return res.status(204).json({
    message: 'success'
  })
}