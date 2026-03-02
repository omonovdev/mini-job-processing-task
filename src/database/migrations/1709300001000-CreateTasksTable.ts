import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1709300001000 implements MigrationInterface {
  name = 'CreateTasksTable1709300001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "tasks_priority_enum" AS ENUM('high', 'normal', 'low')
    `);

    await queryRunner.query(`
      CREATE TYPE "tasks_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "priority" "tasks_priority_enum" NOT NULL DEFAULT 'normal',
        "payload" jsonb NOT NULL DEFAULT '{}',
        "status" "tasks_status_enum" NOT NULL DEFAULT 'PENDING',
        "idempotency_key" character varying NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tasks_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tasks_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_tasks_user_id" ON "tasks" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_status" ON "tasks" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_type" ON "tasks" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_scheduled_at" ON "tasks" ("scheduled_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "tasks_priority_enum"`);
  }
}
