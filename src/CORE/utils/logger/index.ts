import winston from "winston";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.uncolorize(),
  winston.format.json()
);

export const Logger = winston.createLogger({
  levels,
  format: fileFormat,
  transports: [
    new winston.transports.Console({
      format: format,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "logs/all.log" }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/crashes/exceptions.log" }),
    new winston.transports.Console({ format: format }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/crashes/rejections.log" }),
    new winston.transports.Console({ format: format }),
  ],
});
