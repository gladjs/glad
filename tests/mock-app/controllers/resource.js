/**
 * BandController is a controller for the Band resource.
 *
 * @module controllers/resources
 * @version 0.0.1
 */
const { imports } = Glad;
const Resource = require('../models/resource');

class ResourceController extends Glad.Controller {

  Get () {
    this.cache({ max: 3, strategy: 'LFU' }, cache => {
      Resource.find().limit(15).exec().then(resources => {
        this.res.json(resources) && cache(resources);
      }).catch(err => this.error(err))
    });
  }

  FindOne () {
    this.cache({ max: 3, strategy: 'LFU' }).miss(cache => {
      Resource.findOne({ _id: this.params.id}).exec().then(resource => {
        cache(resource);
        setTimeout(() => this.res.json(resource), 100);
      }).catch(err => this.error(err));
    }).hit(data => {
      setTimeout(() => this.res.json(data), 100)
    }).exec()
  }

  myHtmlPage () {
    // this.cache({ max: 300, strategy: 'LFU', type: 'html' }, cache => {
      this.render('my-page', { name : 'Charlie', up_to: 'testing' });
    // });
  }

  blastChecker () {
    // simulate a long running database lookup.
    setTimeout(() => this.res.json({}), 220);
  }

  Post () {
    Resource.create(this.body)
      .then(resource => {
        this.actionCache('Get').reset().then(() => {
          this.res.status(201).json(resource);
        });
      })
      .catch(err => this.error(err));
  }

  Put () {
    Resource.update(this.params.id, this.body)
      .then(resources => this.res.json(resource))
      .catch(err => this.error(err));
  }

  destroy () {
    Resource.remove(this.params.id)
      .then(removals => this.res.status(204).send())
      .catch(err => this.error(err));
  }

  destroyAll () {
    Resource.remove({}).then(removals => this.res.status(204).send());
  }

}

module.exports = ResourceController;
