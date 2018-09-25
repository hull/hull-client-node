const Transport = require("winston-transport");

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
class CustomTransport extends Transport {
  constructor(opts) {
    super(opts);
    this.logsArray = opts.logsArray;
  }

  log({ level, message, payload = {} }, callback) {
    setImmediate(() => {
      this.logsArray.push({
        message,
        level,
        data: payload.data,
        context: payload.context,
        timestamp: new Date().toISOString()
      });
    });
    callback();
  }
}

module.exports = CustomTransport;
