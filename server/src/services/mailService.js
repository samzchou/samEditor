const nodemailer = require('nodemailer');

class mailService {
    constructor() {
        // this.mailObj = mailObj;
    }
    async sendMail(mailObj) {
        // 创建邮件传输器
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
        const mailOptions = {
            from: process.env.MAIL_FROM,
            to: mailObj.mailTo,
            subject: mailObj.subject,
            html: mailObj.content
        };
        const result = await transporter.sendMail(mailOptions);
        return result;
    }   
}

module.exports = new mailService(); 