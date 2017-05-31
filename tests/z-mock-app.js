const path = require('path');
const http = require('http');
const assert = require('assert');
const unirest = require('unirest');
const io = require('socket.io-client');
let redis    = require("redis");
let client = redis.createClient();

describe("Running a mock app with Glad features", function () {

  before(function(done) {
    process.chdir('tests/mock-app');
    require(path.join(process.cwd(), 'index'));
    done();
  });

  beforeEach(done => {
    client.flushall(() => { done(); });
  });

  after(function (done) {
    unirest('delete','http://localhost:4242/resources/all').end(x => {
      process.chdir('../../');
      client.flushall(done);
    });
  });

  it ('should return a 404 for an unhandled route', done => {
    http.get('http://localhost:4242', res => {
      assert.equal(res.statusCode, 404);
      done();
    });
  });

  it ('should return 200 status code and an empty array of resources when none are created', done => {
    unirest.get('http://localhost:4242/resources')
      .end(res => {
        assert.equal(res.statusCode, 200);
        assert.deepEqual(res.body, []);
        done();
      });
  });

  it ('should create a resource and return the resource in the response', done => {
    unirest.post('http://localhost:4242/resources')
      .type('json')
      .send({
        name  : "Tester 007",
        email : "tester007@mail.com",
        phone : "(555) 555-1212"
      })
      .end(res => {
        let { body } = res;
        assert.equal(res.statusCode, 201);
        assert.ok(body._id);
        assert.equal(body.name, "Tester 007");
        done();
      });
  });

  it ('should create another resource and return the resource in the response', done => {
    unirest.post('http://localhost:4242/resources')
      .type('json')
      .send({
        name  : "Tester 008",
        email : "tester008@mail.com",
        phone : "(555) 500-1212"
      })
      .end(res => {
        let { body } = res;
        assert.equal(res.statusCode, 201);
        assert.ok(body._id);
        assert.equal(body.name, "Tester 008");
        done();
      });
  });

  it ('should have 2 resources in the database', done => {
    unirest.get('http://localhost:4242/resources').end(res => {
      let { body } = res;
      assert.equal(res.statusCode, 200);
      assert.ok(body.length);
      assert.equal(body[0].name, "Tester 007");
      assert.equal(body[1].name, "Tester 008");
      done();
    });
  });

  it ('should cache the findOne using hit/miss syntax', done => {
    unirest.get('http://localhost:4242/resources').end(res => {
      let { body } = res;
      let person = body[0];
      let url = `http://localhost:4242/resources/${person._id}`;

      assert.equal(res.statusCode, 200);

      unirest.get(url).end(res => {
        assert.equal(res.statusCode, 200);
        assert.equal(person.name, "Tester 007");
        unirest.get(url).end(res => {
          assert.equal(res.statusCode, 200);
          assert.equal(person.name, "Tester 007");
          assert.equal(res.headers['x-glad-cache-hit'], 'true');
          done();
        });
      });

    });
  });

  it ('should return a 403 Forbidden on a route where the policy is denied', function (done) {
    unirest.get('http://localhost:4242/resources/private')
      .end(res => {
        let { body } = res;
        assert.equal(res.statusCode, 403);
        done();
      });
  });

  it ('should return a 200 on a route where the policy is accepted', function (done) {
    unirest.get('http://localhost:4242/resources/not-private')
      .end(res => {
        let { body } = res;
        assert.equal(res.statusCode, 200);
        done();
      });
  });

  it ('should set the cached headers', function (done) {
    unirest.get('http://localhost:4242/resources').end(res1 => {
      assert.equal(res1.statusCode, 200);
      unirest.get('http://localhost:4242/resources').end(res2 => {
        unirest.get('http://localhost:4242/resources').end(res => {
          let { body } = res;
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['x-glad-cache-hit'], 'true')
          done();
        });
      });
    });
  });

  it ('ActionCache should clear after POSTing and build back up', function (done) {
    unirest.get('http://localhost:4242/resources').end(res1 => {
      assert.equal(res1.statusCode, 200);
      unirest.get('http://localhost:4242/resources').end(res2 => {
        unirest.get('http://localhost:4242/resources').end(res => {
          let { body } = res;
          assert.equal(res.statusCode, 200);
          assert.equal(res.headers['x-glad-cache-hit'], 'true')

          unirest.post('http://localhost:4242/resources')
            .type('json')
            .send({
              name  : "Tester 009",
              email : "tester009@mail.com",
              phone : "(555) 500-1212"
            })
            .end(res => {
              let { body } = res;
              assert.equal(res.statusCode, 201);
              assert.ok(body._id);
              assert.equal(body.name, "Tester 009");
              unirest.get('http://localhost:4242/resources').end(res => {
                let { body } = res;
                assert.equal(res.statusCode, 200);
                assert.equal(res.headers['x-glad-cache-hit'], undefined);
                unirest.get('http://localhost:4242/resources').end(res => {
                  assert.equal(res.statusCode, 200);
                  assert.equal(res.headers['x-glad-cache-hit'], 'true');
                  done();
                });
              });
            });

        });
      });
    });
  });

  it ('Should render a page using this.render', function (done) {
    unirest.get('http://localhost:4242/resources/my-page').end(res1 => {
      assert.equal(res1.statusCode, 200);
      assert.equal(res1.body, '<h1>Charlie</h1><p>testing</p>');
      done();
    });
  });

  it ('Should render a page using this.render and cache the page', function (done) {
    unirest.get('http://localhost:4242/resources/my-page').end(res1 => {
      assert.equal(res1.statusCode, 200);
      assert.equal(res1.body, '<h1>Charlie</h1><p>testing</p>');
      unirest.get('http://localhost:4242/resources/my-page').end(res2 => {
        assert.equal(res2.statusCode, 200);
        assert.equal(res2.body, '<h1>Charlie</h1><p>testing</p>');
        assert.equal(res2.headers['x-glad-cache-hit'], 'true');
        done();
      });
    });
  });

  it('should communicate over ws', done => {
    let socket = io.connect('http://localhost:4242', {forceNew: true});
    socket.on('connect', function () {
      socket.emit('chat');
      socket.emit('room1');
      socket.emit('policyError');
      if (socket.connected) socket.disconnect();
      done();
    });
  });

});
