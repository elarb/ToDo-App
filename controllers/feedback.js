const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
    }
});

/**
 * GET /feedback
 * Feedback form page.
 */
exports.getFeedback = (req, res) => {
    res.render('feedback', {
        title: 'Feedback'
    });
};

/**
 * POST /feedback
 * Send a feedback form via Nodemailer.
 */
exports.postFeedback = (req, res) => {
    req.assert('name', 'Name cannot be blank').notEmpty();
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('message', 'Message cannot be blank').notEmpty();

    const errors = req.validationErrors();

    if (errors) {
        req.flash('errors', errors);
        return res.redirect('/feedback');
    }

    const mailOptions = {
        to: 'e.aitlarbi@student.tudelft.nl',
        from: `${req.body.name} <${req.body.email}>`,
        subject: 'Feedback Form | To Do App',
        text: req.body.message
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            req.flash('errors', {msg: err.message});
            return res.redirect('/feedback');
        }
        req.flash('success', {msg: 'Email has been sent successfully!'});
        res.redirect('/feedback');
    });
};

