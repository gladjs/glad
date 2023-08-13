import { deepEqual } from "assert";
import Controller from "../classes/controller.js";
import { createClient } from "redis";
let client = createClient();

describe("Controller", function () {
  before(async () => {
    await client.connect()
  })
  after(async () => {
    await client.disconnect()
  })
  function body() {
    return {
      foo: true,
      bar: 1,
      fox: "trot",
      stuff: [1, 2, 3],
      user: {
        name: "Frank Larry",
        admin: true,
        friend: {
          user: {
            name: "Steve Jims",
          },
        },
      },
    };
  }

  let res = {
    status() {
      return {
        json() {
          return "json";
        },
      };
    },
    json() {
      return "json";
    },
    send() {
      return "send";
    },
  };

  it("permit only allows subdocuments when the path is explicit", function () {
    let myController = new Controller(
      {
        controller: "myController",
        action: "Get",
        url: "/widgets",
        body: body(),
      },
      res,
      client
    );
    myController.permit("user.name");
    deepEqual(myController.body, { user: { name: "Frank Larry" } });
  });

  it("permit only allows whitelisted keys", function () {
    let myController = new Controller(
      {
        controller: "myController",
        action: "Get",
        url: "/widgets",
        body: body(),
      },
      res,
      client
    );
    myController.permit("user.friend.user.name", "bar");
    deepEqual(myController.req.body, {
      user: { friend: { user: { name: "Steve Jims" } } },
      bar: 1,
    });
  });

  it("permit does not permit a sub document when the path is not explicit", function () {
    let myController = new Controller(
      {
        controller: "myController",
        action: "Get",
        url: "/widgets",
        body: body(),
      },
      res,
      client
    );
    let aBody = body();
    delete aBody.user;
    myController.permit("foo", "bar", "fox", "stuff", "user");
    deepEqual(myController.req.body, aBody);
  });

  it("deepPermit permits a sub document when the path is not explicit", function () {
    let myController = new Controller(
      {
        controller: "myController",
        action: "Get",
        url: "/widgets",
        body: body(),
      },
      res,
      client
    );
    myController.deepPermit("foo", "bar", "fox", "stuff", "user");
    deepEqual(myController.req.body, body());
  });
});
