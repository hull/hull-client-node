// @flow

/**
 * Updates `private_settings` merging them if existing ones before.
 *
 * Note: `client.put` will result `ship:update` notify event coming from Hull platform - possible loop condition.
 * @param  {Object} newSettings settings to update
 * @return {Promise}
 */
export function update(newSettings: Object): Promise<any> { // eslint-disable-line import/prefer-default-export
  return this.get("app")
    .then((ship) => {
      const private_settings = { ...ship.private_settings, ...newSettings };
      ship.private_settings = private_settings;
      return this.put(ship.id, { private_settings });
    });
}
