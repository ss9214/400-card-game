from pymongo import MongoClient

client = MongoClient("mongodb+srv://username:password@cluster0.lpxpmgs.mongodb.net/?retryWrites=true&w=majority")
db = client["400Data"]
users = db["Users"]
games = db["Games"]
