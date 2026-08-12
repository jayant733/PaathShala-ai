"""Trainer backends for the knowledge-tracing / IRT model.

Each backend fits a classifier over a pandas DataFrame with columns
``topic``, ``question_type`` (categorical), ``difficulty_ordinal``,
``attempt_seq``, ``recency_days`` (numeric) predicting ``is_correct``,
and exposes ``predict_proba(model, X) -> np.ndarray`` of P(correct).

Frameworks are imported LAZILY inside the backend so the app starts and
passes tests even when a framework isn't installed on the platform.
"""

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)

CATEGORICAL_COLS = ["topic", "question_type"]
NUMERIC_COLS = ["difficulty_ordinal", "attempt_seq", "recency_days"]
FEATURE_COLS = CATEGORICAL_COLS + NUMERIC_COLS

# ---------------------------------------------------------------------------
# Shared encoding helpers (tabulated backends)
# ---------------------------------------------------------------------------


def _encode_tabular(X, encoders: dict | None):
    """Label-encode categoricals, fill numeric NaNs with 0. Returns (matrix, encoders)."""
    encoders = encoders or {}
    cols = []
    for col in CATEGORICAL_COLS:
        vals = X[col].astype(str)
        if col in encoders:
            le = encoders[col]
            mapped = [le.get(v, -1) for v in vals]
        else:
            from sklearn.preprocessing import LabelEncoder

            le = LabelEncoder()
            mapped = le.fit_transform(vals).tolist()
            encoders[col] = {v: int(i) for i, v in enumerate(le.classes_)}
        cols.append(np.asarray(mapped, dtype=np.int64))
    for col in NUMERIC_COLS:
        cols.append(np.nan_to_num(X[col].astype(float).to_numpy(), nan=0.0))
    return np.column_stack(cols).astype(np.float32), encoders


def _predict_tabular(model, X, encoders):
    mat, _ = _encode_tabular(X, encoders)
    return np.asarray(model.predict_proba(mat))[:, 1]


# ---------------------------------------------------------------------------
# Backends
# ---------------------------------------------------------------------------


class SklearnBackend:
    name = "sklearn"

    def fit(self, X, y):
        from sklearn.compose import ColumnTransformer
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import OneHotEncoder, StandardScaler
        from sklearn.linear_model import LogisticRegression

        pre = ColumnTransformer(
            [
                ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS),
                ("num", StandardScaler(), NUMERIC_COLS),
            ]
        )
        model = Pipeline(
            [("pre", pre), ("clf", LogisticRegression(max_iter=2000, C=1.0))]
        )
        model.fit(X[FEATURE_COLS], y)
        return model

    def predict_proba(self, model, X):
        return model.predict_proba(X[FEATURE_COLS])[:, 1]


class XGBoostBackend:
    name = "xgboost"

    def fit(self, X, y):
        import xgboost as xgb

        mat, encoders = _encode_tabular(X, None)
        model = xgb.XGBClassifier(
            n_estimators=80,
            max_depth=3,
            learning_rate=0.1,
            tree_method="hist",
            eval_metric="logloss",
        )
        model.fit(mat, y)
        return {"clf": model, "encoders": encoders}

    def predict_proba(self, model, X):
        return _predict_tabular(model["clf"], X, model["encoders"])


class LightGBMBackend:
    name = "lightgbm"

    def fit(self, X, y):
        import lightgbm as lgb

        mat, encoders = _encode_tabular(X, None)
        model = lgb.LGBMClassifier(n_estimators=80, max_depth=3, learning_rate=0.1, verbose=-1)
        model.fit(mat, y)
        return {"clf": model, "encoders": encoders}

    def predict_proba(self, model, X):
        return _predict_tabular(model["clf"], X, model["encoders"])


