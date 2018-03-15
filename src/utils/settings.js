// @flow

/**
 * Updates `private_settings` merging them with existing ones before.
 *
 * Note: this method will trigger `hullClient.put` and will result in `ship:update` notify event coming from Hull platform - possible loop condition.
 * @memberof Utils
 * @method   settings.update
 * @public
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
function update(newSettings: Object): Promise<any> {
  return this.get("app")
    .then((ship) => {
      const private_settings = { ...ship.private_settings, ...newSettings };
      ship.private_settings = private_settings;
      return this.put(ship.id, { private_settings });
    });
}

module.exports = {
  update
};
