import os
import json
import pandas as pd
from database import db, MONGODB_URI

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def import_csvs():
    print(f"Connecting to MongoDB database at: {MONGODB_URI.split('@')[-1]}")
    
    # 1. Import pharmacies
    pharmacies_path = os.path.join(DATA_DIR, "pharmacies.csv")
    if os.path.exists(pharmacies_path):
        print("Importing pharmacies.csv...")
        df = pd.read_csv(pharmacies_path)
        records = df.to_dict(orient="records")
        db.pharmacies.drop()
        db.pharmacies.insert_many(records)
        print(f"Successfully imported {len(records)} pharmacies.")
    else:
        print("Warning: pharmacies.csv not found.")

    # 2. Import stock
    stock_path = os.path.join(DATA_DIR, "stock.csv")
    if os.path.exists(stock_path):
        print("Importing stock.csv...")
        df = pd.read_csv(stock_path)
        records = df.to_dict(orient="records")
        db.stock.drop()
        db.stock.insert_many(records)
        print(f"Successfully imported {len(records)} stock items.")
    else:
        print("Warning: stock.csv not found.")

    # 2b. Import real_medicine_catalog
    catalog_path = os.path.join(DATA_DIR, "real_medicine_catalog.csv")
    if os.path.exists(catalog_path):
        print("Importing real_medicine_catalog.csv...")
        df = pd.read_csv(catalog_path)
        records = df.to_dict(orient="records")
        db.real_medicine_catalog.drop()
        db.real_medicine_catalog.insert_many(records)
        print(f"Successfully imported {len(records)} catalog items.")
    else:
        print("Warning: real_medicine_catalog.csv not found.")

    # 3. Import sales transactions
    sales_path = os.path.join(DATA_DIR, "sales_transactions.csv")
    if os.path.exists(sales_path):
        print("Importing sales_transactions.csv...")
        df = pd.read_csv(sales_path)
        records = df.to_dict(orient="records")
        db.sales_transactions.drop()
        
        # Batch insert to avoid driver timeout or memory constraints
        chunk_size = 5000
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            db.sales_transactions.insert_many(chunk)
        print(f"Successfully imported {len(records)} sales transactions.")
    else:
        print("Warning: sales_transactions.csv not found.")

    # 4. Import users
    db.users.drop()
    if os.path.exists(USERS_FILE):
        print("Importing users.json...")
        with open(USERS_FILE) as f:
            users_dict = json.load(f)
        records = list(users_dict.values())
        db.users.insert_many(records)
        print(f"Successfully imported {len(records)} user accounts.")
    else:
        print("users.json not found. Seeding default user database structure...")
        import bcrypt
        import datetime
        
        def hash_pw(plain):
            return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()
            
        users = []
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        if os.path.exists(pharmacies_path):
            df_pharm = pd.read_csv(pharmacies_path)
            for _, row in df_pharm.iterrows():
                username = row["pharmacy_id"].lower()
                users.append({
                    "username": username,
                    "password_hash": hash_pw("pharma123"),
                    "role": "pharmacy",
                    "pharmacy_id": row["pharmacy_id"],
                    "pharmacy_name": row["pharmacy_name"],
                    "created_at": now,
                    "last_login_at": None,
                    "last_login_ip": None,
                    "active": True,
                })
        
        # Append Admin user
        users.append({
            "username": "admin",
            "password_hash": hash_pw("admin123"),
            "role": "admin",
            "pharmacy_id": None,
            "pharmacy_name": "Head Office",
            "created_at": now,
            "last_login_at": None,
            "last_login_ip": None,
            "active": True,
        })
        
        db.users.insert_many(users)
        print(f"Successfully seeded {len(users)} user accounts in MongoDB.")

if __name__ == "__main__":
    import_csvs()
