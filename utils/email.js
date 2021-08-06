const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, message }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: 'Samuel Oduwole <gahlaktus30000@gmail.com>',
    to: email,
    subject: subject,
    text: message
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
