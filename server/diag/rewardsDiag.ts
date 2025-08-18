// server/diag/rewardsDiag.ts
// ChatGPT's comprehensive diagnostic tool for rewards system failures
// Systematically identifies: schema_mismatch | data_corruption | orm_bug | ok

import { db } from "../db";
import { cycleSettings, cycleWinnerSelections, payoutBatchItems } from "../../shared/schema";
import { eq, and, isNull } from "drizzle-orm";

export type DiagnosticVerdict = "schema_mismatch" | "data_corruption" | "orm_bug" | "ok";

export interface DiagnosticReport {
  timestamp: string;
  drizzleVersion: string;
  verdict: DiagnosticVerdict;
  details: {
    schemaProbe: {
      status: "pass" | "fail";
      issues: string[];
      actualColumns: Record<string, any>;
    };
    drizzleProbe: {
      status: "pass" | "fail";
      error?: string;
      queryResults?: any;
    };
    rawSqlProbe: {
      status: "pass" | "fail";
      error?: string;
      queryResults?: any;
    };
    dataIntegrityProbe: {
      status: "pass" | "fail";
      nullCounts: Record<string, number>;
      issues: string[];
    };
  };
}

export async function runRewardsDiagnostics(): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    drizzleVersion: await getDrizzleVersion(),
    verdict: "ok",
    details: {
      schemaProbe: { status: "pass", issues: [], actualColumns: {} },
      drizzleProbe: { status: "pass" },
      rawSqlProbe: { status: "pass" },
      dataIntegrityProbe: { status: "pass", nullCounts: {}, issues: [] }
    }
  };

  try {
    // 1. Schema probe - check information_schema vs Drizzle definitions
    await runSchemaProbe(report);

    // 2. Drizzle ORM probe - test basic selects that are failing
    await runDrizzleProbe(report);

    // 3. Raw SQL probe - bypass ORM completely
    await runRawSqlProbe(report);

    // 4. Data integrity probe - scan for nulls and corruption
    await runDataIntegrityProbe(report);

    // Determine final verdict based on probe results
    report.verdict = determineVerdict(report);

  } catch (error) {
    console.error("Diagnostic system failure:", error);
    report.verdict = "orm_bug";
    report.details.drizzleProbe.status = "fail";
    report.details.drizzleProbe.error = `Diagnostic system error: ${error}`;
  }

  return report;
}

