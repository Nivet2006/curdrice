import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('attendance.db');

export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS registrations (
          id TEXT PRIMARY KEY,
          eventId TEXT,
          studentName TEXT,
          usn TEXT,
          email TEXT,
          isPresent INTEGER DEFAULT 0,
          markedAt INTEGER,
          isSynced INTEGER DEFAULT 1
        );`,
        [],
        () => resolve(true),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const saveRegistrations = (registrations: any[]) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      registrations.forEach(reg => {
        tx.executeSql(
          'INSERT OR REPLACE INTO registrations (id, eventId, studentName, usn, email, isPresent, markedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [reg.id, reg.event_id, reg.student_name, reg.usn, reg.email, reg.is_present ? 1 : 0, reg.marked_at ? new Date(reg.marked_at).getTime() : null, 1]
        );
      });
    }, reject, () => resolve(true));
  });
};

export const markPresentLocally = (usn: string, eventId: string) => {
  const now = Date.now();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE registrations SET isPresent = 1, markedAt = ?, isSynced = 0 WHERE usn = ? AND eventId = ?',
        [now, usn, eventId],
        () => resolve(now),
        (_, error) => { reject(error); return false; }
      );
    }, reject);
  });
};

export const getUnsyncedRecords = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM registrations WHERE isSynced = 0',
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => { reject(error); return false; }
      );
    });
  });
};

export const markSynced = (id: string) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql('UPDATE registrations SET isSynced = 1 WHERE id = ?', [id], () => resolve(true), (_, error) => { reject(error); return false; });
    });
  });
};
