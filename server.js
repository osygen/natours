process.on('uncaughtException', (error) => {
  console.log(`uncaughtException`);
  console.log(error.name, error.message, error.stack);
  process.exit(1);
});

require('dotenv').config({ path: './config.env' });
require('./dataBase.js').dataBase(process.env.DATABASE_LOCAL);
const chalk = require('chalk');
const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(
    chalk.inverse
      .green`app running in '${process.env.NODE_ENV}' mode on port{yellow : ${port}}`
  );
});

process.on('unhandledRejection', (error) => {
  console.log(chalk`{inverse.red unhandledRejection}`);
  console.log(error.name, error.message, error.stack);
  server.close(() => {
    console.log('shutting down');
    process.exit(1);
  });
});
