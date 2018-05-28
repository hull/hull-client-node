/* global it, describe, beforeEach, afterEach */
const { expect } = require("chai");
const sinon = require("sinon");
const Minihull = require("minihull");

const HullClient = require("../../src/index");

const config = {
  id: "550964db687ee7866d000057",
  secret: "abcd12345",
  organization: "hull-demos",
  firehoseUrl: "http://localhost:8000/boom/firehose",
  flushAt: 1
};

describe("HullClient array feature", () => {
  let minihull, stub;
  beforeEach(() => {
    minihull = new Minihull();
    minihull.listen(8000);
    stub = minihull.stubPost("/boom/firehose")
      .callsFake((req, res) => {
        res.end("ok");
      });
  });

  afterEach(() => {
    minihull.close();
  });

  it("should allow to capture traits", () => {
    const clock = sinon.useFakeTimers();
    const firehoseEventsArray = [];
    const hullClient = new HullClient({ ...config, firehoseEventsArray });
    return hullClient.asUser({ email: "foo@bar.com" }).traits({ coconuts: 123 })
      .then(() => {
        expect(firehoseEventsArray).to.eql([
          {
            context: {
              organization: "hull-demos",
              id: "550964db687ee7866d000057",
              accessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1NTA5NjRkYjY4N2VlNzg2NmQwMDAwNTciLCJpYXQiOjAsImlvLmh1bGwuYXNVc2VyIjp7ImVtYWlsIjoiZm9vQGJhci5jb20ifSwiaW8uaHVsbC5zdWJqZWN0VHlwZSI6InVzZXIifQ.wWju3dKDpDk2fG1zUq0DpE-thK5oLMKFRVce9OcXx8g",
            },
            data: {
              type: "traits",
              body: { coconuts: 123 }
            }
          }
        ]);
        clock.restore();
      });
  });

  it("should allow to capture traits", () => {
    const clock = sinon.useFakeTimers();
    const logsArray = [];
    const hullClient = new HullClient({ ...config, logsArray });
    hullClient.logger.info("test", { foo: "bar" });
    expect(logsArray).to.eql([
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

