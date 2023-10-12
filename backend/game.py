import random
from player import Player
from mongoclient import games
from bson.objectid import ObjectId

class Game():
    def __init__(self,n1,n2,n3,n4):
        self.deck = []
        self.code = ""
        for i in range(5):
            self.code += random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        self.id = ObjectId()
        team1_id = ObjectId()
        team2_id = ObjectId()
        self.p1 = Player(n1, team1_id, self.id)
        self.p2 = Player(n2, team2_id, self.id)
        self.p3 = Player(n3, team1_id, self.id)
        self.p4 = Player(n4, team2_id, self.id)
        games.insert_one({"_id":self.id, "p1":self.p1.id,"p2":self.p2.id,"p3":self.p3.id,
                          "p4":self.p4.id,"pass_bet":11, "gameOver":False,
                          "trick_starter_id":self.p1.id,"round_starter_id":self.p1.id, "win_score": 41, "code":self.code, "players":[]})

