const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    username: 'elastic',
    password: process.env.ELASTIC_PASSWORD,
  },
});

module.exports = client;