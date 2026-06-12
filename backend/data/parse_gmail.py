import mailbox
import pandas as pd
import re

def parse_gmail_mbox(mbox_path="data/raw/gmail.mbox",
                     save_path="data/processed/gmail_legit.csv"):

    print("Reading mbox file... this may take a minute.")
    mbox = mailbox.mbox(mbox_path)

    records = []
    for i, message in enumerate(mbox):

        # Skip emails marked as spam by Gmail
        labels = message.get("X-Gmail-Labels", "")
        if "Spam" in labels or "Trash" in labels:
            continue

        # Get subject
        subject = message.get("subject", "") or ""

        # Get body text
        body = ""
        if message.is_multipart():
            for part in message.walk():
                if part.get_content_type() == "text/plain":
                    try:
                        body = part.get_payload(decode=True).decode(
                            errors="ignore")
                        break
                    except:
                        pass
        else:
            try:
                body = message.get_payload(decode=True).decode(
                    errors="ignore")
            except:
                body = str(message.get_payload())

        # Clean up
        text = f"{subject} {body}".strip()
        text = re.sub(r'\s+', ' ', text)[:2000]  # limit length

        if len(text) > 20:
            records.append({
                "text":  text,
                "url":   "",
                "label": 0   # 0 = legitimate
            })

        if i % 500 == 0:
            print(f"  Processed {i} emails...")

    df = pd.DataFrame(records)
    df.to_csv(save_path, index=False)
    print(f"\nDone! Saved {len(df)} legitimate emails to {save_path}")
    return df

if __name__ == "__main__":
    parse_gmail_mbox()