// sync config for users
export const config = {
  runtime: 'edge'
}

import D1 from '../utils/d1.class.js'
import { _res } from '../utils/response.js'

const d1 = new D1({
  key: process.env.D1_KEY
})

export default async function (req) {
  let token = req.headers.get('Authorization')
  let { config } = await req.json()

  if (!token) {
    return _res.json({
      message: 'no_token'
    }, 400)
  }

  if (!config) {
    console.log(config)
    return _res.json({
      message: 'no_config'
    }, 400)
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

  // Use upsert operation to either insert a new record or update an existing one
  let { error } = await d1.query(
    'INSERT INTO configs (username, config_text, updated_at, created_at) VALUES (?, ?, ?, ?) ' +
    'ON CONFLICT(username) DO UPDATE SET config_text = ?, updated_at = ?',
    [
      user_json.login,
      config,
      Date.now(),
      Date.now(),
      config,
      Date.now()
    ]
  )

  if (error) {
    return _res.json({
      message: 'd1_error',
      detail: error
    }, 500)
  }

  return _res.json({
    message: 'success'
  })
}
