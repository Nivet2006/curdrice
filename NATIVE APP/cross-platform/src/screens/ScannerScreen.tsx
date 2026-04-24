import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation, useRoute } from '@react-navigation/native';
import { X, RefreshCcw, UserCheck, List } from 'lucide-react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('attendance.db');

export const ScannerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params as { eventId: string };

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    lookupStudent(data);
  };

  const lookupStudent = (usn: string) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM registrations WHERE usn = ? AND eventId = ?',
        [usn, eventId],
        (_, { rows: { _array } }) => {
          if (_array.length > 0) {
            setStudentInfo(_array[0]);
          } else {
            Alert.alert('Not Found', `No student found with USN: ${usn} for this event.`);
            setScanned(false);
          }
        }
      );
    });
  };

  const markPresent = () => {
    const now = Date.now();
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE registrations SET isPresent = 1, markedAt = ?, isSynced = 0 WHERE usn = ? AND eventId = ?',
        [now, studentInfo.usn, eventId],
        () => {
          Alert.alert('Success', `${studentInfo.studentName} marked as present.`);
          setScanned(false);
          setStudentInfo(null);
        }
      );
    });
  };

  if (hasPermission === null) return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.container}><Text>No access to camera</Text></View>;

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.overlay}>
        <View style={styles.topActions}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Attendance', { eventId })} style={styles.iconBtn}>
            <List size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {!scanned && <View style={styles.scanTarget} />}

        {scanned && studentInfo && (
          <View style={styles.resultCard}>
            <UserCheck size={40} color="#000" />
            <Text style={styles.studentName}>{studentInfo.studentName}</Text>
            <Text style={styles.studentUsn}>{studentInfo.usn}</Text>
            
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.rescanBtn} onPress={() => { setScanned(false); setStudentInfo(null); }}>
                <RefreshCcw size={20} color="#666" />
                <Text style={styles.rescanText}>Rescan</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmBtn} onPress={markPresent}>
                <Text style={styles.confirmText}>Mark Present</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topActions: {
    position: 'absolute',
    top: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 50,
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  resultCard: {
    backgroundColor: '#fff',
    width: '90%',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    bottom: 50,
    position: 'absolute',
  },
  studentName: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 15,
  },
  studentUsn: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  rescanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
  },
  rescanText: {
    fontWeight: 'bold',
    color: '#666',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 15,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
