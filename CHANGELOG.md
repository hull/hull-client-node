* logging api timeouts and failures
* filter out logged claims for users and accounts so one can pass `hull.asUser(user)`
* add `client.as` alias and deprecation notice
* adds identification claims mapping for logger. Since now we can use: `client.asUser({ id, email }).logger("incoming.user.success");`
* adds `firehoseUrl` option to the Hull API client
* background firehose batcher respects `firehoseUrl` param, if not set defaults to `${protocol}://firehose.${domain}`
* adds `Hull-Organization` header to firehose calls
* adds `ip` and `time` context param to traits call

# 1.0.6
* fix `client.utils.traits.group` and deprecates `client.utils.groupTraits`
* improves code structure

# 1.0.0
* extract from `hull-node 0.11.4` - Initial Commit
