from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["final"]
users_collection = db["users"]
