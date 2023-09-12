// GitHub oauth callback handler
// running on vercel edge

export const config = {
  runtime: 'edge',
}

export default async function (req, res) {
  let requestUrl = new URL(req.url)
  let query = requestUrl.searchParams

  let code = query.get('code')
  let redirect = query.get('r')
  // decode redirect url
  redirect = redirect ? decodeURIComponent(redirect) : null

  let error = query.get('error')
  let error_description = query.get('error_description')

  error_description = error_description ? error_description.replace(/\+/g, ' ') : ''

  if (error) {
    return new Response(error + '\n' + error_description, {
      status: 400
    })
  }

  if (!code) {
    return new Response('no code', {
      status: 400
    })
  }

  if (!redirect) {
    redirect = 'https://r2.jw1.dev'
  }

  let auth_token

	try {
		auth_token = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			},
			body: JSON.stringify({
				client_id: process.env.GITHUB_CLIENT_ID,
				client_secret: process.env.GITHUB_CLIENT_SECRET,
				code: code
			})
		})
	} catch (e) {
		console.log(e)
	}

  let params = await auth_token.json()

	if(auth_token.status !== 200){
		return new Response(auth_token.statusText, {
      status: auth_token.status,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'github_error',
        detail: auth_token.statusText
      })
    })
	}

	if(params.error){
		return new Response(params.error_description, {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'github_error',
        detail: params.error_description
      })
    })
	}

  return new Response('', {
    status: 307,
    headers: {
      'Location': `${redirect}?access_token=${params.access_token}&scope=${params.scope}&token_type=${params.token_type}`
    }
  })
}

