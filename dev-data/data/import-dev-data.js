require('dotenv').config({ path: './config.env' });
require('../../dataBase').dataBase(process.env.DATABASE_LOCAL);
const Model = [
    require('../../models').Tour,
    require('../../models').Review,
    require('../../models').User
  ],
  obj = [require('./tours'), require('./reviews'), require('./users')],
  arr = ['tour', 'review', 'user'];

(async (command) => {
  try {
    const error =
      (command.includes('d') && command.includes('i')) ||
      !(command.includes('d') || command.includes('i'));
    if (error) throw new Error('Please provide a key: i/d');

    await Promise.all(
      command.map((cmd, index, cmdArray) => {
        if (!arr.includes(cmd)) return;
        const i = arr.indexOf(cmd);
        return cmdArray.includes('d')
          ? Model[i].deleteMany()
          : Model[i].create(
              obj[i],
              i === 2 ? { validateModifiedOnly: true } : undefined
            );
      })
    );

    console.log('done!');
  } catch (e) {
    console.log(`${e.name.toUpperCase()}: ${e.message}`);
  }
  process.exit();
})(process.argv);

// node dev-data/data/import-dev-data.js user tour review i
// node dev-data/data/import-dev-data.js user tour review d
