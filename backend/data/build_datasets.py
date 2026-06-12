# backend/data/build_datasets.py

import os
import re
import csv
import pandas as pd


def clean_text(text):

    if not isinstance(text, str):

        return ""

    # Remove HTML
    text = re.sub(
        r"<[^>]+>",
        " ",
        text
    )

    # Remove extra spaces
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text[:3000]


def process_subject_body(df):

    subject_exists = "subject" in df.columns

    body_exists = "body" in df.columns

    if subject_exists and body_exists:

        df["subject"] = (
            df["subject"]
            .fillna("")
            .astype(str)
        )

        df["body"] = (
            df["body"]
            .fillna("")
            .astype(str)
        )

        df["text"] = (
            df["subject"] + " " + df["body"]
        )

        return df

    return None


def load_gmail_dataset(path):

    try:

        df = pd.read_csv(
            path,
            engine="python",
            on_bad_lines="skip",
            encoding="latin-1"
        )

        print(f"\nLoading Gmail Dataset: {path}")

        print(df.columns.tolist())

        df = df[
            ["text", "label"]
        ].copy()

        df["text"] = (
            df["text"]
            .astype(str)
            .apply(clean_text)
        )

        df["label"] = 0

        df = df[
            df["text"].str.len() > 20
        ]

        df = df.drop_duplicates(
            subset=["text"]
        )

        print(f"Loaded rows: {len(df)}")

        return df

    except Exception as e:

        print(f"\nError loading Gmail dataset")

        print(e)

        return None


def load_subject_body_dataset(path, label_override=None):

    try:

        df = pd.read_csv(
            path,
            engine="python",
            on_bad_lines="skip",
            encoding="latin-1",
            quoting=csv.QUOTE_NONE
        )

        print(f"\nLoading Dataset: {path}")

        print(df.columns.tolist())

        df = process_subject_body(df)

        if df is None:

            print("No subject/body columns found")

            return None

        df = df[
            ["text", "label"]
        ].copy()

        df["text"] = (
            df["text"]
            .astype(str)
            .apply(clean_text)
        )

        if label_override is not None:

            df["label"] = label_override

        df["label"] = (
            df["label"]
            .astype(int)
        )

        df = df[
            df["text"].str.len() > 20
        ]

        df = df.drop_duplicates(
            subset=["text"]
        )

        print(f"Loaded rows: {len(df)}")

        return df

    except Exception as e:

        print(f"\nError loading dataset: {path}")

        print(e)

        return None


def load_text_combined_dataset(path):

    try:

        df = pd.read_csv(
            path,
            engine="python",
            on_bad_lines="skip",
            encoding="latin-1",
            quoting=csv.QUOTE_NONE
        )

        print(f"\nLoading Dataset: {path}")

        print(df.columns.tolist())

        df = df[
            ["text_combined", "label"]
        ].copy()

        df.columns = [
            "text",
            "label"
        ]

        df["text"] = (
            df["text"]
            .astype(str)
            .apply(clean_text)
        )

        df["label"] = (
            df["label"]
            .astype(int)
        )

        df = df[
            df["text"].str.len() > 20
        ]

        df = df.drop_duplicates(
            subset=["text"]
        )

        print(f"Loaded rows: {len(df)}")

        return df

    except Exception as e:

        print(f"\nError loading text_combined dataset")

        print(e)

        return None


def build():

    frames = []

    # =====================================================
    # Gmail Legitimate Emails
    # =====================================================

    gmail_df = load_gmail_dataset(
        "data/processed/gmail_legit.csv"
    )

    if gmail_df is not None:

        frames.append(gmail_df)

    # =====================================================
    # Enron Legitimate Emails
    # =====================================================

    enron_df = load_subject_body_dataset(
        "data/raw/Enron.csv",
        label_override=0
    )

    if enron_df is not None:

        frames.append(enron_df)

    # =====================================================
    # CEAS08 Phishing
    # =====================================================

    ceas_df = load_subject_body_dataset(
        "data/raw/CEAS_08.csv",
        label_override=1
    )

    if ceas_df is not None:

        frames.append(ceas_df)

    # =====================================================
    # Nazario
    # =====================================================

    nazario_df = load_subject_body_dataset(
        "data/raw/Nazario.csv",
        label_override=1
    )

    if nazario_df is not None:

        frames.append(nazario_df)

    # =====================================================
    # Nigerian Fraud
    # =====================================================

    fraud_df = load_subject_body_dataset(
        "data/raw/Nigerian_Fraud.csv",
        label_override=1
    )

    if fraud_df is not None:

        frames.append(fraud_df)

    # =====================================================
    # SpamAssasin
    # =====================================================

    spam_df = load_subject_body_dataset(
        "data/raw/SpamAssasin.csv"
    )

    if spam_df is not None:

        frames.append(spam_df)

    # =====================================================
    # phishing_email.csv
    # =====================================================

    phishing_email_df = load_text_combined_dataset(
        "data/raw/phishing_email.csv"
    )

    if phishing_email_df is not None:

        frames.append(phishing_email_df)

    # =====================================================
    # Combine All
    # =====================================================

    combined = pd.concat(
        frames,
        ignore_index=True
    )

    combined = combined.drop_duplicates(
        subset=["text"]
    )

    combined = combined.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    # =====================================================
    # Balance Classes
    # =====================================================

    phishing = combined[
        combined["label"] == 1
    ]

    legitimate = combined[
        combined["label"] == 0
    ]

    print("\n========== BEFORE BALANCING ==========")

    print("Phishing Emails :", len(phishing))

    print("Legitimate Emails :", len(legitimate))

    print("======================================")

    min_count = min(
        len(phishing),
        len(legitimate)
    )

    phishing = phishing.sample(
        min_count,
        random_state=42
    )

    legitimate = legitimate.sample(
        min_count,
        random_state=42
    )

    final_df = pd.concat([
        phishing,
        legitimate
    ])

    final_df = final_df.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    final_df = final_df.drop_duplicates(
        subset=["text"]
    )

    # =====================================================
    # Save Final Dataset
    # =====================================================

    os.makedirs(
        "data/processed",
        exist_ok=True
    )

    final_df.to_csv(
        "data/processed/combined.csv",
        index=False
    )

    print("\n========== FINAL DATASET ==========")

    print(final_df["label"].value_counts())

    print(f"\nTotal Rows: {len(final_df)}")

    print("===================================")

    print(
        "\nSaved to data/processed/combined.csv"
    )


if __name__ == "__main__":

    build()