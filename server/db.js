import pg from 'pg';
import { readFile } from 'node:fs/promises';

export function createDatabase(connectionString, schema = 'public') {
  if (!connectionString) throw new Error('Falta DATABASE_URL. Ejecutá npm run local:setup.');
  if (!/^[a-z][a-z0-9_]*$/.test(schema)) throw new Error('Invalid database schema');
  const pool = new pg.Pool({ connectionString, max: 10, options: `-c search_path=${schema},public` });
  const query = (sql, values) => pool.query(sql, values);
  const tx = async work => {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  };
  async function initialize() {
    await query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await tx(async client => {
      // Prevent simultaneous application starts from racing schema/seed initialization.
      await client.query('SELECT pg_advisory_xact_lock(837425)');
      await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
      const seeded = await client.query("SELECT value FROM settings WHERE key='seeded'");
      if (!seeded.rowCount) {
        const products = JSON.parse(await readFile(new URL('../data/products.json', import.meta.url), 'utf8'));
        for (const p of products) await client.query('INSERT INTO products (id, data, stock, active, created_at, updated_at) VALUES ($1,$2,$3,true,NOW(),NOW()) ON CONFLICT DO NOTHING', [p.id, JSON.stringify(p), p.stock]);
        await client.query("INSERT INTO settings(key,value) VALUES ('seeded','true'),('store',$1) ON CONFLICT DO NOTHING",[JSON.stringify({whatsapp:'5491127064347',storeName:'DELUXEGAMES',supportEmail:'',instagram:'',deliveryNote:'Coordinamos disponibilidad, pago y entrega por WhatsApp.'})]);
      }
    });
  }
  return { query, tx, initialize, close: () => pool.end() };
}
