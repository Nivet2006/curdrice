import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  const brevoApiKey = Deno.env.get("BREVO_API_KEY") || ""

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const url = new URL(req.url)
  const action = url.searchParams.get("action")

  if (action === "get-senders") {
    try {
      const response = await fetch("https://api.brevo.com/v3/senders", {
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey
        }
      })
      const resData = await response.json()
      return new Response(JSON.stringify(resData), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  if (action === "get-domains") {
    try {
      const response = await fetch("https://api.brevo.com/v3/senders/domains", {
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey
        }
      })
      const resData = await response.json()
      return new Response(JSON.stringify(resData), {
        headers: { "Content-Type": "application/json" }
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  if (action === "create-sender") {
    try {
      const body = await req.json()
      const response = await fetch("https://api.brevo.com/v3/senders", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      })
      const resData = await response.json()
      return new Response(JSON.stringify(resData), {
        headers: { "Content-Type": "application/json" },
        status: response.status
      })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  if (action === "delete-sender") {
    try {
      const senderId = url.searchParams.get("id")
      const response = await fetch(`https://api.brevo.com/v3/senders/${senderId}`, {
        method: "DELETE",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey
        }
      })
      return new Response(null, { status: response.status })
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }

  // Queue-processing logic
  try {
    // SECONDARY SAFETY SWITCH & ACTIVE WINDOW CHECK
    const { data: settings, error: settingsError } = await supabase
      .from("email_queue_settings")
      .select("*")
      .eq("id", 1)
      .single()

    if (settingsError) {
      console.warn("Could not read email_queue_settings:", settingsError.message)
    }

    if (settings && settings.enabled === false) {
      return new Response(
        JSON.stringify({
          success: true,
          enabled: false,
          processed: 0,
          message: "Email queue processing is disabled"
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Active Window Enforcement (Timezone-aware)
    if (settings && settings.pause_outside_active_hours) {
      const timeZone = settings.timezone || "Asia/Kolkata"
      const now = new Date()
      
      // Get day of week (0 = Sunday, 1 = Monday, ...) in target timezone
      const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "numeric" })
      const dayOfWeekStr = dayFormatter.format(now) // 1..7 (1=Sun, 2=Mon... in Intl) or 0..6
      const timeFormatter = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false })
      const currentTimeStr = timeFormatter.format(now).trim()

      const jsDay = now.getUTCDay() // fallback basic
      const activeDays: number[] = settings.active_days || [0,1,2,3,4,5,6]

      // Check active day
      if (!activeDays.includes(jsDay)) {
        return new Response(
          JSON.stringify({
            success: true,
            enabled: true,
            processed: 0,
            message: "Outside configured processing window: Day is inactive"
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      }

      // Check active hours window (handling midnight crossing)
      const fromTime = settings.active_from || "00:00"
      const untilTime = settings.active_until || "23:59"

      let isInsideHours = false
      if (fromTime <= untilTime) {
        isInsideHours = currentTimeStr >= fromTime && currentTimeStr <= untilTime
      } else {
        // Midnight crossing, e.g., 22:00 to 06:00
        isInsideHours = currentTimeStr >= fromTime || currentTimeStr <= untilTime
      }

      if (!isInsideHours) {
        return new Response(
          JSON.stringify({
            success: true,
            enabled: true,
            processed: 0,
            message: "Outside configured processing window: Outside active hours"
          }),
          { headers: { "Content-Type": "application/json" } }
        )
      }
    }

    const batchSize = settings?.batch_size || 10

    // Atomic claiming using claim_email_queue_batch RPC (FOR UPDATE SKIP LOCKED)
    const { data: claimedItems, error: claimError } = await supabase.rpc(
      "claim_email_queue_batch",
      { p_batch_size: batchSize }
    )

    if (claimError) throw claimError

    if (!claimedItems || claimedItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending emails in queue" }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    const batch = claimedItems

    for (const item of batch) {
      try {
        if (!brevoApiKey) {
          throw new Error("BREVO_API_KEY is not configured in Supabase Edge Function Secrets.")
        }

        const subject = getSubject(item.template_key, item.template_data)
        const htmlContent = getHtmlContent(item.template_key, item.template_data)

        if (!item.sender_email) {
          throw new Error("No configured sender snapshot found for this email.")
        }

        const brevoPayload: any = {
          sender: { name: item.sender_name || "Club Eve", email: item.sender_email },
          to: [{ email: item.recipient_email }],
          subject: subject,
          htmlContent: htmlContent
        }

        if (item.reply_to_email) {
          brevoPayload.replyTo = { email: item.reply_to_email }
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json"
          },
          body: JSON.stringify(brevoPayload)
        })

        const resData = await response.json()

        if (response.ok) {
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              provider_message_id: resData.messageId || null
            })
            .eq("id", item.id)

          await supabase.rpc("increment_daily_stats_sent")
        } else {
          const errorMessage = resData.message || response.statusText || "Brevo delivery failed"
          const isPermanent = response.status === 400 || response.status === 404 || response.status === 401

          if (isPermanent || item.attempt_count >= 5) {
            await supabase
              .from("email_queue")
              .update({
                status: "failed",
                failed_at: new Date().toISOString(),
                last_error: errorMessage
              })
              .eq("id", item.id)

            await supabase.rpc("increment_daily_stats_failed")
          } else {
            const nextAttempt = new Date()
            nextAttempt.setMinutes(nextAttempt.getMinutes() + (item.attempt_count * 2))

            await supabase
              .from("email_queue")
              .update({
                status: "retry_wait",
                next_attempt_at: nextAttempt.toISOString(),
                last_error: errorMessage
              })
              .eq("id", item.id)
          }
        }
      } catch (err: any) {
        const nextAttempt = new Date()
        nextAttempt.setMinutes(nextAttempt.getMinutes() + 5)

        await supabase
          .from("email_queue")
          .update({
            status: "retry_wait",
            next_attempt_at: nextAttempt.toISOString(),
            last_error: err.message
          })
          .eq("id", item.id)
      }
    }

    return new Response(JSON.stringify({ success: true, processed: batch.length }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})

function getSubject(templateKey: string, data: any): string {
  switch (templateKey) {
    case "registration_confirmation":
      return "Registration Confirmed: " + (data.eventName || "Event")
    case "new_event_published":
      return "New Event Announced: " + (data.eventName || "Event")
    case "event_cancelled":
      return "[IMPORTANT] Event Cancelled: " + (data.eventName || "Event")
    case "important_event_update":
      return "[UPDATE] Important changes to " + (data.eventName || "Event")
    case "waitlist_promoted":
      return "Good news! You are promoted from waitlist for " + (data.eventName || "Event")
    case "profile_update_approved":
      return "Your Profile Update Request has been Approved"
    case "profile_update_rejected":
      return "Your Profile Update Request has been Rejected"
    case "certificate_ready":
      return "Certificate Ready: " + (data.eventName || "Event")
    case "badge_earned":
      return "New Badge Unlocked: " + (data.badgeName || "Achievement")
    case "points_earned":
      return "You earned " + (data.points || 0) + " points!"
    case "account_verification":
      return "Verify your Club Eve Account"
    case "account_recovery":
      return "Reset your Club Eve Password"
    default:
      return "Notification from Club Eve"
  }
}

function getHtmlContent(templateKey: string, data: any): string {
  return "<div style=\"font-family: sans-serif; padding: 20px; color: #333;\">" +
         "<h2>Club Eve</h2>" +
         "<p>Hello " + (data.studentName || "there") + ",</p>" +
         "<p>Here is an update regarding your Club Eve account or events:</p>" +
         "<hr style=\"border: 0; border-top: 1px solid #eee;\" />" +
         "<div style=\"margin: 20px 0;\">" +
         JSON.stringify(data, null, 2) +
         "</div>" +
         "<hr style=" + "\"border: 0; border-top: 1px solid #eee;\"" + " />" +
         "<p style=\"font-size: 12px; color: #777;\">This is an automated notification. Please do not reply directly to this email.</p>" +
         "</div>";
}
