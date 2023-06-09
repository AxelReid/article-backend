'use strict'
import nodemailer from 'nodemailer'

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount()
  // console.log('testAccount', testAccount)

  let transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, //'dxpwvvsacljcoaj5@ethereal.email', // generated ethereal user
      pass: testAccount.pass, //'jQP6YY6MZCAd2VDXhU', // generated ethereal password
    },
  })

  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to: to, // list of receivers
    subject: 'Change password',
    html, // plain text body
  })

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
