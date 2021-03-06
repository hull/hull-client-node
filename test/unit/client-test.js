/* global describe, it */

const { expect } = require("chai");
const sinon = require("sinon");
const jwt = require("jwt-simple");

const Hull = require("../../src");

describe("Hull", () => {
  describe("as", () => {
    it("should return scoped client with traits, track and alias methods", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scopedAccount = hull.asAccount({ domain: "hull.io" });
      const scopedUser = hull.asUser("1234");

      expect(scopedAccount).to.has.property("token")
        .that.is.an("function");
      expect(scopedAccount).to.has.property("traits")
        .that.is.an("function");
      expect(scopedAccount).not.to.have.property("track");
      expect(scopedAccount).not.to.have.property("alias");
      expect(scopedAccount).not.to.have.property("unalias");

      expect(scopedUser).to.has.property("token")
        .that.is.an("function");
      expect(scopedUser).to.has.property("traits")
        .that.is.an("function");
      expect(scopedUser).to.has.property("track")
        .that.is.an("function");
      expect(scopedUser).to.has.property("alias")
        .that.is.an("function");
      expect(scopedUser).to.has.property("unalias")
        .that.is.an("function");
    });

    it("should allow to pass create option", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com" }, { create: false });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.create")
        .that.eql(false);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asUser")
        .that.eql({ email: "foo@bar.com" });
    });

    it("should allow to pass scopes option", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com" }, { scopes: ["admin"] });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("scopes")
        .that.eql(["admin"]);
    });

    it("should allow to pass user id as a string", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser("123456");
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("sub")
        .that.eql("123456");
    });

    it("should allow to pass account domain as an object property", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asAccount({ domain: "hull.io" });
      const scopedConfig = scoped.configuration();
      const scopedJwtClaims = jwt.decode(scopedConfig.accessToken, scopedConfig.secret);
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asAccount")
        .that.eql({ domain: "hull.io" });
      expect(scopedJwtClaims)
        .to.have.property("io.hull.subjectType")
        .that.eql("account");
    });

    it("should allow to link user to an account", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com" }).account({ domain: "hull.io" });
      const scopedJwtClaims = jwt.decode(scoped.configuration().accessToken, scoped.configuration().secret);

      expect(scopedJwtClaims)
        .to.have.property("io.hull.subjectType")
        .that.eql("account");
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asAccount")
        .that.eql({ domain: "hull.io" });
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asUser")
        .that.eql({ email: "foo@bar.com" });
    });

    it("should allow to link a user using its id to an account", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser("1234").account({ domain: "hull.io" });
      const scopedJwtClaims = jwt.decode(scoped.configuration().accessToken, scoped.configuration().secret);

      expect(scopedJwtClaims)
        .to.have.property("io.hull.subjectType")
        .that.eql("account");
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asAccount")
        .that.eql({ domain: "hull.io" });
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asUser")
        .that.eql({ id: "1234" });
    });

    it("should allow to resolve an existing account user is linked to", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com" }).account();
      const scopedJwtClaims = jwt.decode(scoped.configuration().accessToken, scoped.configuration().secret);

      expect(scopedJwtClaims)
        .to.have.property("io.hull.subjectType")
        .that.eql("account");
      expect(scopedJwtClaims)
        .to.not.have.property("io.hull.asAccount");
      expect(scopedJwtClaims)
        .to.have.property("io.hull.asUser")
        .that.eql({ email: "foo@bar.com" });
    });

    it("should throw an error if any of required field is not passed", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      expect(hull.asUser.bind(hull, { some_id: "1234" }))
        .to.throw(Error);
      expect(hull.asAccount.bind(hull, { some_other_id: "1234" }))
        .to.throw(Error);

      expect(hull.asUser.bind(hull, { external_id: "1234" }))
        .to.not.throw(Error);
      expect(hull.asAccount.bind(hull, { external_id: "1234" }))
        .to.not.throw(Error);
    });

    it("should filter all non standard claims", () => {
      const hull = new Hull({ id: "562123b470df84b740000042", secret: "1234", organization: "test" });

      const scoped = hull.asUser({ email: "foo@bar.com", foo: "bar" });
      const scopedJwtClaims = jwt.decode(scoped.configuration().accessToken, scoped.configuration().secret);
      expect(scopedJwtClaims["io.hull.asUser"])
        .to.eql({ email: "foo@bar.com" });
    });
  });
});
