// delete config for users
export const config = {
  runtime: 'edge'
}

import D1 from '../utils/d1.class.js'
import {_res} from '../utils/response.js'

const d1 = new D1({
  key: process.env.D1_KEY
})

export default async function (req, res) {
  let allowedMethods = ['DELETE', 'OPTIONS']
  if (!allowedMethods.includes(req.method)) {
    return _res.json(
      {
        message: 'method_not_allowed'
      },
      405
    )
  }

  let token = req.headers.get('Authorization')

  if (!token) {
    return _res.json(
      {
        message: 'no_token'
      },
      400
    )
  }

  console.log('got token')

  console.log('getting user...')

  let user = await fetch('https://r2.jw1.dev/api/check_github_user', {
    method: 'GET',
    headers: {
      Authorization: token
    }
  })

  if (user.status !== 200) {
    return _res.json(
      {
        message: 'github_error',
        detail: user.statusText
      },
      user.status
    )
  }

  let user_json = await user.json()
  console.log('got user')

  let delete_res = await d1.query('delete from configs where username = ?', [user_json.login])

  console.log(delete_res)

  if (!delete_res.success) {
    return _res.json(
      {
        message: 'd1_error',
        detail: delete_res.error
      },
      500
    )
  }

  return new Response('', {
    status: 200
  })
}
