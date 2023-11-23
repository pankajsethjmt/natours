/////// 4) Server Starting

const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
).replace('<USERNAME>', process.env.DATABASE_USERNAME);

async function main() {
  console.log('Database connection started');
  await mongoose.connect(DB);
  console.log('Database connected');
}
main().catch((err) => console.log(err.name, err.message));

const port = 3000;
const server = app.listen(port, () =>
  console.log(`App is Running on port: ${port}`)
);
