import pandas as pd

# Load Gmail legitimate dataset
df = pd.read_csv("data/processed/gmail_legit.csv")

# Fill missing values
df["text"] = df["text"].fillna("").astype(str)

# Extract URLs from email text
df["url"] = df["text"].str.extract(
    r'(https?://\S+)'
)

# Replace missing URLs with empty string
df["url"] = df["url"].fillna("")

# Ensure label exists
if "label" not in df.columns:
    df["label"] = 0

# Save updated legitimate dataset
df.to_csv(
    "data/processed/gmail_legit.csv",
    index=False
)

print("\n========== UPDATED GMAIL DATASET ==========")

print(df[["text", "url", "label"]].head())

print("\nShape:")

print(df.shape)

print("==========================================\n")