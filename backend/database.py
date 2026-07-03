import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv

from urllib.parse import quote_plus

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb+srv://nandini:<db_password>@cluster0.aiyiciq.mongodb.net/")

# Safely URL-encode the password if it contains special characters (like '@')
if MONGODB_URI and "@" in MONGODB_URI:
    try:
        auth_part, host_part = MONGODB_URI.rsplit('@', 1)
        if '://' in auth_part:
            scheme, credentials = auth_part.split('://', 1)
            if ':' in credentials:
                username, password = credentials.split(':', 1)
                # Only quote if not already URL-encoded
                if '%' not in password:
                    MONGODB_URI = f"{scheme}://{username}:{quote_plus(password)}@{host_part}"
    except Exception as e:
        print(f"Warning: Could not automatically format MongoDB URI: {e}")

# Setup MongoDB client and database
client = MongoClient(MONGODB_URI)
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
