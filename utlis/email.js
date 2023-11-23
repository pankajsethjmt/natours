const nodemailer = require('nodemailer');
const { convert } = require('html-to-text');
const pug = require('pug');

const path = require('path');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_1}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production')
      return nodemailer.createTransport({
        host: process.env.BREVO_HOST,
        port: process.env.BREVO_PORT,
        auth: {
          user: process.env.BREVO_USERNAME,
          pass: process.env.BREVO_KEY,
        },
      });

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emailTemp/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    );
    const text = convert(html);

    const mailInfo = {
      from: this.from,
      to: this.to,
      subject,
      text,
      html,
    };

    await this.newTransport().sendMail(mailInfo);
  }

  async sendWelcome() {
    this.send('welcome', 'Welcome to Natours Family');
  }

  async sendPasswordResetToken() {
    this.send('passwordResetTemp', 'Your Password Reset(Valid for 10 min)');
  }
};

// const sendEmail = async function (option) {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailInfo = {
//     from:
//       option.from ||
//       `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_1}>`, // sender address
//     to: option.email, // list of receivers
//     subject: option.subject, // Subject line
//     text: option.message, // plain text body
//     // html: '<b>Hello world?</b>', // html body
//   };
//   await transporter.sendMail(mailInfo);
// };

// module.exports = sendEmail;
