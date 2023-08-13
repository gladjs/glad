import { join } from "path";
import { equal, deepEqual, ok } from "assert";
import { http } from "./helpers.js";
import { createClient } from "redis";
import mongoose from "mongoose";

let client = createClient();

describe("Running a mock app with Glad features", function () {
return null;
  before(async function () {
    mongoose.Promise = Promise;
    await client.connect()
    process.chdir("tests/mock-app");
    await import(join(process.cwd(), "index.js"));
  });

  beforeEach(async () => await client.flushDb());

  after(async function () {
    await http.delete("resources/all");
    process.chdir("../../");
    await client.flushAll();
    await client.disconnect();
    await mongoose.disconnect();
    await Glad.server.websockets.close();
    await Glad.server.server.close();
  });

  it("should return a 404 for an unhandled route", async () => {
    const res = await http.get("");
    equal(res.status, 404);
  });

  it("should return 200 status code and an empty array of resources when none are created", async () => {
    const res = await http.get("resources");
    equal(res.status, 200);
    deepEqual(await res.json(), []);
  });

  it("should create a resource and return the resource in the response", async () => {
    const res = await http.post("resources", {
      name: "Tester 007",
      email: "tester007@mail.com",
      phone: "(555) 555-1212",
    });
    const body = await res.json();

    equal(res.status, 201);
    ok(body._id);
    equal(body.name, "Tester 007");
  });

  it("should create another resource and return the resource in the response", async () => {
    const res = await http.post("resources", {
      name: "Tester 008",
      email: "tester008@mail.com",
      phone: "(555) 500-1212",
    });
    const body = await res.json();
    equal(res.status, 201);
    ok(body._id);
    equal(body.name, "Tester 008");
  });

  it("should have 2 resources in the database", async () => {
    const res = await http.get("resources")
    const body = await res.json();

      equal(res.status, 200);
      ok(body.length);
      equal(body[0].name, "Tester 007");
      equal(body[1].name, "Tester 008");
  });

  it("should return a 403 Forbidden on a route where the policy is denied", async function () {
    const res = await http.get("resources/private")
    const body = await res.text();

    equal(res.status, 403);
    equal(body, "")
  });

  it("should return a 200 on a route where the policy is accepted", async function () {
    const res = await http.get("resources/not-private")

    equal(res.status, 200);
  });

  it("Should install socketIO on the controller", async function () {
    const res = await http.get("resources/has-io")
    const body = await res.json()

    equal(body.io, true);
    equal(body.in, true);
    equal(body.emit, true);
    equal(res.status, 200);
  });
});
