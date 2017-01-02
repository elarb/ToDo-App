# To Do

A To Do App for Children.

**Live Demo**: 

## Features


- **Local Authentication** using Username and Password
- **OAuth 1.0a Authentication** via Twitter
- **OAuth 2.0 Authentication** via Facebook, Google
- Password strength check using Dropbox [zxcvbn](https://github.com/dropbox/zxcvbn)
- Flash notifications
- MVC Project Structure
- Node.js clusters support
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
- CSRF protection

Prerequisites
-------------

- [MySQL](https://www.mysql.com/)
- [Node.js 6.0+](http://nodejs.org)
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
## Contributing

Fork the project, create a new branch, make your changes, and open a pull request.