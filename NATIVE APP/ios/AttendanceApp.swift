// NATIVE APP/ios/AttendanceApp.swift
// This is the native iOS implementation based on the technical breakdown.

import Foundation
import SwiftData
import Supabase

@Model
class Registration {
    @Attribute(.unique) var id: String
    var eventId: String
    var studentName: String
    var usn: String
    var email: String
    var isPresent: Bool = false
    var markedAt: Date?
    var isSynced: Bool = true

    init(id: String, eventId: String, studentName: String, usn: String, email: String) {
        self.id = id
        self.eventId = eventId
        self.studentName = studentName
        self.usn = usn
        self.email = email
    }
}

class AttendanceRepository {
    var modelContext: ModelContext
    let supabase = SupabaseClient(supabaseURL: URL(string: "YOUR_URL")!,
                                  supabaseKey: "YOUR_ANON_KEY")

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func markPresent(usn: String, eventId: String) async throws {
        // 1. Instant local write
        let descriptor = FetchDescriptor<Registration>(
            predicate: #Predicate { $0.usn == usn && $0.eventId == eventId }
        )
        if let reg = try modelContext.fetch(descriptor).first {
            reg.isPresent = true
            reg.markedAt = Date()
            reg.isSynced = false
            try modelContext.save()
        }

        // 2. Sync if possible (simplified logic)
    }
}
