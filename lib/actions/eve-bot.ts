'use server'

import { createClient } from '../supabase/server'
import natural from 'natural'

// Lightweight Singleton Model for Vercel/Next.js memory-mapping
let classifier: any = null;

function getEveNLP() {
  if (classifier) return classifier;
  
  // Boot Bayesian NLP Inference Model
  classifier = new natural.BayesClassifier();
  
  // Topic: Give QR
  classifier.addDocument('can you give me my qr code', 'QR');
  classifier.addDocument('i need the ticket for the event', 'QR');
  classifier.addDocument('show me my pass', 'QR');
  classifier.addDocument('my ticket please', 'QR');
  classifier.addDocument('i want to check in', 'QR');

  // Topic: Past Events
  classifier.addDocument('what events have i completed', 'PAST_EVENTS');
  classifier.addDocument('show my past attendance', 'PAST_EVENTS');
  classifier.addDocument('previous events i went to', 'PAST_EVENTS');
  classifier.addDocument('where did i go last month', 'PAST_EVENTS');
  classifier.addDocument('what did i do', 'PAST_EVENTS');

  // Topic: Upcoming / Registered
  classifier.addDocument('what am i registered for', 'MY_EVENTS');
  classifier.addDocument('my upcoming events', 'MY_EVENTS');
  classifier.addDocument('events i signed up for', 'MY_EVENTS');
  classifier.addDocument('show my tickets', 'MY_EVENTS');
  classifier.addDocument('where am i going', 'MY_EVENTS');
  classifier.addDocument('the events i am attending', 'MY_EVENTS');

  // Topic: Explore New Events
  classifier.addDocument('what is happening on campus', 'EXPLORE');
  classifier.addDocument('are there any new events coming up', 'EXPLORE');
  classifier.addDocument('find me something to do', 'EXPLORE');
  classifier.addDocument('explore new activities', 'EXPLORE');
  classifier.addDocument('any new parties or fests', 'EXPLORE');

  // Topic: Profile / Username
  classifier.addDocument('who am i', 'PROFILE');
  classifier.addDocument('what is my usn', 'PROFILE');
  classifier.addDocument('show my profile info', 'PROFILE');
  classifier.addDocument('which department am i in', 'PROFILE');
  classifier.addDocument('my student details', 'PROFILE');
  
  // Topic: Username Config
  classifier.addDocument('change my username', 'USERNAME');
  classifier.addDocument('set up username', 'USERNAME');
  classifier.addDocument('update username', 'USERNAME');
  classifier.addDocument('create username', 'USERNAME');

  // Topic: Help
  classifier.addDocument('help me please', 'HELP');
  classifier.addDocument('what can you do for me', 'HELP');
  classifier.addDocument('commands', 'HELP');

  // Topic: Hello
  classifier.addDocument('hi', 'HELLO');
  classifier.addDocument('hello there', 'HELLO');
  classifier.addDocument('hey bot', 'HELLO');
  classifier.addDocument('good morning', 'HELLO');
  classifier.addDocument('hola', 'HELLO');
  classifier.addDocument('heya', 'HELLO');
  classifier.addDocument('hiii', 'HELLO');
  classifier.addDocument('sup', 'HELLO');
  classifier.addDocument('yo', 'HELLO');
  classifier.addDocument('greetings', 'HELLO');

  classifier.train();
  return classifier;
}

export async function fetchEveBotGreeting(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('full_name, username').eq('id', userId).single()
  const name = profile ? profile.full_name : 'there'
  
  const suggestions = [
    "🎫 Give my QR pass", 
    "🚀 Explore new events", 
    "✅ My registered events", 
    "🕰️ My past events", 
    "🪪 Show my profile"
  ]
  
  return `Hi, **${name}**! ✨\n\nI am Helen, your intelligent Club-Eve assistant. I can natively understand what you want without rigid commands.\n\nTry clicking one of the interactions below or simply talk to me naturally!\n[SUGGESTIONS=${JSON.stringify(suggestions)}]`
}

export async function setStudentUsername(userId: string, requestedUsername: string): Promise<{success: boolean, error?: string}> {
  const supabase = await createClient()
  const cleanUsername = requestedUsername.toLowerCase().trim()
  
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
    return { success: false, error: 'Username must be 3-20 characters, using only letters, numbers, and underscores.' }
  }

  const { data: existing } = await supabase.from('profiles').select('id').eq('username', cleanUsername)
  if (existing && existing.length > 0 && existing[0].id !== userId) {
    return { success: false, error: 'Username is already taken by someone else!' }
  }

  const { error } = await supabase.from('profiles').update({ username: cleanUsername }).eq('id', userId)
  if (error) return { success: false, error: 'Database error updating username.' }
  
  return { success: true }
}

