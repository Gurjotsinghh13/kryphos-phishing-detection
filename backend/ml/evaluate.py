# backend/data/build_datasets.py

import os
import re
import csv
import pandas as pd


def clean_text(text):

    if not isinstance(text, str):

        return ""

    # Remove HTML tags
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

    # Limit very large emails
    return text[:3000]


def load_dataset(path, label_value):

    try:

        df = pd.read_csv(
            path,
            encoding="latin-1",
            engine="python",
            on_bad_lines="skip",
            quoting=csv.QUOTE_NONE
        )

        print(f"\nLoading dataset: {path}")

        print("\nColumns:")

        print(df.columns.tolist())

        print("\nShape:")

        print(df.shape)

        # =====================================================
        # Detect Email Text Column
        # =====================================================

        possible_text_columns = [

            "text",
            "Text",

            "text_combined",

            "email",
            "Email",

            "body",
            "Body",

            "message",
            "Message",

            "Email Text",

            "CONTENT",
            "content",

            "Content"
        ]

        text_column = None

        for col in possible_text_columns:

            if col in df.columns:

                text_column = col

                break

        if text_column is None:

            print(f"\nSkipping {path}")

            print("No valid text column found")

            return None

        # =====================================================
        # Keep Only Email Text
        # =====================================================

        df = df[[text_column]].copy()

        df.columns = ["text"]

        # =====================================================
        # Clean Emails
        # =====================================================

        df["text"] = (
            df["text"]
            .astype(str)
            .apply(clean_text)
        )

        # Remove tiny emails
        df = df[
            df["text"].str.len() > 20
        ]

        # Remove duplicates
        df = df.drop_duplicates(
            subset=["text"]
        )

        # Add labels
        df["label"] = label_value

        print(f"\nLoaded rows: {len(df)}")

        return df

    except Exception as e:

        print(f"\nError loading dataset: {path}")

        print(e)

        return None


def build():

    frames = []

    # =====================================================
    # Legitimate Datasets
    # =====================================================

    legitimate_files = [

        "data/processed/gmail_legit.csv",

        "data/raw/enron.csv"
    ]

    for path in legitimate_files:

        if os.path.exists(path):

            df = load_dataset(
                path,
                0
            )

            if df is not None:

                frames.append(df)

        else:

            print(f"\nMissing file: {path}")

    # =====================================================
    # Phishing Datasets
    # =====================================================

    phishing_files = [

        "data/raw/CEAS08.csv",

        "data/raw/Ling.csv",

        "data/raw/Nazario.csv",

        "data/raw/Nigerian_Fraud.csv",

        "data/raw/phishing_email.csv",

        "data/raw/SpamAssasin.csv",

        "data/raw/Phishing_Emails.csv"
    ]

    for path in phishing_files:

        if os.path.exists(path):

            df = load_dataset(
                path,
                1
            )

            if df is not None:

                frames.append(df)

        else:

            print(f"\nMissing file: {path}")

    # =====================================================
    # Check Dataset Loading
    # =====================================================

    if len(frames) == 0:

        print("\nNo datasets loaded")

        return

    # =====================================================
    # Combine All Datasets
    # =====================================================

    combined = pd.concat(
        frames,
        ignore_index=True
    )

    # Remove duplicates
    combined = combined.drop_duplicates(
        subset=["text"]
    )

    # Shuffle
    combined = combined.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    # =====================================================
    # Separate Classes
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

    if len(phishing) == 0:

        raise Exception(
            "\nNo phishing emails loaded"
        )

    if len(legitimate) == 0:

        raise Exception(
            "\nNo legitimate emails loaded"
        )

    # =====================================================
    # Balance Dataset
    # =====================================================

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

    # Final shuffle
    final_df = final_df.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    # =====================================================
    # Remove duplicates again
    # =====================================================

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