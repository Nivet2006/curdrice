import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SearchBar } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('attendance.db');

export const AttendanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params as { eventId: string };
  
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM registrations WHERE eventId = ? ORDER BY studentName ASC',
        [eventId],
        (_, { rows: { _array } }) => {
          setStudents(_array);
          const present = _array.filter(s => s.isPresent).length;
          setStats({ total: _array.length, present });
        }
      );
    });
  };

  const togglePresence = (item: any) => {
    const newState = item.isPresent ? 0 : 1;
    const now = newState ? Date.now() : null;
    
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE registrations SET isPresent = ?, markedAt = ?, isSynced = 0 WHERE id = ?',
        [newState, now, item.id],
        () => loadData()
      );
    });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.itemCard, item.isPresent && styles.itemCardPresent]}
      onPress={() => togglePresence(item)}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.studentName}</Text>
        <Text style={styles.itemUsn}>{item.usn}</Text>
      </View>
      
      {item.isPresent ? (
        <CheckCircle2 size={24} color="#000" />
      ) : (
        <Circle size={24} color="#ccc" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance List</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <FlatList
        data={students}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
  },
  itemCardPresent: {
    backgroundColor: '#f0fff4',
    borderColor: '#c6f6d5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemUsn: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
