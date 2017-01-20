![](http://i.imgur.com/8gp5CQO.png)

![](http://i.imgur.com/YeLjxof.png)

![](http://i.imgur.com/qN2wDCN.png)

To Do
=======================
[![Build Status](https://travis-ci.com/elarb/ToDo-App.svg?token=T3DvYLyn6TfxmknUsrTx&branch=master)](https://travis-ci.com/elarb/ToDo-App) 

A To-Do Web App targeted at Children.

**Live Demo**: https://elar.herokuapp.com

Features
--------


- **Local Authentication** using Email and Password
- **OAuth 1.0a Authentication** via Twitter
- **OAuth 2.0 Authentication** via Facebook, Google
- Password strength check using Dropbox [zxcvbn](https://github.com/dropbox/zxcvbn)
- Flash notifications
- MVC Project Structure
- Templating using Pug (ex-Jade)
- Sass stylesheets (auto-compiled via middleware)
- Bootstrap 3 (**Mobile Friendly**)
- Contact Form powered by Sendgrid
- MySQL data storage (users + data) using Knex.js and pool connections
- MongoDB (Mongolab) session storage
- Selecting themes
- **Account Management**
    - Gravatar
    - Profile Details
    - Change Password
    - Forgot Password
    - Reset Password
    - Link multiple OAuth strategies to one account
    - Delete Account 
- :lock: **Security**
    - CSRF 
    - XSS
    - SQL-injection
    - Anti Cracking / Bots (**Google reCAPTCHA & brute-force prevention**)
   
Soon:
--------
- Admin Panel
- Translation
- Security improvements (With [OWASP Top 10](https://www.owasp.org/index.php/Top_10_2013-Top_10) in mind)

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

# Additionally, you should also create a MySQL Database and add it's details to your .env file
# You can find a template for this file in the repository
CREATE DATABASE todo_db;
```

Contributing
---------------

Fork the project, create a new branch, make your changes, and open a pull request.