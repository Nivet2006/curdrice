// NATIVE APP/android/AttendanceApp.kt
// This is the native Android implementation based on the technical breakdown.

package com.clubeve.attendance

import android.content.Context
import androidx.room.*
import io.github.jan_tennert.supabase.SupabaseClient
import kotlinx.coroutines.flow.Flow

// 1. Entity
@Entity(tableName = "registrations")
data class RegistrationEntity(
    @PrimaryKey val id: String,
    val eventId: String,
    val studentName: String,
    val usn: String,
    val email: String,
    val isPresent: Boolean = false,
    val markedAt: Long? = null,
    val isSynced: Boolean = true
)

// 2. DAO
@Dao
interface RegistrationDao {
    @Query("SELECT * FROM registrations WHERE eventId = :eventId")
    fun getByEvent(eventId: String): Flow<List<RegistrationEntity>>

    @Upsert
    suspend fun upsert(items: List<RegistrationEntity>)

    @Query("UPDATE registrations SET isPresent = 1, markedAt = :time, isSynced = 0 WHERE usn = :usn AND eventId = :eventId")
    suspend fun markPresent(usn: String, eventId: String, time: Long)

    @Query("SELECT * FROM registrations WHERE isSynced = 0")
    suspend fun getUnsynced(): List<RegistrationEntity>

    @Query("UPDATE registrations SET isSynced = 1 WHERE id = :id")
    suspend fun markSynced(id: String)
}

// 3. Database
@Database(entities = [RegistrationEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun registrationDao(): RegistrationDao
}
