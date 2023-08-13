/**
 * BandController is a controller for the Band resource.
 *
 * @module controllers/resources
 * @version 0.0.1
 */
import Resource from "../models/resource.js";

class ResourceController extends Glad.Controller {
  async Get() {
    const data = await this.cache({ max: 3, strategy: "LFU" }, async () => {
      try {
        const data = await Resource.find().limit(15).exec();
        return data;
      } catch (err) {
        console.error(err);
      }
    });
    this.res.json(data);
  }

  async FindOne() {
    const data = await this.cache(
      { max: 3, strategy: "LFU", uuid: this.params.id },
      async () => {
        try {
          const data = await Resource.findOne({ _id: this.params.id })
            .limit(15)
            .exec();
          return data;
        } catch (err) {
          throw err;
        }
      }
    );
    this.res.json(data);
  }

  async myHtmlPage() {
    let html = await this.cache(
      { max: 300, strategy: "LFU", type: "html" },
      async () => await this.#compileMyHtmlPage()
    );

    this.res.send(html);
  }

  #compileMyHtmlPage() {
    return new Promise((resolve, reject) => {
      this.render(
        "my-page",
        { name: "Charlie", up_to: "testing" },
        (err, data) => {
          if (err) return reject(err);

          resolve(data);
        }
      );
    });
  }

  blastChecker() {
    // simulate a long running database lookup.
    setTimeout(() => this.res.json({}), 220);
  }

  hasIO() {
    this.res.json({
      io: !!this.socketIO,
      in: !!this.socketIO.in,
      emit: !!this.socketIO.emit,
    });
  }

  async Post() {
    let resource = await Resource.create(this.body);

    await this.actionCache({action: "Get"}).reset()
    this.res.status(201).json(resource);
  }

  Put() {
    Resource.update(this.params.id, this.body)
      .then((resources) => this.res.json(resources))
      .catch((err) => this.error(err));
  }

  destroy() {
    Resource.deleteOne(this.params.id)
      .then((removals) => this.res.status(204).send())
      .catch((err) => this.error(err));
  }

  destroyAll() {
    Resource.deleteMany({}).then((removals) => this.res.status(204).send());
  }
}

export default ResourceController;
