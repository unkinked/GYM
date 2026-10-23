import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export const records = sqliteTable("records",{
 owner:text("owner").notNull(), kind:text("kind").notNull(), id:text("id").notNull(),
 payload:text("payload").notNull(), revision:integer("revision").notNull().default(0),
 updatedAt:text("updated_at").notNull(),lastOp:text("last_op").notNull().default("")
},t=>[primaryKey({columns:[t.owner,t.kind,t.id]})]);
export const operations=sqliteTable("operations",{
 owner:text("owner").notNull(),id:text("id").notNull(),kind:text("kind").notNull(),entityId:text("entity_id").notNull(),payload:text("payload").notNull(),revision:integer("revision").notNull(),createdAt:text("created_at").notNull()
},t=>[primaryKey({columns:[t.owner,t.id]})]);
export const aiUsage=sqliteTable("ai_usage",{
 owner:text("owner").notNull(),day:text("day").notNull(),attempts:integer("attempts").notNull().default(0)
},t=>[primaryKey({columns:[t.owner,t.day]})]);
