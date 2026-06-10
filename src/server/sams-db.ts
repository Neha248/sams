import { randomUUID } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import initSqlJs, { type Database } from "sql.js"
import { seedDatabase } from "./sams-seed"

export type SqlParam = string | number | null

let databasePromise: Promise<Database> | null = null

const configuredDbFile = process.env.SAMS_DB_FILE
const dbFile = configuredDbFile
	? path.resolve(process.cwd(), configuredDbFile)
	: path.join(process.cwd(), "data", "sams.sqlite")
const dataDir = path.dirname(dbFile)

function ensureDataDir() {
	if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
}

function wasmPath() {
	return path.join(
		process.cwd(),
		"node_modules",
		"sql.js",
		"dist",
		"sql-wasm.wasm",
	)
}

function persistDatabase(db: Database) {
	ensureDataDir()
	fs.writeFileSync(dbFile, Buffer.from(db.export()))
}

export function newId(prefix: string) {
	return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 16)}`
}

export function todayIso() {
	return new Date().toISOString().slice(0, 10)
}

export function toIsoDate(value: string) {
	const date = value ? new Date(value) : new Date()
	if (Number.isNaN(date.getTime())) return todayIso()
	return date.toISOString().slice(0, 10)
}

export function allRows<T>(
	db: Database,
	sql: string,
	params: SqlParam[] = [],
): T[] {
	const statement = db.prepare(sql)
	const rows: T[] = []
	try {
		statement.bind(params)
		while (statement.step()) {
			rows.push(statement.getAsObject() as T)
		}
		return rows
	} finally {
		statement.free()
	}
}

export function firstRow<T>(
	db: Database,
	sql: string,
	params: SqlParam[] = [],
): T | null {
	return allRows<T>(db, sql, params)[0] ?? null
}

export function runSql(db: Database, sql: string, params: SqlParam[] = []) {
	const statement = db.prepare(sql)
	try {
		statement.run(params)
	} finally {
		statement.free()
	}
}

export async function readDb<T>(reader: (db: Database) => T | Promise<T>) {
	const db = await getDb()
	return reader(db)
}

export async function writeDb<T>(writer: (db: Database) => T | Promise<T>) {
	const db = await getDb()
	db.exec("begin immediate transaction")
	try {
		const result = await writer(db)
		db.exec("commit")
		persistDatabase(db)
		return result
	} catch (error) {
		db.exec("rollback")
		throw error
	}
}

async function openDatabase() {
	ensureDataDir()
	const SQL = await initSqlJs({
		locateFile: () => wasmPath(),
	})
	const db = fs.existsSync(dbFile)
		? new SQL.Database(fs.readFileSync(dbFile))
		: new SQL.Database()
	db.exec("PRAGMA foreign_keys = ON")
	migrateDatabase(db)
	const userCount = firstRow<{ count: number }>(
		db,
		"select count(*) as count from users",
	)?.count
	if (!userCount) {
		db.exec("begin immediate transaction")
		try {
			seedDatabase(db, runSql)
			db.exec("commit")
			persistDatabase(db)
		} catch (error) {
			db.exec("rollback")
			throw error
		}
	}
	return db
}

export function getDb() {
	databasePromise ??= openDatabase()
	return databasePromise
}

function migrateDatabase(db: Database) {
	db.exec(`
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	login_id TEXT NOT NULL UNIQUE,
	full_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
	is_active INTEGER NOT NULL DEFAULT 1,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	user_id TEXT NOT NULL,
	expires_at TEXT NOT NULL,
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS departments (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subjects (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	code TEXT NOT NULL UNIQUE,
	department_id TEXT NOT NULL,
	semester INTEGER NOT NULL,
	credits INTEGER NOT NULL,
	FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS student_profiles (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	roll_number TEXT NOT NULL UNIQUE,
	department_id TEXT NOT NULL,
	semester INTEGER NOT NULL,
	section TEXT NOT NULL,
	phone TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE,
	employee_id TEXT NOT NULL UNIQUE,
	phone TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teacher_departments (
	profile_id TEXT NOT NULL,
	department_id TEXT NOT NULL,
	PRIMARY KEY (profile_id, department_id),
	FOREIGN KEY (profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
	FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS teacher_subjects (
	profile_id TEXT NOT NULL,
	subject_id TEXT NOT NULL,
	PRIMARY KEY (profile_id, subject_id),
	FOREIGN KEY (profile_id) REFERENCES teacher_profiles(id) ON DELETE CASCADE,
	FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

CREATE TABLE IF NOT EXISTS timetable (
	id TEXT PRIMARY KEY,
	department_id TEXT NOT NULL,
	semester INTEGER NOT NULL,
	section TEXT NOT NULL,
	day TEXT NOT NULL,
	start_time TEXT NOT NULL,
	end_time TEXT NOT NULL,
	subject_id TEXT NOT NULL,
	teacher_id TEXT NOT NULL,
	room_no TEXT NOT NULL,
	is_published INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY (department_id) REFERENCES departments(id),
	FOREIGN KEY (subject_id) REFERENCES subjects(id),
	FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
	id TEXT PRIMARY KEY,
	student_id TEXT NOT NULL,
	subject_id TEXT NOT NULL,
	teacher_id TEXT NOT NULL,
	timetable_id TEXT NOT NULL,
	date TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
	remarks TEXT NOT NULL DEFAULT '',
	created_at TEXT NOT NULL,
	UNIQUE (student_id, subject_id, date),
	FOREIGN KEY (student_id) REFERENCES users(id),
	FOREIGN KEY (subject_id) REFERENCES subjects(id),
	FOREIGN KEY (teacher_id) REFERENCES users(id),
	FOREIGN KEY (timetable_id) REFERENCES timetable(id)
);

CREATE TABLE IF NOT EXISTS notifications (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	message TEXT NOT NULL,
	priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
	target_type TEXT NOT NULL CHECK (target_type IN ('all', 'student', 'teacher', 'department')),
	target_id TEXT NOT NULL DEFAULT '',
	sent_at TEXT NOT NULL,
	created_by TEXT NOT NULL,
	is_draft INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_reads (
	notification_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	read_at TEXT NOT NULL,
	PRIMARY KEY (notification_id, user_id),
	FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_date ON attendance(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_timetable_cohort ON timetable(department_id, semester, section);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_type, target_id);
`)
	ensureColumn(db, "attendance", "updated_at", "TEXT NOT NULL DEFAULT ''")
	ensureColumn(db, "attendance", "updated_by", "TEXT NOT NULL DEFAULT ''")
}

function ensureColumn(
	db: Database,
	tableName: string,
	columnName: string,
	definition: string,
) {
	const columns = allRows<{ name: string }>(
		db,
		`pragma table_info(${tableName})`,
	)
	if (columns.some((column) => column.name === columnName)) return
	db.exec(`alter table ${tableName} add column ${columnName} ${definition}`)
}
