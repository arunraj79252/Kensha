
// Utility for creating logs
const { createLogger, format, transports } = require('winston');
require('dotenv').config();
require('winston-daily-rotate-file');
const fileRotateTransport = new transports.DailyRotateFile({
    filename: 'log_files/server-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
});

module.exports = createLogger({
    format: format.combine(
        format.timestamp({ format: 'MMM-DD-YYYY HH:mm:ss' }),
        format.align(),
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [new transports.Console(),
        fileRotateTransport],
});