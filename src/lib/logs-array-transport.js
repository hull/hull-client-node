// @flow
const Transport = require("winston-transport");

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//

type LogsArrayOpts = {
  logsArray: Array<any>
};
type LogMessage = {
  context: {},
  data: {},
  level: string,
  message: string
};

class LogsArrayTransport extends Transport {
  constructor(opts: LogsArrayOpts) {
    super(opts);
    this.name = "logsArray"
    this.logsArray = opts.logsArray;
  }

  log({ context, data, level, message }: LogMessage, callback: () => void) {
    this.logsArray.push({
      message,
      level,
      data,
      context,
      timestamp: new Date().toISOString()
    });
    callback();
  }
}

module.exports = LogsArrayTransport;
