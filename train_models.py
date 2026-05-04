"""
Career Path Navigator - Model Training Script
Trains SVM, Decision Tree, and XGBoost on the career dataset
and saves serialized models for inference.
"""

import os
import sys
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "..", "dataset")
MODEL_DIR   = os.path.join(BASE_DIR, "..", "backend", "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_COLS = [
    "math", "science", "english", "arts", "commerce",
    "coding_skill", "communication", "creativity",
    "analytical", "leadership",
    "interest_tech", "interest_science", "interest_arts", "interest_business",
    "stress_tolerance",
]
TARGET_COL = "career_label"


def load_data():
    """Load dataset; generate it first if it doesn't exist."""
    csv_path = os.path.join(DATASET_DIR, "career_dataset.csv")
    if not os.path.exists(csv_path):
        log.info("Dataset not found – generating …")
        gen = os.path.join(DATASET_DIR, "generate_dataset.py")
        os.system(f"python {gen}")
    df = pd.read_csv(csv_path)
    log.info(f"Loaded {len(df)} rows, {df[TARGET_COL].nunique()} career classes")
    return df


def train_and_save():
    df = load_data()

    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    # Encode labels
    le = LabelEncoder()
    y_enc = le.fit_transform(y)

    # Scale features (SVM needs this; others benefit from it too)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y_enc, test_size=0.2, random_state=42, stratify=y_enc
    )

    models = {
        "svm": SVC(kernel="rbf", C=10, gamma="scale", probability=True, random_state=42),
        "decision_tree": DecisionTreeClassifier(max_depth=12, min_samples_leaf=3, random_state=42),
        "xgboost": XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric="mlogloss",
            random_state=42,
            verbosity=0,
        ),
    }

    results = {}
    for name, clf in models.items():
        log.info(f"Training {name} …")
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        acc = accuracy_score(y_test, preds)
        log.info(f"  {name} accuracy: {acc:.4f}")
        results[name] = acc

        # Save model
        path = os.path.join(MODEL_DIR, f"{name}.pkl")
        with open(path, "wb") as f:
            pickle.dump(clf, f)
        log.info(f"  Saved → {path}")

    # Save scaler and label encoder
    with open(os.path.join(MODEL_DIR, "scaler.pkl"), "wb") as f:
        pickle.dump(scaler, f)
    with open(os.path.join(MODEL_DIR, "label_encoder.pkl"), "wb") as f:
        pickle.dump(le, f)

    # Save feature column order
    with open(os.path.join(MODEL_DIR, "feature_cols.pkl"), "wb") as f:
        pickle.dump(FEATURE_COLS, f)

    log.info("\n=== Training complete ===")
    for name, acc in results.items():
        log.info(f"  {name:15s}: {acc*100:.2f}%")


if __name__ == "__main__":
    train_and_save()
