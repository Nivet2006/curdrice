import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  const brevoApiKey = Deno.env.get("BREVO_API_KEY") || ""

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: queueItems, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .in("status", ["pending", "retry_wait"])
      .lte("next_attempt_at", new Date().toISOString())
      .order("priority", { ascending: true })
      .limit(50)

    if (fetchError) throw fetchError

    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ success: true, message: "No pending emails in queue" }), {
        headers: { "Content-Type": "application/json" }
      })
    }

    const priorityMap: Record<string, number> = {
      CRITICAL: 1,
      HIGH: 2,
      NORMAL: 3,
      LOW: 4
    }

    queueItems.sort((a: any, b: any) => {
      const pA = priorityMap[a.priority] || 99
      const pB = priorityMap[b.priority] || 99
      if (pA !== pB) return pA - pB
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    const batch = queueItems.slice(0, 10)

    for (const item of batch) {
      await supabase
        .from("email_queue")
        .update({ status: "processing", attempt_count: item.attempt_count + 1, last_attempt_at: new Date().toISOString() })
        .eq("id", item.id)

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
