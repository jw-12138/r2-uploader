// pull config for users
export const config = {
  runtime: 'edge',
}

import D1 from '../utils/d1.class.js'
import { _res } from '../utils/response.js'

const d1 = new D1({
  key: process.env.D1_KEY
})

export default async function (req, res) {
  let token = req.headers.get('Authorization')

  if (!token) {
    return _res.json({
      message: 'no_token'
    }, 400)
  }

  let user = await fetch('https://r2.jw1.dev/api/check_github_user', {
    method: 'GET',
    headers: {
      Authorization: token
    }
  })

  if (user.status !== 200) {
    return _res.json({
      message: 'github_error',
      detail: user.statusText
    }, user.status)
  }

  let user_json = await user.json()

  let {error, results} = await d1.query('select * from configs where username = ?', [user_json.login])

  if (error) {
    return _res.json({
      error
    }, 500)
  }

  return _res.json({
    config: results[0].config_text
  })
}