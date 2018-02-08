# 1.1.6
* adds additional `aliases` and `service_ids` claims to `asAccount` and `asUser` methods

# 1.1.5
* retry all 5xx errors

# 1.1.4
* add requestId in logger context

# 1.1.3
* fixes building and publishing process

# 1.1.2
* fixes how API rest client rejects after errors

# 1.1.1
* Add support for custom `scopes` claim in auth tokens

# 1.1.0
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
