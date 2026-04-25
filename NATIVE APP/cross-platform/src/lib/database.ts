import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

const getDb = async () => {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('attendance.db');
  }
  return _db;
};

export const initDb = async () => {
  try {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        eventId TEXT,
        studentName TEXT,
        usn TEXT,
        email TEXT,
        isPresent INTEGER DEFAULT 0,
        markedAt INTEGER,
        isSynced INTEGER DEFAULT 1
      );
    `);
    return true;
  } catch (error) {
    console.error("DB Init Error:", error);
    return false;
  }
};

export const saveRegistrations = async (registrations: any[]) => {
  try {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const reg of registrations) {
        await db.runAsync(
          'INSERT OR REPLACE INTO registrations (id, eventId, studentName, usn, email, isPresent, markedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            reg.id, 
            reg.event_id, 
            reg.student_name, 
            reg.usn, 
            reg.email, 
            reg.is_present ? 1 : 0, 
            reg.marked_at ? new Date(reg.marked_at).getTime() : null, 
            1
          ]
        );
      }
    });
    return true;
  } catch (error) {
    console.error("Save Registrations Error:", error);
    return false;
  }
};

export const markPresentLocally = async (usn: string, eventId: string) => {
  const now = Date.now();
  try {
    const db = await getDb();
    await db.runAsync(
      'UPDATE registrations SET isPresent = 1, markedAt = ?, isSynced = 0 WHERE usn = ? AND eventId = ?',
      [now, usn, eventId]
    );
    return now;
  } catch (error) {
    console.error("Mark Present Error:", error);
    throw error;
  }
};

export const getUnsyncedRecords = async () => {
  try {
    const db = await getDb();
    return await db.getAllAsync('SELECT * FROM registrations WHERE isSynced = 0', []);
  } catch (error) {
    console.error("Get Unsynced Error:", error);
    return [];
  }
};

export const markSynced = async (id: string) => {
  try {
    const db = await getDb();
    await db.runAsync('UPDATE registrations SET isSynced = 1 WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error("Mark Synced Error:", error);
    return false;
  }
};
