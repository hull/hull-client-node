const _ = require("lodash");

function getProperties(raw, path, id_path) {
  const properties = {};
  const tree = [];

  _.each(raw, (props) => {
    const title = props.text || props.name;
    const key = props.id || props.key;
    const node = {
      ...props, id_path, path, title, key
    };

    if (key) {
      properties[key] = node;
    } else if (node.children) {
      const path_id = node.ship_id || node.app_id || node.platform_id || node.resource_id || title;

      const lpath = (path || []).concat([title]);
      const ipath = (id_path || []).concat([path_id]);
      const result = getProperties(node.children, lpath, ipath);
      node.children = result.tree;
      Object.assign(properties, result.properties);
    }

    tree.push(node);
  });

  return { properties, tree };
}

/**
 * Gets and returns all existing properties in the organization along with their metadata
 * @memberof Utils
 * @method   properties.get
 * @public
 * @return   {Promise<Object>}
 */
function get() {
  return this
    .get("search/user_reports/bootstrap")
    .then(({ tree }) => getProperties(tree).properties);
}

module.exports = {
  get
};
