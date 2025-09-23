BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "users" (
	"id"	INTEGER,
	"username"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"is_connected"	INTEGER DEFAULT 0,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "messages" (
	"id"	INTEGER,
	"sender"	TEXT,
	"receiver"	TEXT,
	"message"	TEXT,
	"timestamp"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "groups" (
	"id"	INTEGER,
	"group_name"	TEXT NOT NULL,
	"creator"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "group_members" (
	"group_id"	INTEGER,
	"username"	TEXT,
	FOREIGN KEY("group_id") REFERENCES "groups"("id")
);
CREATE TABLE IF NOT EXISTS "group_messages" (
	"id"	INTEGER,
	"group_id"	INTEGER,
	"sender"	TEXT,
	"message"	TEXT,
	"timestamp"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("group_id") REFERENCES "groups"("id")
);
INSERT INTO "users" VALUES (1,'junior','j',1);
INSERT INTO "users" VALUES (2,'othmane','o',1);
INSERT INTO "users" VALUES (3,'test','t',0);
INSERT INTO "messages" VALUES (1,'junior','othmane','pute','2025-09-09 16:27:09');
INSERT INTO "messages" VALUES (2,'othmane','junior','pute','2025-09-09 16:27:27');
INSERT INTO "messages" VALUES (3,'test','junior','salut','2025-09-11 12:24:47');
INSERT INTO "messages" VALUES (4,'test','junior','salut 👋','2025-09-11 12:29:43');
INSERT INTO "messages" VALUES (5,'test','junior','test','2025-09-12 14:50:34');
INSERT INTO "messages" VALUES (6,'test','othmane','👍️','2025-09-17 12:26:14');
INSERT INTO "messages" VALUES (7,'test','junior','t','2025-09-17 12:31:10');
INSERT INTO "messages" VALUES (8,'test','junior','test','2025-09-17 12:32:50');
INSERT INTO "messages" VALUES (9,'test','othmane','t','2025-09-17 12:33:08');
INSERT INTO "messages" VALUES (10,'test','othmane','test','2025-09-17 12:36:38');
INSERT INTO "messages" VALUES (11,'test','othmane','g','2025-09-17 12:38:38');
INSERT INTO "messages" VALUES (12,'test','othmane','t','2025-09-17 12:40:13');
INSERT INTO "messages" VALUES (13,'test','othmane','s','2025-09-17 12:43:10');
INSERT INTO "messages" VALUES (14,'test','othmane','e','2025-09-17 13:00:41');
INSERT INTO "messages" VALUES (15,'test','junior','e','2025-09-17 13:02:54');
INSERT INTO "messages" VALUES (16,'test','othmane','é"','2025-09-17 13:07:05');
INSERT INTO "messages" VALUES (17,'test','othmane','e','2025-09-17 13:11:40');
INSERT INTO "messages" VALUES (18,'test','othmane','e','2025-09-17 13:13:53');
INSERT INTO "messages" VALUES (19,'test','junior','test','2025-09-17 13:47:50');
INSERT INTO "messages" VALUES (20,'test','othmane','d','2025-09-18 12:37:47');
INSERT INTO "messages" VALUES (21,'test','othmane','t','2025-09-18 12:57:58');
INSERT INTO "messages" VALUES (22,'test','junior','oe','2025-09-18 14:59:59');
INSERT INTO "messages" VALUES (23,'test','othmane','d','2025-09-18 15:00:12');
INSERT INTO "messages" VALUES (24,'test','junior','a','2025-09-18 15:02:03');
INSERT INTO "messages" VALUES (25,'test','othmane','e','2025-09-18 15:04:13');
INSERT INTO "messages" VALUES (26,'test','othmane','oui oui','2025-09-18 15:04:17');
INSERT INTO "messages" VALUES (27,'test','othmane','oe oe oe','2025-09-18 15:12:26');
INSERT INTO "messages" VALUES (28,'test','othmane','z','2025-09-19 12:37:39');
INSERT INTO "messages" VALUES (29,'test','othmane','zdzf','2025-09-19 12:57:11');
INSERT INTO "messages" VALUES (30,'test','othmane','hh👍️,dddffdsdd','2025-09-23 16:32:02');
INSERT INTO "messages" VALUES (31,'othmane','test','adzdzddz','2025-09-23 16:33:00');
INSERT INTO "messages" VALUES (32,'test','othmane','dadzzdzdzdzd','2025-09-23 16:33:20');
INSERT INTO "groups" VALUES (1,'salut','test');
INSERT INTO "groups" VALUES (2,'azjd f','test');
INSERT INTO "group_members" VALUES (1,'test');
INSERT INTO "group_members" VALUES (2,'test');
COMMIT;
