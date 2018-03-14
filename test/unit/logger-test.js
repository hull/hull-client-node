/* global describe, it */
const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jwt-simple");

const Hull = require("../../src");

describe("Hull Logger", () => {
  let originalWrite, result;
  beforeEach(() => {
    originalWrite = process.stdout.write;
    result = "";
    process.stdout.write = (log) => {
      result = log;
    };
  });

  it("should by default print id and organization context", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });
    hull.logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });

  });

  it("should add user claims in context", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });
    hull.asUser({ email: "bob@bob.com", anonymous_id: "123" }).logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test",
        subject_type: "user",
        user_email: "bob@bob.com",
        user_anonymous_id: "123"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });
  });

  it("should add account claims in context", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });
    hull.asUser({ email: "bob@bob.com", anonymous_id: "123" }).account({ domain: "bob.com" }).logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test",
        subject_type: "account",
        account_domain: "bob.com",
        user_email: "bob@bob.com",
        user_anonymous_id: "123"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });
  });

  it("should allow passing connectorName to the context and results in connector_name in logs", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test", connectorName: "testing" });
    hull.logger.info("test", { foo: "bar" });
    process.stdout.write = originalWrite;
    expect(JSON.parse(result)).to.be.eql({
      context: {
        id: "562123b470df84b740000042",
        organization: "test",
        connector_name: "testing"
      },
      level: "info",
      message: "test",
      data: {
        foo: "bar"
      }
    });
  });

  it("should always return one-liners", () => {
    const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test", connectorName: "testing" });
    hull.logger.info("test", { foo: "bar", test: { bar: "foo" } });
    process.stdout.write = originalWrite;
    expect(/\n./g.test(result)).to.be.false;
  })
});
