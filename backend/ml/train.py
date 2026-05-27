# backend/ml/train.py
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import os
import json
import pickle
import pandas as pd

from preprocessing import TextCleaner

from sklearn.model_selection import (
    train_test_split,
    cross_val_score
)

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import (
    classification_report,
    roc_auc_score
)


def train_all_models():

    os.makedirs("ml/models", exist_ok=True)

    # =====================================================
    # Load Dataset
    # =====================================================

    df = pd.read_csv(
        "data/processed/combined.csv"
    )

    print("\n========== RAW DATASET ==========")

    print(df.head())

    print("\nColumns:")

    print(df.columns)

    print("\nShape:")

    print(df.shape)

    print("=================================\n")

    # =====================================================
    # Ensure Required Columns
    # =====================================================

    required_columns = [
        "text",
        "label"
    ]

    for col in required_columns:

        if col not in df.columns:

            raise Exception(
                f"Missing column: {col}"
            )

    # =====================================================
    # Fill Missing Values
    # =====================================================

    df["text"] = (
        df["text"]
        .fillna("")
        .astype(str)
    )

    # =====================================================
    # Create Combined Text
    # =====================================================

    df["combined"] = df["text"]

    # =====================================================
    # Remove Empty Rows
    # =====================================================

    df = df[
        df["combined"]
        .str.strip() != ""
    ]

    # =====================================================
    # Remove Duplicates
    # =====================================================

    df = df.drop_duplicates(
        subset=["combined"]
    )

    # =====================================================
    # Shuffle Dataset
    # =====================================================

    df = df.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    print("\n========== CLEANED DATASET ==========")

    print(df.shape)

    print("\nLabel Distribution:")

    print(
        df["label"]
        .value_counts()
    )

    print("\nAverage Text Length By Class:")

    print(
        df.groupby("label")["text"]
        .apply(
            lambda x: x.str.len().mean()
        )
    )

    print("=====================================\n")

    # =====================================================
    # Features and Labels
    # =====================================================

    X = df["combined"]

    y = df["label"]

    # =====================================================
    # Train Test Split
    # =====================================================

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    # =====================================================
    # TF-IDF Pipeline
    # =====================================================

    tfidf = Pipeline([

        ("cleaner", TextCleaner()),

        ("tfidf", TfidfVectorizer(

            max_features=10000,

            ngram_range=(1, 2),

            sublinear_tf=True,

            min_df=2
        ))
    ])

    # =====================================================
    # Models
    # =====================================================

    models = {

        "naive_bayes": Pipeline([

            ("features", tfidf),

            ("clf", MultinomialNB(
                alpha=0.1
            ))
        ]),

        "logistic_regression": Pipeline([

            ("features", tfidf),

            ("clf", LogisticRegression(

                C=1.0,

                max_iter=1000,

                class_weight="balanced"
            ))
        ]),

    }

    results = {}

    # =====================================================
    # Train Models
    # =====================================================

    for name, model in models.items():

        print(f"\nTraining {name} ...")

        # -------------------------------------------------
        # Train
        # -------------------------------------------------

        model.fit(
            X_train,
            y_train
        )

        # -------------------------------------------------
        # Cross Validation
        # -------------------------------------------------

        cv_scores = cross_val_score(

            model,

            X_train,

            y_train,

            cv=5,

            scoring="f1"
        )

        print(

            f"Cross-val F1: "

            f"{cv_scores.mean():.4f} "

            f"(+/- {cv_scores.std():.4f})"
        )

        # -------------------------------------------------
        # Predictions
        # -------------------------------------------------

        y_pred = model.predict(
            X_test
        )

        y_prob = model.predict_proba(
            X_test
        )[:, 1]

        # -------------------------------------------------
        # Metrics
        # -------------------------------------------------

        report = classification_report(

            y_test,

            y_pred,

            output_dict=True
        )

        roc_auc = roc_auc_score(

            y_test,

            y_prob
        )

        results[name] = {

            "precision":
                report["weighted avg"]["precision"],

            "recall":
                report["weighted avg"]["recall"],

            "f1_score":
                report["weighted avg"]["f1-score"],

            "roc_auc":
                roc_auc,

            "cv_f1_mean":
                cv_scores.mean(),

            "cv_f1_std":
                cv_scores.std()
        }

        # -------------------------------------------------
        # Save Model
        # -------------------------------------------------

        pickle.dump(

            model,

            open(
                f"ml/models/{name}.pkl",
                "wb"
            )
        )

        print(

            f"{name} | "

            f"AUC = {roc_auc:.4f} | "

            f"F1 = {report['weighted avg']['f1-score']:.4f}"
        )

    # =====================================================
    # Select Best Model
    # =====================================================

    best_model_name = max(

        results,

        key=lambda k:
            results[k]["roc_auc"]
    )

    best_model = pickle.load(

        open(
            f"ml/models/{best_model_name}.pkl",
            "rb"
        )
    )

    pickle.dump(

        best_model,

        open(
            "ml/models/best_model.pkl",
            "wb"
        )
    )

    # =====================================================
    # Save Evaluation
    # =====================================================

    with open(

        "ml/models/evaluation.json",

        "w"
    ) as f:

        json.dump(
            results,
            f,
            indent=2
        )

    print("\n========== TRAINING COMPLETE ==========")

    print(f"Best Model: {best_model_name}")

    print("=======================================\n")

    return results


if __name__ == "__main__":

    train_all_models()