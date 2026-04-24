import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Download, ChevronRight, Wifi, WifiOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { saveRegistrations } from '../lib/database';
import * as Network from 'expo-network';

export const EventListScreen = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkNetwork();
    fetchEvents();
  }, []);

  const checkNetwork = async () => {
    const state = await Network.getNetworkStateAsync();
    setIsOnline(state.isConnected);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: false });
      if (error) throw error;
      setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (eventId: string) => {
    Alert.alert('Caching Event', 'Downloading student list for offline use...');
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      await saveRegistrations(data);
      Alert.alert('Success', 'Event list cached offline.');
    } catch (error) {
      Alert.alert('Error', 'Failed to cache event list.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.downloadBtn} 
          onPress={() => handleDownload(item.id)}
          disabled={!isOnline}
        >
          <Download size={20} color={isOnline ? "#000" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.openBtn}
          onPress={() => navigation.navigate('Scanner', { eventId: item.id })}
        >
          <ChevronRight size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Select Event</Text>
        <View style={styles.statusBadge}>
          {isOnline ? (
            <Wifi size={16} color="green" />
          ) : (
            <WifiOff size={16} color="red" />
          )}
          <Text style={[styles.statusText, { color: isOnline ? 'green' : 'red' }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No events found.</Text>}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '900',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 20,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 15,
    marginBottom: 15,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  downloadBtn: {
    padding: 10,
  },
  openBtn: {
    padding: 5,
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});
