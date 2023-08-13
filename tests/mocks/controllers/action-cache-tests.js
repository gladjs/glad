import Controller from '../../../classes/controller.js';

export default class ActionCacheTestController extends Controller {
  async NSandUUID () {
    let doc = { name: "doc1", uuid: 123};
    let doc2 = { name: "doc1", uuid: 321};
    await this.cache({ max: 100, strategy: "LRU", namespace: "v1", uuid: doc.uuid }, async () => {
      return doc
    })

    await this.cache({ max: 100, strategy: "LRU", namespace: "v1", uuid: doc2.uuid }, async () => {
      return doc2
    })
  }

  async JustNS () {
    let doc = { name: "doc1", uuid: 123};
    await this.cache({ max: 100, strategy: "LRU", namespace: "v1"}, async () => {
      return doc
    })
  } 

  async JustUUID() {
    let doc = { name: "doc1", uuid: 123};
    await this.cache({ max: 100, strategy: "LRU", uuid: doc.uuid }, async () => {
      return doc
    })
  } 

  async populateNamespace() {
    await this.cache({ max: 100, strategy: "LRU", namespace: this.req.body.namespace}, async () => this.req.body);
  }
  
  async populateNamespaceAndUUID() {
    await this.cache({ max: 100, strategy: "LRU", uuid: this.req.uuid, namespace: this.req.body.namespace}, async () => this.req.body);
  }
}