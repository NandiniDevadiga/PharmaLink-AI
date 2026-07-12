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
    try:
        # Match scheme://user:pass@host — password is everything between first ':' after user and last '@' before host
        m = re.match(r'^(mongodb(?:\+srv)?://)([^:]+):(.+)@([^@]+)$', uri)
        if m:
            scheme, username, password, host = m.groups()
            if '%' not in password:  # not already encoded
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
