from mongoclient import users
from bson.objectid import ObjectId

class Player():
    def __init__(self, name: str, team_id: str, game_id: str):
        self.id = ObjectId()
        self.team_id = ObjectId(team_id)
        users.insert_one({"_id": self.id, "name": name,"hand":[],"trick_count":0,
                          "score":0,"card":None,"bet":0,"min_bet":2, "team_id": team_id, "game_id": game_id})
    
