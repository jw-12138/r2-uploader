// check for GitHub user
// running on vercel edge

export const config = {
  runtime: 'edge'
}

export default async function (req, res) {
  let endpoint = 'https://api.github.com/user'
  let token = req.headers.get('Authorization')

  if (!token) {
    return new Response('no token', {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'no_token'
      })
    })
  }

  let user = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': token,
    }
  })

  if (user.status !== 200) {
    return new Response(user.statusText, {
      status: user.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'github_error',
        detail: user.statusText
      })
    })
  }

  let user_json = await user.json()

  return new Response(JSON.stringify(user_json), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}