async function getDrizzleVersion(): Promise<string> {
  try {
    // Try to get version from package info
    const pkg = await import("drizzle-orm/package.json");
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

async function runSchemaProbe(report: DiagnosticReport): Promise<void> {
  try {
    // Check actual database schema for key tables
    const schemaQuery = `
      SELECT 
        table_name, 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name IN ('cycle_settings', 'cycle_winner_selections', 'payout_batch_items')
      ORDER BY table_name, ordinal_position
    `;

    const actualSchema = await db.execute(schemaQuery);
    report.details.schemaProbe.actualColumns = actualSchema.rows;

    // Check for expected key columns
    const expectedColumns = [
      { table: 'cycle_winner_selections', column: 'cycle_setting_id' },
      { table: 'cycle_winner_selections', column: 'user_id' },
      { table: 'cycle_winner_selections', column: 'payout_status' },
      { table: 'cycle_settings', column: 'cycle_name' },
      { table: 'payout_batch_items', column: 'amount_cents' }
    ];

    for (const expected of expectedColumns) {
      const exists = actualSchema.rows.some((row: any) => 
        row.table_name === expected.table && row.column_name === expected.column
      );
      if (!exists) {
        report.details.schemaProbe.status = "fail";
        report.details.schemaProbe.issues.push(
          `Missing column: ${expected.table}.${expected.column}`
        );
      }
    }

  } catch (error) {
    report.details.schemaProbe.status = "fail";
    report.details.schemaProbe.issues.push(`Schema probe failed: ${error}`);
  }
}

async function runDrizzleProbe(report: DiagnosticReport): Promise<void> {
  try {
    // Test the exact failing query pattern from getRewardsHistoryForUser
    const winners = await db
      .select({
        cycleId: cycleWinnerSelections.cycleSettingId,
        awardedAt: cycleWinnerSelections.sealedAt,
        payoutFinal: cycleWinnerSelections.payoutFinal,
        rewardAmount: cycleWinnerSelections.rewardAmount,
        payoutStatus: cycleWinnerSelections.payoutStatus,
      })
      .from(cycleWinnerSelections)
      .where(and(eq(cycleWinnerSelections.userId, 1980), eq(cycleWinnerSelections.isSealed, true)))
      .limit(1);

    report.details.drizzleProbe.queryResults = winners;

  } catch (error) {
    report.details.drizzleProbe.status = "fail";
    report.details.drizzleProbe.error = `Drizzle query failed: ${error}`;
  }
}

async function runRawSqlProbe(report: DiagnosticReport): Promise<void> {
  try {
    // Test equivalent raw SQL query
    const rawQuery = `
      SELECT 
        cycle_setting_id as "cycleId",
        sealed_at as "awardedAt", 
        payout_final as "payoutFinal",
        reward_amount as "rewardAmount",
        payout_status as "payoutStatus"
      FROM cycle_winner_selections 
      WHERE user_id = $1 AND is_sealed = true 
      LIMIT 1
    `;

    const rawResult = await db.execute(rawQuery, [1980]);
    report.details.rawSqlProbe.queryResults = rawResult.rows;

  } catch (error) {
    report.details.rawSqlProbe.status = "fail";
    report.details.rawSqlProbe.error = `Raw SQL failed: ${error}`;
  }
}

async function runDataIntegrityProbe(report: DiagnosticReport): Promise<void> {
  try {
    // Check for null values in critical columns
    const nullChecks = [
      { table: "cycle_winner_selections", column: "cycle_setting_id" },
      { table: "cycle_winner_selections", column: "user_id" },
      { table: "cycle_settings", column: "id" },
      { table: "payout_batch_items", column: "cycle_setting_id" }
    ];

    for (const check of nullChecks) {
      const nullCountQuery = `
        SELECT COUNT(*) as null_count 
        FROM ${check.table} 
        WHERE ${check.column} IS NULL
      `;
      
      const result = await db.execute(nullCountQuery);
      const nullCount = parseInt(result.rows[0]?.null_count || "0");
      
      report.details.dataIntegrityProbe.nullCounts[`${check.table}.${check.column}`] = nullCount;
      
      if (nullCount > 0) {
        report.details.dataIntegrityProbe.status = "fail";
        report.details.dataIntegrityProbe.issues.push(
          `${nullCount} null values in ${check.table}.${check.column}`
        );
      }
    }

  } catch (error) {
    report.details.dataIntegrityProbe.status = "fail";
    report.details.dataIntegrityProbe.issues.push(`Data integrity check failed: ${error}`);
  }
}

function determineVerdict(report: DiagnosticReport): DiagnosticVerdict {
  // Schema issues take priority
  if (report.details.schemaProbe.status === "fail") {
    return "schema_mismatch";
  }

  // Data corruption issues
  if (report.details.dataIntegrityProbe.status === "fail") {
    return "data_corruption";
  }

  // Raw SQL works but Drizzle fails = ORM bug
  if (
    report.details.rawSqlProbe.status === "pass" && 
    report.details.drizzleProbe.status === "fail"
  ) {
    return "orm_bug";
  }

  // Both raw SQL and Drizzle fail = deeper infrastructure issue
  if (
    report.details.rawSqlProbe.status === "fail" && 
    report.details.drizzleProbe.status === "fail"
  ) {
    return "schema_mismatch";
  }

  // Everything passes
  return "ok";
}