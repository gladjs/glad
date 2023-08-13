import { join } from "path";
import { equal, deepEqual, ok } from "assert";
import fetch from "node-fetch";
import { connect } from "socket.io-client";
import { createClient } from "redis";
import Resource from "./mock-app/models/resource.js";
import { xit } from "mocha";

const client = createClient();
const post = async (url, body) =>
  await fetch(`http://127.0.0.1:4242/${url}`, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(body),
  });

describe("Running a mock app with Glad features", function () {
  return null
  beforeEach(async () => await client.flushDb());

  before(async function () {
    await client.connect();
    process.env.NODE_ENV = "";
    process.verbose = true;
    process.chdir("tests/mock-app");
    let { default: start } = await import(join(process.cwd(), "index.js"));
    await start;
    await Resource.deleteMany({});
  });

  after(async function () {
    process.env.NODE_ENV = "test";
    process.verbose = undefined;
    await fetch("http://127.0.0.1:4242/resources/all", { method: "DELETE" });
    process.chdir("../../");
    await client.flushDb();
    await client.disconnect();
  });

  it("should return a 404 for an unhandled route", async () => {
    const res = await fetch("http://127.0.0.1:4242");
    equal(res.status, 404);
  });

  it("should return 200 status code and an empty array of resources when none are created", async () => {
    const res = await fetch("http://127.0.0.1:4242/resources");
    equal(res.status, 200);
    deepEqual(await res.json(), []);
  });

  it("should create a resource and return the resource in the response", async () => {
    const res = await post("resources", {
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
    const res = await post("resources", {
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
    const res = await fetch("http://127.0.0.1:4242/resources");
    const body = await res.json();

    equal(res.status, 200);
    ok(body.length);
    equal(body[0].name, "Tester 007");
    equal(body[1].name, "Tester 008");
  });

  it("should cache the findOne using hit/miss syntax", async () => {
    const res = await fetch("http://127.0.0.1:4242/resources");
    const body = await res.json();
    const url = `http://127.0.0.1:4242/resources/${body[0]._id}`;

    equal(res.status, 200);

    const res2 = await fetch(url)
    const res3 = await fetch(url)

    equal(res2.status, 200);
    equal(res3.status, 200);
    equal(res3.headers.get("x-glad-cache-hit"), "true")
  })

  it("should return a 403 Forbidden on a route where the policy is denied", async function () {
    const res = await fetch("http://127.0.0.1:4242/resources/private");
    equal(res.status, 403);
  });

  it("should return a 200 on a route where the policy is accepted", async function () {
    const res = await fetch("http://127.0.0.1:4242/resources/not-private");
    equal(res.status, 200);
  });

  it("should set the cached headers", async function () {
    const res = await fetch("http://127.0.0.1:4242/resources");
    const res2 = await fetch("http://127.0.0.1:4242/resources");
    const res3 = await fetch("http://127.0.0.1:4242/resources");

    equal(res.status, 200);
    equal(res2.status, 200);
    equal(res3.status, 200);

    equal(res.headers.get("x-glad-cache-hit"), undefined)
    equal(res3.headers.get("x-glad-cache-hit"), "true")
  });

  it("ActionCache should clear after POSTing and build back up", async function () {
    let response = await fetch("http://127.0.0.1:4242/resources");
    equal(response.status, 200);
    equal(response.headers.get("x-glad-cache-hit"), undefined);

    response = await fetch("http://127.0.0.1:4242/resources");
    equal(response.status, 200);
    equal(response.headers.get("x-glad-cache-hit"), "true");

    response = await post("resources", {
      name: "Tester 009",
      email: "tester009@mail.com",
      phone: "(555) 500-1212",
    });
    equal(response.status, 201);
    let data = await response.json();
    ok(data._id);
    equal(data.name, "Tester 009");

    response = await fetch("http://127.0.0.1:4242/resources");
    equal(response.headers.get("x-glad-cache-hit"), undefined);

    response = await fetch("http://127.0.0.1:4242/resources");
    equal(response.headers.get("x-glad-cache-hit"), "true");
  });

  it("Should render a page using this.render", async function () {
    const res = await fetch("http://127.0.0.1:4242/resources/my-page")
    equal(res.status, 200)
    equal(await res.text(), "<h1>Charlie</h1><p>testing</p>")
  });

  it("Should render a page using this.render and cache the page", async function () {
    const res = await fetch("http://127.0.0.1:4242/resources/my-page")
    const res2 = await fetch("http://127.0.0.1:4242/resources/my-page")

    equal(res.status, 200)
    equal(res2.status, 200)

    equal(await res.text(), "<h1>Charlie</h1><p>testing</p>")
    equal(await res2.text(), "<h1>Charlie</h1><p>testing</p>")

    equal(res2.headers.get("x-glad-cache-hit"), "true");
  });

  xit("should communicate over ws", (done) => {
    let socket = connect("http://127.0.0.1:4242", { forceNew: true });
    socket.on("connect", function () {
      socket.emit("chat");
      socket.emit("room1");
      socket.emit("policyError");
      socket.disconnect();
      done();
    });
  });
});
