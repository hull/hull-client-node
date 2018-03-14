/* global it, describe */

const _ = require('lodash');
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');

const Traits = require('../../src/utils/traits');

const expect = chai.expect;
chai.use(sinonChai);
chai.should();

describe('Traits.group', () => {

  var user = {
    'email': 'romain@user',
    'name': 'name',
    'traits_coconut_name': 'coconut',
    'traits_coconut_size': 'large',
    // 'traits_name/boom': 'should be ignored !',
    'traits_cb/twitter_bio': 'parisian',
    'traits_cb/twitter_name': 'romain',
    'traits_group/name': 'groupname',
    'traits_zendesk/open_tickets': 18,
    'traits_zendesk/open/tickets': 18,
    'traits_boom/hello[boom]': 42,
    'traits_boom/hello boom]': 492
  };

  it('should group traits', () => {
    var groupedUser = {
      email: "romain@user",
      name: "name",
      cb: {
        twitter_bio: "parisian",
        twitter_name: "romain"
      },
      group: {
        name: "groupname"
      },
      traits: {
        coconut_name: "coconut",
        coconut_size: "large"
      },
      zendesk: {
        open_tickets: 18,
        open: { tickets: 18 }
      },
      boom: {
        'hello[boom]' : 42,
        'hello boom]' : 492
      }
    };
    expect(Traits.group(user)).to.eql(groupedUser);
  });
});
