import fetch from "node-fetch";

export class http {
  static async post(url, body) {
    return await fetch(`http://127.0.0.1:4242/${url}`, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  static async put(url, body) {
    return await fetch(`http://127.0.0.1:4242/${url}`, {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  static async get(url) {
    return await fetch(`http://127.0.0.1:4242/${url}`)
  }

  static async delete(url) {
    return await fetch(`http://127.0.0.1:4242/${url}`, {method: "DELETE"})
  }
}
