const nodemailer = require('nodemailer');

const sendEmail = async options => {
    //create a transporter
        const transport = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "b258d6bec5e672",
                pass: "015ecdd542dc4b"
            }
        });

    //define the email options
    const mailOptions = {
        from: "Agugbue Ikenna <iamagugbueikenna@gmail.com",
        to: options.email,
        subject: options.subject,
        text: options.message,
        //html:
    }

    //send email with nodemailer
    await transport.sendMail(mailOptions)
}

module.exports = sendEmail;