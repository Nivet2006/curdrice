import os
import sys
import time
import argparse
import socket
import requests
import urllib3.util.connection
from supabase import create_client, Client

# Force IPv4 resolution for Windows and Github Runner compatibility
urllib3.util.connection.allowed_gai_family = lambda: socket.AF_INET

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

HTML_TEMPLATE_FALLBACK = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Certificate</title></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:Arial,sans-serif;color:#171717;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f3;"><tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;">
<tr><td align="center" style="padding:42px 32px 28px;">
<a href="https://onepercentclub.nivet2006.in/" target="_blank"><img src="https://onepercentclub.nivet2006.in/nobgonepercent.png" alt="One Percent Club" width="220" style="display:block;width:220px;max-width:80%;height:auto;border:0;"></a>
</td></tr>
<tr><td style="padding:42px 48px 20px;">
<p style="margin:0 0 20px;font-size:16px;line-height:26px;">Hi {{name}},</p>
<p style="margin:0 0 18px;font-size:16px;line-height:26px;">Thank you for participating in <strong>{{event}}</strong>.</p>
<p style="margin:0 0 28px;font-size:16px;line-height:26px;color:#555555;">We truly appreciate your participation and enthusiasm. Your certificate is now ready to view.</p>
<table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 32px;"><tr><td align="center" style="background:#111111;">
<a href="{{certificate_url}}" target="_blank" style="display:inline-block;padding:15px 30px;font-size:13px;font-weight:bold;color:#ffffff;text-decoration:none;">VIEW MY CERTIFICATE</a>
</td></tr></table>
<p style="margin:0;font-size:15px;line-height:24px;font-weight:bold;">One Percent Club</p>
</td></tr>
</table>
</td></tr></table>
</body></html>"""

def get_supabase_client():
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("[WARN] Supabase credentials not found in environment. Database sync disabled.")
        return None
    return create_client(url, key)

def log_message(supabase, job_id, level, message, email=None, cert_name=None):
    timestamp = time.strftime("%H:%M:%S")
    prefix = f"[{timestamp}] [{level.upper()}]"
    full_msg = f"{prefix} {message}"
    print(full_msg, flush=True)

    if supabase and job_id:
        try:
            supabase.rpc("append_job_log", {
                "p_job_id": job_id,
                "p_level": level.lower(),
                "p_message": full_msg,
                "p_recipient_email": email,
                "p_certificate_name": cert_name
            }).execute()
        except Exception as e:
            print(f"  [ERROR Logging to Supabase]: {e}", flush=True)

def send_email_brevo(api_key, sender_name, sender_email, recipient_name, recipient_email, subject, html_content):
    payload = {
        "sender": {"name": sender_name, "email": sender_email},
        "to": [{"email": recipient_email, "name": recipient_name}],
        "subject": subject,
        "htmlContent": html_content,
        "textContent": f"Hi {recipient_name},\n\nYour certificate is ready to view.\n\nThank you!"
    }
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    return requests.post(BREVO_API_URL, headers=headers, json=payload, timeout=30)

def main():
    parser = argparse.ArgumentParser(description="Production Certificate Mailer Runner")
    parser.add_argument("--job-id", help="Supabase email_jobs UUID")
    parser.add_argument("--send", action="store_true", help="Send actual emails (default is dry run)")
    parser.add_argument("--only", help="Filter by specific email address")
    parser.add_argument("--delay", type=float, default=0.5, help="Delay between emails in seconds")
    args = parser.parse_args()

    supabase = get_supabase_client()
    job_id = args.job_id
    is_live = args.send

    job_data = None
    items = []

    # 1. Fetch Job and Items from Supabase if job-id provided
    if supabase and job_id:
        try:
            res = supabase.table("email_jobs").select("*").eq("id", job_id).execute()
            if res.data and len(res.data) > 0:
                job_data = res.data[0]
            else:
                print(f"[FATAL] Job {job_id} not found in database.")
                sys.exit(1)

            # Update job run details
            run_id = os.getenv("GITHUB_RUN_ID")
            server_url = os.getenv("GITHUB_SERVER_URL", "https://github.com")
            repo = os.getenv("GITHUB_REPOSITORY", "Nivet2006/curdrice")
            run_url = f"{server_url}/{repo}/actions/runs/{run_id}" if run_id else None

            supabase.table("email_jobs").update({
                "status": "running",
                "github_run_id": run_id,
                "github_run_url": run_url,
                "started_at": "now()",
                "last_heartbeat_at": "now()"
            }).eq("id", job_id).execute()

            # Fetch job items
            items_res = supabase.table("email_job_items").select("*").eq("job_id", job_id).execute()
            items = items_res.data or []

        except Exception as e:
            print(f"[ERROR Initializing Job]: {e}")
            sys.exit(1)

    log_message(supabase, job_id, "info", f"Starting Certificate Email Job (Live Send: {is_live})")

    # Fallback to local participants if no database job items
    if not items:
        log_message(supabase, job_id, "warning", "No job items found in database. Using static fallback participants.")
        items = [
            {"id": "demo-1", "certificate_id": "CERT-001", "recipient_name": "Amrutha P", "recipient_email": "amruthapammu81@gmail.com", "public_url": "https://pkpjuqtkzctqjbdmebgb.supabase.co/storage/v1/object/public/certificates/Amrutha%20P.pdf", "event_name": "One Percent Club", "status": "pending"},
            {"id": "demo-2", "certificate_id": "CERT-002", "recipient_name": "Anushka Mishra", "recipient_email": "manushka937@gmail.com", "public_url": "https://pkpjuqtkzctqjbdmebgb.supabase.co/storage/v1/object/public/certificates/Anushka%20Mishra.pdf", "event_name": "One Percent Club", "status": "pending"}
        ]

    if args.only:
        items = [item for item in items if item["recipient_email"].lower() == args.only.lower()]
        if not items:
            log_message(supabase, job_id, "error", f"No matching email found for filter: {args.only}")
            sys.exit(1)

    api_key = os.getenv("BREVO_API_KEY")
    if is_live and not api_key:
        err = "BREVO_API_KEY environment variable is missing."
        log_message(supabase, job_id, "error", err)
        if supabase and job_id:
            supabase.table("email_jobs").update({"status": "failed", "last_error": err}).eq("id", job_id).execute()
        sys.exit(1)

    sender_name = (job_data.get("sender_name") if job_data else None) or "One Percent Club"
    sender_email = (job_data.get("sender_email") if job_data else None) or "help@clubeve.nivet2006.in"
    template_html = (job_data.get("template_html") if job_data else None) or HTML_TEMPLATE_FALLBACK

    total = len(items)
    processed = 0
    success = 0
    failed = 0

    try:
        for idx, item in enumerate(items, 1):
            # Check for Cancellation from UI
            if supabase and job_id:
                check_res = supabase.table("email_jobs").select("status").eq("id", job_id).execute()
                if check_res.data and check_res.data[0].get("status") == "cancelled":
                    log_message(supabase, job_id, "warning", "Job cancellation requested by admin. Stopping dispatch.")
                    break

            name = item.get("recipient_name", "Participant")
            email = item.get("recipient_email", "")
            cert_id = item.get("certificate_id", "")
            cert_url = item.get("public_url", "")
            event_name = item.get("event_name", "One Percent Club")
            item_id = item.get("id")
            current_status = item.get("status")

            # IDEMPOTENCY CHECK: Skip if already sent
            if current_status == "sent":
                log_message(supabase, job_id, "info", f"[{idx}/{total}] Skipping {name} <{email}> — Already sent.", email, name)
                processed += 1
                success += 1
                continue

            log_message(supabase, job_id, "info", f"[{idx}/{total}] Processing {name} <{email}>", email, name)

            if not is_live:
                log_message(supabase, job_id, "info", f"  → DRY RUN (Simulated email to {email})", email, name)
                processed += 1
                success += 1
                if supabase and item_id:
                    supabase.table("email_job_items").update({"status": "sent", "processed_at": "now()"}).eq("id", item_id).execute()
            else:
                try:
                    formatted_html = template_html.replace("{{name}}", name)\
                        .replace("{{certificate_url}}", cert_url)\
                        .replace("{{certificate_id}}", cert_id)\
                        .replace("{{event}}", event_name)

                    subject = f"Your Certificate of Participation — {event_name}"
                    res = send_email_brevo(api_key, sender_name, sender_email, email, name, subject, formatted_html)

                    if 200 <= res.status_code < 300:
                        res_json = res.json()
                        msg_id = res_json.get("messageId") or res_json.get("id")
                        log_message(supabase, job_id, "success", f"  ✓ SENT to {email} (ID: {msg_id})", email, name)
                        processed += 1
                        success += 1
                        if supabase and item_id:
                            supabase.table("email_job_items").update({
                                "status": "sent",
                                "provider_message_id": str(msg_id),
                                "processed_at": "now()"
                            }).eq("id", item_id).execute()
                    else:
                        err_text = res.text
                        log_message(supabase, job_id, "error", f"  ✗ FAILED {res.status_code}: {err_text}", email, name)
                        processed += 1
                        failed += 1
                        if supabase and item_id:
                            supabase.table("email_job_items").update({
                                "status": "failed",
                                "error_message": f"Brevo HTTP {res.status_code}: {err_text}",
                                "processed_at": "now()"
                            }).eq("id", item_id).execute()

                except Exception as ex:
                    err_msg = str(ex)
                    log_message(supabase, job_id, "error", f"  ✗ EXCEPTION sending to {email}: {err_msg}", email, name)
                    processed += 1
                    failed += 1
                    if supabase and item_id:
                        supabase.table("email_job_items").update({
                            "status": "failed",
                            "error_message": err_msg,
                            "processed_at": "now()"
                        }).eq("id", item_id).execute()

            # Update Job Progress in DB
            if supabase and job_id:
                supabase.table("email_jobs").update({
                    "processed_count": processed,
                    "success_count": success,
                    "failed_count": failed,
                    "current_recipient": email,
                    "current_certificate": name,
                    "last_heartbeat_at": "now()"
                }).eq("id", job_id).execute()

            time.sleep(args.delay)

        # Job Completed
        final_status = "completed" if failed == 0 else ("completed" if success > 0 else "failed")
        log_message(supabase, job_id, "info", f"Job finished. Total: {total}, Success: {success}, Failed: {failed}")

        if supabase and job_id:
            supabase.table("email_jobs").update({
                "status": final_status,
                "completed_at": "now()",
                "last_heartbeat_at": "now()"
            }).eq("id", job_id).execute()

    except Exception as fatal_e:
        err_str = str(fatal_e)
        log_message(supabase, job_id, "error", f"Fatal Exception during runner execution: {err_str}")
        if supabase and job_id:
            supabase.table("email_jobs").update({
                "status": "failed",
                "last_error": err_str
            }).eq("id", job_id).execute()
        sys.exit(1)

if __name__ == "__main__":
    main()