export type ChatHistory = {
  role: 'bot' | 'user'
  content: string
}[]

export async function processEveBotMessage(message: string, userId: string, history: ChatHistory = []): Promise<string> {
  const supabase = await createClient()
  const lowerMsg = message.toLowerCase()

  // Execute NLP Inference
  const nlpBrain = getEveNLP()
  const classifications = nlpBrain.getClassifications(lowerMsg)
  
  // Evaluate Bayes Confidence Model. If it's a random string, probability tends to be flat across arrays,
  // but if it fits a model, it rockets up. A simple heuristic is relying on the top result.
  const nlpIntent = classifications.length > 0 ? classifications[0].label : 'UNKNOWN'

  // 1. Fetch user context
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
  
  if (!profile) return "I'm having trouble retrieving your profile data right now."

  // 2. Check Conversational Context (Stateful logic)
  if (history.length > 0) {
    const lastBotMsg = history.reverse().find(msg => msg.role === 'bot')?.content || ''
    
    // Check if we are in the "Which event QR?" context
    if (lastBotMsg.includes("Which event do you need the QR code for?")) {
      const { data: registrations } = await supabase
        .from('registrations')
        .select('qr_token, events(title, event_date, club_name)')
        .eq('student_id', userId)

      if (!registrations || registrations.length === 0) {
        return "You have no registered events, so I can't pull up a QR code."
      }

      // Search for semantic match
      const matches = registrations.filter((r: any) => r.events.title.toLowerCase().includes(lowerMsg))
      
      if (matches.length > 0) {
        const hit = matches[0] as any
        const payload = {
          eventName: hit.events.title,
          club: hit.events.club_name,
          date: hit.events.event_date,
          qrToken: hit.qr_token,
          studentName: profile.full_name,
          usn: profile.usn
        }
        return `[QR_CARD=${JSON.stringify(payload)}]`
      } else {
        return "I couldn't find a registered event matching that exact name. Try asking for your registered events first to see the precise names!"
      }
    }
  }

  // 3. Command: Give QR
  if (nlpIntent === 'QR' || lowerMsg.includes('qr')) {
    const { data: registrations } = await supabase
      .from('registrations')
      .select('events(title, event_date, status)')
      .eq('student_id', userId)
      
    let suggestions: string[] = []
    
    if (registrations && registrations.length > 0) {
       const now = new Date()
       now.setHours(0, 0, 0, 0)
       
       const threeDaysFromNow = new Date()
       threeDaysFromNow.setDate(now.getDate() + 3)
       threeDaysFromNow.setHours(23, 59, 59, 999)
       
       const relevantEvents = registrations.map((r: any) => r.events).filter((e: any) => {
         const d = new Date(e.event_date)
         return d >= now && d <= threeDaysFromNow && e.status !== 'completed'
       })
       
       suggestions = relevantEvents.map((e: any) => e.title)
    }

    if (suggestions.length > 0) {
      return `Which event do you need the QR code for? Please select from your recent upcoming events below, or type the precise name.\n[SUGGESTIONS=${JSON.stringify(suggestions)}]`
    }

    return "Which event do you need the QR code for? Please reply with the exact event name."
  }

  // 4. Command: Past Events
  if (nlpIntent === 'PAST_EVENTS' || lowerMsg.includes('past event') || lowerMsg.includes('previous events') || lowerMsg.includes('completed event')) {
    const { data: registrations } = await supabase
      .from('registrations')
      .select('events(title, event_date, status, club_name)')
      .eq('student_id', userId)

    if (!registrations) return "You haven't attended any events yet."

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const past = registrations
      .map(r => r.events as any)
      .filter(e => {
        const eventDate = new Date(e.event_date)
        return eventDate < now || e.status === 'completed'
      })

    if (past.length === 0) {
      return "You haven't attended any past events. Time to start participating!"
    }

    const tableHeader = '| Event Title | Organizer | Date |\n|---|---|---|'
    const tableRows = past.map((e: any) => `| **${e.title}** | *${e.club_name}* | ${new Date(e.event_date).toLocaleDateString()} |`).join('\n')
    return `You have securely registered for and attended ${past.length} past event(s):\n\n${tableHeader}\n${tableRows}`
  }

  // 5. Command: Registered Events (Upcoming)
  if (nlpIntent === 'MY_EVENTS' || lowerMsg.includes('registered') || (lowerMsg.includes('my') && lowerMsg.includes('event'))) {
    const { data: registrations } = await supabase
      .from('registrations')
      .select('events(title, event_date, status, club_name)')
      .eq('student_id', userId)

    if (!registrations || registrations.length === 0) {
      return "It looks like you haven't registered for any events yet. You can find exciting upcoming events on your dashboard!"
    }

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcoming = registrations
      .map(r => r.events as any)
      .filter(e => {
        const eventDate = new Date(e.event_date)
        return eventDate >= now && e.status !== 'completed'
      })

    if (upcoming.length === 0) {
      return "You have attended events in the past, but you don't have any upcoming registrations right now."
    }

    const tableHeader = '| Event Title | Organizer | Date |\n|---|---|---|'
    const tableRows = upcoming.map((e: any) => `| **${e.title}** | *${e.club_name}* | ${new Date(e.event_date).toLocaleDateString()} |`).join('\n')
    const formatList = `${tableHeader}\n${tableRows}`

    return `You are currently registered for ${upcoming.length} upcoming event(s):\n\n${formatList}\n\nDon't forget to ask me to \`give qr\` when you're ready to check in!`
  }

  // 6. Command: Upcoming campus events (Explore)
  if (nlpIntent === 'EXPLORE' || lowerMsg.includes('upcoming') || lowerMsg.includes('new') || lowerMsg.includes('explore')) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch user's registered events first
    const { data: userRegs } = await supabase.from('registrations').select('event_id').eq('student_id', userId)
    const registeredIds = userRegs?.map(r => r.event_id) || []

    const { data: allEvents } = await supabase
      .from('events')
      .select('id, title, event_date, club_name')
      .eq('status', 'upcoming')
      .gte('event_date', today.toISOString())
      .order('event_date', { ascending: true })

    const unregisteredEvents = (allEvents || [])
      .filter((e: any) => !registeredIds.includes(e.id))
      .slice(0, 5)

    if (unregisteredEvents.length === 0) {
      return "There aren't any new upcoming events at the moment that you aren't already registered for. Keep an eye out for announcements!"
    }

    const tableHeader = '| Event Title | Organizer | Date |\n|---|---|---|'
    const tableRows = unregisteredEvents.map((e: any) => `| **${e.title}** | *${e.club_name}* | ${new Date(e.event_date).toLocaleDateString()} |`).join('\n')
    const formatList = `${tableHeader}\n${tableRows}`

    return `Here are some of the next upcoming events on campus that you haven't checked out yet:\n\n${formatList}\n\nYou can register for these safely via your dashboard!`
  }

  // 7. Command: Profile extraction
  if (nlpIntent === 'PROFILE' || lowerMsg.includes('profile') || lowerMsg.includes('my info') || lowerMsg.includes('who am i') || lowerMsg.includes('usn')) {
    return `Here are your details:\n- **Name**: ${profile.full_name}\n- **USN**: ${profile.usn}\n- **Username**: ${profile.username ? `@${profile.username}` : '*Not Set*'}\n- **Department**: ${profile.department}\n- **Role**: ${profile.role?.toUpperCase()}`
  }

  // 8. Command: Change Username
  if (nlpIntent === 'USERNAME' || lowerMsg.includes('username')) {
    return `You can claim or change your unique \`@username\` right here directly in the chat!\n[USERNAME_CARD]`
  }

  // 8. Command: Help and Capabilities
  if (nlpIntent === 'HELP' || lowerMsg.includes('help') || lowerMsg.includes('what can you do') || lowerMsg.includes('commands')) {
    return "I am Helen, your intelligent Event Assistant! Try these precise commands:\n\n| Command | Action |\n|---|---|\n| \`give qr\` | Extracts your secure check-in QR code. |\n| \`upcoming events\` | Explores new events happening on campus. |\n| \`my registered events\` | Lists valid upcoming reservations. |\n| \`my past events\` | Lists events you previously registered for. |\n| \`my profile\` | Reports your authenticated session data. |"
  }

  // 9. Command: Hello / Onboarding
  if (nlpIntent === 'HELLO' || lowerMsg === 'hi' || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
    const suggestions = [
      "🎫 Give my QR pass", 
      "🚀 Explore new events", 
      "✅ My registered events", 
      "🕰️ My past events", 
      "🪪 Show my profile"
    ]
    return `Hi, **${profile.full_name}**! ✨\n\nI am Helen, your intelligent Club-Eve assistant. I can natively understand what you want without rigid commands.\n\nTry clicking one of the interactions below or simply talk to me naturally!\n[SUGGESTIONS=${JSON.stringify(suggestions)}]`
  }

  return "I'm still learning! 🧠 Ask me about your 'registered events', 'past events', or ask me to 'give qr'."
}
