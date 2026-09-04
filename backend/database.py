"""
SentinelAI — Database Connection

Connects to MongoDB Atlas using PyMongo.
Loads the connection string from the .env file so credentials
are never hard-coded in source code.

Usage from other modules:
    from backend.database import get_logs_collection, test_connection

    collection = get_logs_collection()
    test_connection()  # raises on failure
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError

# ─── Load environment variables ─────────────────────────────────────────────
# .env lives in the project root (one level above backend/).
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

# ─── Read and validate MONGODB_URI ───────────────────────────────────────────
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is missing or empty. "
        "Add it to the .env file in the project root."
    )

# ─── Create the MongoDB client ──────────────────────────────────────────────
# serverSelectionTimeoutMS stops the app from hanging forever when Atlas
# is unreachable.  5 000 ms (5 seconds) is a reasonable default.
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)

# ─── Database and collection references ──────────────────────────────────────
db = client["sentinel_ai"]
logs_collection = db["logs"]


def get_logs_collection():
    """Return the 'logs' collection from the 'sentinel_ai' database."""
    return logs_collection


def test_connection() -> bool:
    """Ping MongoDB Atlas to verify the connection is alive.

    Returns True on success.
    Raises PyMongoError if the ping fails (e.g. timeout, auth failure, dns error).
    """
    try:
        client.admin.command("ping")
        return True
    except PyMongoError:
        raise
    except Exception as err:
        raise RuntimeError(
            f"Unexpected error while testing MongoDB connection: {err}"
        ) from err


# ─── Direct execution test ───────────────────────────────────────────────────
if __name__ == "__main__":
    try:
        test_connection()
        print("MongoDB connection successful")
    except Exception as err:
        print(f"MongoDB connection failed: {err}")
