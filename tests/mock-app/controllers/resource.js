/**
 * BandController is a controller for the Band resource.
 *
 * @module controllers/resources
 * @version 0.0.1
 */
const { imports } = Glad;
const Resource = imports('resourceModel');

class ResourceController extends Glad.Controller {

  Get () {
    this.cache({ max: 3, strategy: 'LFU' }, cache => {
      Resource.find().limit(15).exec().then(resources => {
        this.res.json(resources) && cache(resources);
      }).catch(err => this.error(err))
    });
  }

  FindOne () {
    this.cache({ max: 100, strategy: 'LFU' }, cache => {
      Resource.findOne({ id: this.params.id}).exec().then(resource => {
        this.res.json(resource).cache(resource);
      }).catch(err => this.error(err));
    });
  }

  Post () {
    Resource.create(this.body)
      .then(resource => this.res.status(201).json(resource))
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
