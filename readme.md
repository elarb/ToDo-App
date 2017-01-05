![](http://i.imgur.com/MyUrGDF.png)

To Do
=======================
[![Build Status](https://travis-ci.com/elarb/ToDo-App.svg?token=T3DvYLyn6TfxmknUsrTx&branch=master)](https://travis-ci.com/elarb/ToDo-App)

A To-Do Web App targeted at Children.

**Live Demo**: soon

Features
--------


- **Local Authentication** using Email and Password
- **OAuth 1.0a Authentication** via Twitter
- **OAuth 2.0 Authentication** via Facebook, Google
- Password strength check using Dropbox [zxcvbn](https://github.com/dropbox/zxcvbn)
- Flash notifications
- MVC Project Structure
- Sass stylesheets (auto-compiled via middleware)
- Bootstrap 3 
- Contact Form powered by Sendgrid
- **Account Management**
    - Gravatar
    - Profile Details
    - Change Password
    - Forgot Password
    - Reset Password
    - Link multiple OAuth strategies to one account
    - Delete Account
- **Protection**
    - CSRF
    - XSS
    - SQL-injection

Soon:
--------


- An even better password check
- Anti Cracking / Bots (**Captcha**)
- Admin Panel
- Selecting themes
- Translation

Prerequisites
-------------

- [<img src="https://nodejs.org/static/apple-touch-icon.png" align="top" height="35px">](http://nodejs.org)
- [<img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/62/MySQL.svg/640px-MySQL.svg.png" height="35px">](https://www.mysql.com/)
- Command Line Tools

Getting Started
---------------

The easiest way to get started is to clone the repository:

```bash
# Get the latest snapshot
git clone --depth=1 https://github.com/elarb/ToDo-App.git ToDo_App

# Change directory
cd ToDo_App

# Install NPM dependencies
npm install

# Or, if you prefer to use `yarn` instead of `npm`
yarn install

# Then simply start your app
node app.js
```

Contributing
---------------

Fork the project, create a new branch, make your changes, and open a pull request.