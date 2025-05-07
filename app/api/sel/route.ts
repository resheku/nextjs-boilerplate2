import { NextResponse } from "next/server";
import { DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';
import path from 'path';

export const runtime = "nodejs" // Explicitly set Node.js runtime

export async function GET() {
  try {
    const dbUrl = process.env.DB_URL;
    // Read SQL query from file
    const sqlFilePath = path.join(process.cwd(), 'lib/sql/schedule.sql');
    const query = fs.readFileSync(sqlFilePath, 'utf8');

    // Initialize a new DuckDB database instance
    const instance = await DuckDBInstance.create(':memory:');
    // Connect to the DuckDB instance
    const connection = await instance.connect();
    await connection.run("INSTALL http;");
    await connection.run("LOAD http;");
    await connection.run(`ATTACH '${dbUrl}' AS sel;`);


    // Format the result for better JSON output
    const reader = await connection.runAndReadAll("select * from sel.stats;");
    const rowObjects = reader.getRowObjectsJson();
    // Close the connection and database
    connection.disconnectSync();

    return NextResponse.json(rowObjects);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json({ error: "Failed to query DuckDB database" }, { status: 500 });
  }
}

