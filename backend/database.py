import os
import re
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables from backend/.env (ignored on Vercel — set in dashboard)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.environ.get("MONGODB_URI", "")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI environment variable is not set. "
        "Add it in Vercel Dashboard → Project → Settings → Environment Variables."
    )

# Robustly encode the password even if it contains special chars like '@', '#', etc.
# Parses: scheme://username:password@host  where password may itself contain '@'
def _encode_mongo_uri(uri: str) -> str:
    """
    Safely encode the password in a MongoDB URI, handling passwords that
    contain special characters like '@', '#', '/', etc.

    Strategy: split on '://' to get the authority part, then find the
    FIRST ':' to separate username from 'password@host'. The host is
    everything after the LAST '@', and the password is everything between
    the first ':' and that last '@'.
    """
    try:
        # Split off the scheme (mongodb:// or mongodb+srv://)
        m = re.match(r'^(mongodb(?:\+srv)?://)(.+)$', uri)
        if not m:
            return uri
        scheme, rest = m.groups()

        # rest is now: username:password@host/...
        colon_idx = rest.index(':')          # first colon separates user from pass
        username = rest[:colon_idx]
        after_user = rest[colon_idx + 1:]   # password@host/...

        # The host starts after the LAST '@'
        last_at = after_user.rfind('@')
        if last_at == -1:
            return uri  # no '@' found — URI is already in a weird state

        password = after_user[:last_at]
        host = after_user[last_at + 1:]

        if '%' not in password:             # not already percent-encoded
            password = quote_plus(password)

        return f"{scheme}{username}:{password}@{host}"
    except Exception as e:
        print(f"Warning: Could not encode MongoDB URI: {e}")
    return uri

MONGODB_URI = _encode_mongo_uri(MONGODB_URI)

# Setup MongoDB client and database
client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
db = client.get_database("pharmalink")

def get_dataframe_from_mongo(collection_name: str) -> pd.DataFrame:
    """
    Fetches all documents from a MongoDB collection and converts them
    to a Pandas DataFrame, dropping the MongoDB internal '_id' field.
    """
    collection = db[collection_name]
    documents = list(collection.find())
    if not documents:
        return pd.DataFrame()
    
    df = pd.DataFrame(documents)
    if "_id" in df.columns:
        df = df.drop(columns=["_id"])
    return df

def db_load_users() -> dict:
    """
    Loads all user credentials and details from the MongoDB 'users' collection
    and returns them mapped by username.
    """
    users = {}
    for user in db.users.find():
        user_record = dict(user)
        if "_id" in user_record:
            user_record.pop("_id")
        users[user_record["username"].lower()] = user_record
    return users

def db_save_user(username: str, user_data: dict):
    """
    Saves or updates a user document in the MongoDB 'users' collection.
    """
    username_lower = username.lower()
    user_data["username"] = username_lower
    db.users.replace_one({"username": username_lower}, user_data, upsert=True)
