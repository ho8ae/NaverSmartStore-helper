import { pool } from "./connection.js";
import "dotenv/config";

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255),
    secret_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Products table
  `CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    images TEXT[],
    options JSONB DEFAULT '[]'::jsonb,
    category_id VARCHAR(255),
    naver_product_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,

  // Crawling logs table
  `CREATE TABLE IF NOT EXISTS crawling_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    source_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
];

// 추가 마이그레이션 쿼리들 (기존 테이블 수정용)
const alterTableQueries = [
  // products 테이블에 새로운 컬럼이 없는 경우에만 추가
  `DO $$ 
  BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'category_id') THEN
      ALTER TABLE products ADD COLUMN category_id VARCHAR(255);
    END IF;
  END $$;`,

  // options 컬럼의 기본값 설정 확인
  `DO $$ 
  BEGIN 
    ALTER TABLE products 
    ALTER COLUMN options SET DEFAULT '[]'::jsonb;
  EXCEPTION 
    WHEN others THEN NULL;
  END $$;`,
];

const runMigrations = async () => {
  let client;
  try {
    client = await pool.connect();

    // 기본 테이블 생성
    for (const migration of migrations) {
      console.log("Executing migration:", migration.split("\n")[0]);
      await client.query(migration);
      console.log("Migration completed successfully");
    }

    // 테이블 수정 쿼리 실행
    for (const query of alterTableQueries) {
      console.log("Executing alter table query");
      await client.query(query);
      console.log("Alter table query completed successfully");
    }

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Run migrations if this file is executed directly
if (process.argv[1].endsWith("migrations.js")) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default runMigrations;
