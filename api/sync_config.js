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

  try {
    // First check if the user exists
    const userExists = await d1.query(
      'SELECT username FROM configs WHERE username = ?',
      [user_json.login]
    )
    
    let res;
    if (userExists.results && userExists.results.length > 0) {
      // Update existing user
      res = await d1.query(
        'UPDATE configs SET config_text = ?, updated_at = ? WHERE username = ?',
        [config, Date.now(), user_json.login]
      )
    } else {
      // Insert new user
      res = await d1.query(
        'INSERT INTO configs (username, config_text, updated_at, created_at) VALUES (?, ?, ?, ?)',
        [user_json.login, config, Date.now(), Date.now()]
      )
    }

    if(res.message && res.message.startsWith('D1_ERROR:')){
      throw new Error(res.message)
    }

    console.log('d1 res:', res)
    return _res.json(res)
  } catch (error) {
    console.log('error', error)
    return _res.json({
      message: 'd1_error',
      detail: error.message
    }, 500)
  }  
}
