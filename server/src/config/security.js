const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis').default;

module.exports = {
    initialize: (app, redis) => {
        // 基本安全头
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            },
            crossOriginEmbedderPolicy: true,
            crossOriginOpenerPolicy: true,
            crossOriginResourcePolicy: true,
            dnsPrefetchControl: true,
            frameguard: true,
            hidePoweredBy: true,
            hsts: true,
            ieNoOpen: true,
            noSniff: true,
            permittedCrossDomainPolicies: true,
            referrerPolicy: true,
            xssFilter: true
        }));

        // MongoDB 注入防护
        app.use(mongoSanitize());

        // 参数污染防护
        app.use(hpp());

        // Cookie 解析器
        app.use(cookieParser(process.env.COOKIE_SECRET));

        // Session 配置
        app.use(session({
            store: new RedisStore({ client: redis }),
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24小时
            }
        }));

        // SQL 注入防护（虽然使用 MongoDB，但为了防止其他类型的注入）
        app.use((req, res, next) => {
            // 清理查询参数
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = req.query[key].replace(/['";]/g, '');
                }
            });
            next();
        });

        // 请求大小限制
        app.use(express.json({ limit: '10kb' }));
        app.use(express.urlencoded({ extended: true, limit: '10kb' }));

        // 添加安全响应头
        app.use((req, res, next) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });
    }
}; 