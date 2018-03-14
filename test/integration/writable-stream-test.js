/* global it, describe */
const { Writable } = require("stream");
const { expect } = require("chai");
const sinon = require("sinon");

const HullClient = require("../../src/index");

const config = {
  id: "550964db687ee7866d000057",
  secret: "abcd12345",
  organization: "hull-demos"
};

describe("HullClient writableStream feature", () => {
  it("should reject non wriable stream");

  it("should allow to capture traits", () => {
    const clock = sinon.useFakeTimers();
    const array = [];
    const writableStream = new Writable({
      objectMode: true,
      write(chunk, encoding, callback) {
        array.push(chunk);
        callback();
      }
    });
    const hullClient = new HullClient({ ...config, writableStream });
    hullClient.asUser({ email: "foo@bar.com" }).traits({ coconuts: 123 });
    hullClient.logger.info("test", { foo: "bar" });
    expect(array).to.eql([
      {
        context: {
          organization: "hull-demos",
          id: "550964db687ee7866d000057",
          secret: "abcd12345",
          token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1NTA5NjRkYjY4N2VlNzg2NmQwMDAwNTciLCJpYXQiOjAsImlvLmh1bGwuYXNVc2VyIjp7ImVtYWlsIjoiZm9vQGJhci5jb20ifSwiaW8uaHVsbC5zdWJqZWN0VHlwZSI6InVzZXIifQ.wWju3dKDpDk2fG1zUq0DpE-thK5oLMKFRVce9OcXx8g",
          userId: undefined
        },
        data: {
          type: "traits",
          body: { coconuts: 123 }
        }
      },
      {
        context: {
          organization: "hull-demos", id: "550964db687ee7866d000057"
        },
        data: { foo: "bar" },
        level: "info",
        message: "test",
        timestamp: "1970-01-01T00:00:00.000Z"
      }
    ]);
    clock.restore();
  });
});

