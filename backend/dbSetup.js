import pg from "pg";
import dotenv from "dotenv"

dotenv.config();

const { Pool } = pg;

const dsn = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}` +
    `@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

const pool = new Pool({
    connectionString: dsn,
});

const queries = [
    `CREATE TABLE IF NOT EXISTS feature_runs (
        id SERIAL PRIMARY KEY,
        run_id VARCHAR(50) NOT NULL,
        run_time TIMESTAMP NOT NULL,
        feature_name TEXT NOT NULL,
        risk_score VARCHAR(20)
    );`,
    `CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS regulations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS run_regions (
        run_id INT REFERENCES feature_runs(id) ON DELETE CASCADE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE,
        PRIMARY KEY (run_id, region_id)
    );`,
    `CREATE TABLE IF NOT EXISTS run_regulations (
        run_id INT REFERENCES feature_runs(id) ON DELETE CASCADE,
        regulation_id INT REFERENCES regulations(id) ON DELETE CASCADE,
        PRIMARY KEY (run_id, regulation_id)
    );`,
    `CREATE TABLE IF NOT EXISTS audit (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );`
];

async function setup() {
    let client;
    try {
        client = await pool.connect();
        console.log("Connected to DB");

        for (const query of queries) {
            await client.query(query);
        }
        console.log("Tables created successfully");

    } catch (err) {
        console.error("Database setup failed:", err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

setup()
