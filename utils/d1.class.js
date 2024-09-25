export default class D1 {
  constructor(opts) {
    this.key = opts.key
  }

  /**
   * 
   * @param {string} query 
   * @param {[ArrayBuffer | string | null | number] | undefined} bind 
   * @returns 
   */
  async query(query, bind = undefined) {
    try {
      let _body = {
        query
      }

      if(bind){
        _body.bind = bind
      }
      const res = await fetch('https://d1-workers.jw1dev.workers.dev/r2_jw1dev', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.key
        },
        body: JSON.stringify(_body)
      })

      const json = await res.json()
      return json
    } catch (e) {
      console.log(e)
      
      return {
        error: e.message
      }
    }
  }
}