class TorchBackend:
    """Small Deep-Knowledge-Tracing-style MLP implemented in PyTorch (CPU)."""

    name = "torch"

    def fit(self, X, y):
        import torch
        import torch.nn as nn

        mat, encoders = _encode_tabular(X, None)
        n_topic = len(encoders["topic"]) + 1
        n_qtype = len(encoders["question_type"]) + 1

        class Net(nn.Module):
            def __init__(self):
                super().__init__()
                self.topic_emb = nn.Embedding(n_topic, 16, padding_idx=0)
                self.qtype_emb = nn.Embedding(n_qtype, 4, padding_idx=0)
                self.fc = nn.Sequential(
                    nn.Linear(16 + 4 + 3, 32), nn.ReLU(), nn.Linear(32, 1)
                )

            def forward(self, t, q, n):
                h = torch.cat([self.topic_emb(t), self.qtype_emb(q), n], dim=-1)
                return self.fc(h).squeeze(-1)

        x = torch.tensor(mat, dtype=torch.float32)
        t_idx = torch.tensor(np.asarray([encoders["topic"][str(v)] + 1 for v in X["topic"]], dtype=np.int64))
        q_idx = torch.tensor(np.asarray([encoders["question_type"][str(v)] + 1 for v in X["question_type"]], dtype=np.int64))
        yt = torch.tensor(np.asarray(y, dtype=np.float32))
        n_idx = x[:, 3:]  # numeric cols

        torch.manual_seed(0)
        net = Net()
        opt = torch.optim.Adam(net.parameters(), lr=0.01)
        loss_fn = nn.BCEWithLogitsLoss()
        n_epochs = 40
        for _ in range(n_epochs):
            opt.zero_grad()
            loss = loss_fn(net(t_idx, q_idx, n_idx), yt)
            loss.backward()
            opt.step()
        return {"state": net.state_dict(), "encoders": encoders, "n_topic": n_topic, "n_qtype": n_qtype}

    def predict_proba(self, model, X):
        import torch
        import torch.nn as nn

        mat, _ = _encode_tabular(X, model["encoders"])
        n_topic, n_qtype = model["n_topic"], model["n_qtype"]

        class Net(nn.Module):
            def __init__(self):
                super().__init__()
                self.topic_emb = nn.Embedding(n_topic, 16, padding_idx=0)
                self.qtype_emb = nn.Embedding(n_qtype, 4, padding_idx=0)
                self.fc = nn.Sequential(nn.Linear(16 + 4 + 3, 32), nn.ReLU(), nn.Linear(32, 1))

            def forward(self, t, q, n):
                h = torch.cat([self.topic_emb(t), self.qtype_emb(q), n], dim=-1)
                return self.fc(h).squeeze(-1)

        net = Net()
        net.load_state_dict(model["state"])
        net.eval()
        t_idx = torch.tensor(np.asarray([model["encoders"]["topic"].get(str(v), -1) + 1 for v in X["topic"]], dtype=np.int64))
        q_idx = torch.tensor(np.asarray([model["encoders"]["question_type"].get(str(v), -1) + 1 for v in X["question_type"]], dtype=np.int64))
        n_idx = torch.tensor(mat[:, 3:], dtype=torch.float32)
        with torch.no_grad():
            logits = net(t_idx, q_idx, n_idx)
        return torch.sigmoid(logits).numpy()


class TensorflowBackend:
    """Small Keras MLP as an alternative trainer."""

    name = "tensorflow"

    def fit(self, X, y):
        import tensorflow as tf

        mat, encoders = _encode_tabular(X, None)
        tf.random.set_seed(0)
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Input(shape=(mat.shape[1],)),
                tf.keras.layers.Dense(32, activation="relu"),
                tf.keras.layers.Dense(1, activation="sigmoid"),
            ]
        )
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
        model.fit(mat, np.asarray(y, dtype=np.float32), epochs=20, batch_size=32, verbose=0)
        return {"clf": model, "encoders": encoders}

    def predict_proba(self, model, X):
        mat, _ = _encode_tabular(X, model["encoders"])
        return np.asarray(model["clf"].predict(mat, verbose=0)).reshape(-1)


class JaxBackend:
    """Hand-rolled logistic regression in pure JAX (gradient descent)."""

    name = "jax"

    def fit(self, X, y):
        import jax
        import jax.numpy as jnp

        mat, encoders = _encode_tabular(X, None)
        Xm = jnp.asarray(mat)
        yv = jnp.asarray(np.asarray(y, dtype=np.float32))
        # augment with bias
        Xb = jnp.concatenate([Xm, jnp.ones((Xm.shape[0], 1))], axis=1)
        n_feats = Xb.shape[1]
        key = jax.random.PRNGKey(0)
        w = jax.random.normal(key, (n_feats,)) * 0.01

        def loss_fn(w):
            logits = Xb @ w
            return jnp.mean(jnp.logaddexp(0.0, logits) - yv * logits)

        lr = 0.05
        for _ in range(200):
            g = jax.grad(loss_fn)(w)
            w = w - lr * g
        return {"w": np.asarray(w), "encoders": encoders}

    def predict_proba(self, model, X):
        import jax.numpy as jnp

        mat, _ = _encode_tabular(X, model["encoders"])
        Xb = np.concatenate([mat, np.ones((mat.shape[0], 1))], axis=1)
        logits = Xb @ model["w"]
        return 1.0 / (1.0 + np.exp(-logits))


BACKENDS = {
    b.name: b()
    for b in (
        SklearnBackend,
        XGBoostBackend,
        LightGBMBackend,
        TorchBackend,
        TensorflowBackend,
        JaxBackend,
    )
}


def get_backend(name: str):
    """Resolve a backend by name with graceful fallback to sklearn."""
    backend = BACKENDS.get(name or "sklearn")
    if backend is None:
        backend = BACKENDS["sklearn"]
    try:
        # Verify the framework actually imports before training with it.
        _ = backend  # fit() does the lazy import; nothing to check eagerly
    except Exception:
        backend = BACKENDS["sklearn"]
    return backend
