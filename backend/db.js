require("dotenv").config();
const { Pool } = require("pg");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST || "127.0.0.1",
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT) || 5432,
    };

const pool = new Pool({
  ...poolConfig,
  max: Number(process.env.DB_MAX_CLIENTS) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS) || 10000,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
  process.exit(1);
});

const defaultPaymentDestination = {
  accountNumber:
    (process.env.PAYMENT_DESTINATION_ACCOUNT_NUMBER || "4008112745434").trim(),
  accountName:
    (process.env.PAYMENT_DESTINATION_ACCOUNT_NAME || "HASHIMWIMANA Manzi").trim(),
  provider: (process.env.PAYMENT_DESTINATION_PROVIDER || "EQUITY").trim().toUpperCase(),
};

async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        full_name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        level TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'STUDENT',
        status TEXT NOT NULL DEFAULT 'NEW',
        overall_score INTEGER NOT NULL DEFAULT 0,
        average_score INTEGER NOT NULL DEFAULT 0,
        reputation_rating INTEGER NOT NULL DEFAULT 0,
        completed_tasks INTEGER NOT NULL DEFAULT 0,
        level_status TEXT NOT NULL DEFAULT 'LEARNING',
        internship_eligible BOOLEAN NOT NULL DEFAULT FALSE,
        certificate_eligible BOOLEAN NOT NULL DEFAULT FALSE,
        certificate_status TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE',
        password_hash TEXT NOT NULL,
        refresh_token TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS overall_score INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS average_score INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reputation_rating INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS completed_tasks INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS level_status TEXT NOT NULL DEFAULT 'LEARNING';
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS internship_eligible BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS certificate_eligible BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS certificate_status TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        payer_name TEXT,
        payer_phone TEXT,
        reference_code TEXT NOT NULL,
        method TEXT NOT NULL,
        amount INTEGER NOT NULL,
        destination_account_number TEXT,
        destination_account_name TEXT,
        destination_provider TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        proof_filename TEXT,
        admin_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS payer_name TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS payer_phone TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS destination_account_number TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS destination_account_name TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS destination_provider TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS proof_filename TEXT;
    `);

    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS admin_note TEXT;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS practical_requests (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        requested_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS practical_tasks (
        id UUID PRIMARY KEY,
        request_id UUID NOT NULL REFERENCES practical_requests(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level TEXT,
        task_number INTEGER,
        deadline_days INTEGER,
        due_at TIMESTAMPTZ,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ASSIGNED',
        score INTEGER,
        github_repo_url TEXT,
        project_zip_filename TEXT,
        project_zip_path TEXT,
        submission_text TEXT,
        missed_reason TEXT,
        missed_reason_proof TEXT,
        missed_reason_status TEXT,
        review_note TEXT,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        submitted_at TIMESTAMPTZ,
        reviewed_at TIMESTAMPTZ,
        missed_at TIMESTAMPTZ,
        explanation_submitted_at TIMESTAMPTZ,
        confirmed_at TIMESTAMPTZ
      );
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS level TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS task_number INTEGER;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS deadline_days INTEGER;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS github_repo_url TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS project_zip_filename TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS project_zip_path TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS submission_text TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS score INTEGER;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS missed_reason TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS missed_reason_proof TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS missed_reason_status TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS review_note TEXT;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS missed_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      ADD COLUMN IF NOT EXISTS explanation_submitted_at TIMESTAMPTZ;
    `);

    await client.query(`
      ALTER TABLE practical_tasks
      DROP COLUMN IF EXISTS auto_score,
      DROP COLUMN IF EXISTS auto_feedback,
      DROP COLUMN IF EXISTS evaluation_status,
      DROP COLUMN IF EXISTS execution_technology,
      DROP COLUMN IF EXISTS tests_passed,
      DROP COLUMN IF EXISTS tests_failed,
      DROP COLUMN IF EXISTS test_results,
      DROP COLUMN IF EXISTS execution_logs,
      DROP COLUMN IF EXISTS evaluation_started_at,
      DROP COLUMN IF EXISTS evaluation_completed_at;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificate_requests (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        level TEXT NOT NULL,
        final_score INTEGER NOT NULL,
        progress_percent INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        reviewed_at TIMESTAMPTZ,
        reviewed_by TEXT,
        admin_note TEXT
      );
    `);

    await client.query(`
      DROP TABLE IF EXISTS evaluation_jobs;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        certificate_request_id UUID NOT NULL REFERENCES certificate_requests(id) ON DELETE CASCADE,
        certificate_id TEXT NOT NULL UNIQUE,
        level TEXT NOT NULL,
        final_score INTEGER NOT NULL,
        issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
        pdf_path TEXT,
        qr_code_path TEXT,
        verification_token TEXT NOT NULL,
        is_valid BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      ALTER TABLE certificates
      ADD COLUMN IF NOT EXISTS generated_path TEXT,
      ADD COLUMN IF NOT EXISTS generated_format TEXT NOT NULL DEFAULT 'svg',
      ADD COLUMN IF NOT EXISTS certificate_hash TEXT,
      ADD COLUMN IF NOT EXISTS blockchain_tx TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'VALID',
      ADD COLUMN IF NOT EXISTS verification_count INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificate_audit_logs (
        id UUID PRIMARY KEY,
        certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        actor_type TEXT NOT NULL,
        actor_id TEXT,
        description TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificate_verification_logs (
        id UUID PRIMARY KEY,
        certificate_id UUID NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
        certificate_lookup_id TEXT NOT NULL,
        verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        status TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'PUBLIC_VERIFY',
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'GENERAL',
        target_page TEXT NOT NULL DEFAULT '/user/notifications',
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      INSERT INTO system_settings (key, value)
      VALUES (
        'payment_destination',
        $1::jsonb
      )
      ON CONFLICT (key) DO NOTHING;
    `, [JSON.stringify(defaultPaymentDestination)]);

    await client.query(
      `
        UPDATE system_settings
        SET value = $1::jsonb,
            updated_at = now()
        WHERE key = 'payment_destination'
          AND COALESCE(NULLIF(TRIM(value->>'accountNumber'), ''), '') = ''
      `,
      [JSON.stringify(defaultPaymentDestination)]
    );
  } finally {
    client.release();
  }
}

module.exports = { pool, ensureTables };
