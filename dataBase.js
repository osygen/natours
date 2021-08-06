const { connect } = require('mongoose');
const chalk = require('chalk');

exports.dataBase = async (dbURI) => {
  await connect(dbURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  }).then(
    console.log(
      chalk`{inverse.yellow ${dbURI}}{inverse.green : connection successful}`
    )
  );
};
