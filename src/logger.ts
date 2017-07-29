import * as winston from 'winston';

const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            formatter: function (options) {
                const time = new Date().toISOString();
                const level = options.level.toUpperCase();
                const msg = options.message;
                return `${time} [${level}] ${msg}`;
            }
        })
    ]
});

export const log = (msg: string) => {
    logger.info(msg);
};