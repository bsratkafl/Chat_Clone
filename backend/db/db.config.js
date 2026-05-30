// import mysql2 promise api
import mysql from "mysql2/promise";

// create a connection pool to the database using environment variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
   socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock', // path to mysql sock in MAMP
});

// export the database connection pool
export default db;
