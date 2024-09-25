class _Response {
  constructor() {}

  json(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })
  }

  text(data, status = 200, headers = {}) {
    return new Response(data, {
      status,
      headers: {
        'Content-Type': 'text/plain',
        ...headers
      }
    })
  }

  html(data, status = 200, headers = {}) {
    return new Response(data, {
      status,
      headers: {
        'Content-Type': 'text/html',
        ...headers
      }
    })
  }
}

export const _res = new _Response()
