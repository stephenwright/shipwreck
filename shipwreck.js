
export default class Shipwreck {

  async queryApi(href) {
    console.info('querying', href);
    try {
      const response = await fetch(href);
      const json = await response.json()
      console.info('response', json);
    }
    catch(err) {
      console.error('something went wrong', err);
    }
  }

}
