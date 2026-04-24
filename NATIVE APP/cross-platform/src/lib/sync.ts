import { supabase } from './supabase';
import { getUnsyncedRecords, markSynced } from './database';
import * as Network from 'expo-network';

export const syncOfflineData = async () => {
  const networkState = await Network.getNetworkStateAsync();
  if (!networkState.isConnected) return;

  const unsynced: any = await getUnsyncedRecords();
  if (unsynced.length === 0) return;

  console.log(`Syncing ${unsynced.length} records...`);

  for (const record of unsynced) {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          is_present: record.isPresent === 1,
          marked_at: record.markedAt ? new Date(record.markedAt).toISOString() : null
        })
        .eq('id', record.id);

      if (!error) {
        await markSynced(record.id);
      }
    } catch (e) {
      console.error('Sync failed for record:', record.id, e);
    }
  }
};

// Start a periodic sync (simple implementation)
export const startSyncService = () => {
  setInterval(syncOfflineData, 10000); // Check every 10 seconds
};
