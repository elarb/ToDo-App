const request = require('supertest');
const app = require('../app.js');

describe('GET /', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/')
      .expect(200, done);
  });
});

describe('GET /login', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/login')
      .expect(200, done);
  });
});

describe('GET /signup', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/signup')
      .expect(200, done);
  });
});


describe('GET /feedback', () => {
  it('should return 200 OK', (done) => {
    request(app)
      .get('/feedback')
      .expect(200, done);
  });
});

describe('GET /random-url', () => {
  it('should return 400', (done) => {
    request(app)
      .get('/reset')
      .expect(400, done);
  });
});
