from flask import Flask, request, jsonify
from mongoclient import users,games
from game import Game
from player import Player
from bson.objectid import ObjectId
import random
from flask_socketio import SocketIO,emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app,resources={r"/*":{"origins":"*"}})
socketio = SocketIO(app,cors_allowed_origins="*")

# sio.connect('http://127.0.0.1:5000/')

'''
Helper functions:

winning_card(winners) -> returns the winning card of a group of possible winning cards

check_trick_winner(cards) -> returns the winning card of a list of played cards using helper winning_card(winners)

check_invalid_bet(bet,player_id) -> returns if the player's bet amount is invalid or not

check_game_over(scores) -> returns if the game is over (boolean) and return winning team's players (None if not over)

update_min_and_pass_bet(scores,player_ids,game_id) -> updates min_bets and pass_bet based on scores
'''
def check_card_is_valid(card,game_id,player_id):
    trick_starter_id = games.find_one({"_id": ObjectId(game_id)})["trick_starter_id"]
    trick_suit_card = users.find_one({"_id": ObjectId(trick_starter_id)})["card"]
    if trick_suit_card == None: return True # first trick first card
    hand = users.find_one({"_id": ObjectId(player_id)})["hand"]
    in_hand = False
    for hand_card in hand:
        if card["name"] == hand_card["name"]: # card is in hand
            in_hand = True
    if not in_hand: return False # not in hand
    if player_id == trick_starter_id: # starter, there is no suit to be invalid
        return True
    else:
        round_suit = trick_suit_card["suit"]
    if card["suit"] == round_suit: # card played is same suit 
        return True
    else: # not same suit, check if card with same suit in hand
        for card in hand:
            if card["suit"] == round_suit: #card matches suit with round suit
                return False
        return True # wrong suit, but no suit of round suit in hand, so any card is legal


def winning_card(winners):
        highest = winners[0]["rank"]
        winner = winners[0]
        for card in winners:
            if highest < card["rank"]:
                highest = card["rank"]
                winner = card
        return winner

def check_trick_winner(cards):
    hearts = []
    for card in cards:
        suit = card["suit"]
        if suit == "Hearts":
                    hearts.append(card)
    if len(hearts) == 1: # 1 heart automatically wins
        return hearts[0]
    elif len(hearts) > 1: # multiple hearts check winner
        return winning_card(hearts)
    else: # no hearts
        return winning_card(cards)

def check_invalid_bet(bet, player_id):
    player = users.find_one({"_id":ObjectId(player_id)})
    return not (player["min_bet"] <= bet <= 13) 

def update_min_and_pass_bet(scores,player_ids,game_id):
    for i in range(len(scores)):
        score = scores[i]
        id = player_ids[i]
        if score > 60:
            users.update_one({"_id": ObjectId(id)}, {"$set": {"min_bet":6}})
            games.update_one({"_id": ObjectId(game_id)}, {"$set": {"pass_bet":15}})
        elif score > 50:
                users.update_one({"_id": ObjectId(id)}, {"$set": {"min_bet":5}})
                games.update_one({"_id": ObjectId(game_id)}, {"$set": {"pass_bet":14}})
        elif score > 40:
                users.update_one({"_id": ObjectId(id)}, {"$set": {"min_bet":4}})
                games.update_one({"_id": ObjectId(game_id)}, {"$set": {"pass_bet":13}})
        elif score > 30:
                users.update_one({"_id": ObjectId(id)}, {"$set": {"min_bet":3}})
                games.update_one({"_id": ObjectId(game_id)}, {"$set": {"pass_bet":12}})
     
def check_game_over(player_ids,game_id):
    p1,p2,p3,p4 = users.find_one({"_id": player_ids[0]}),users.find_one({"_id": player_ids[1]}),\
                  users.find_one({"_id": player_ids[2]}),users.find_one({"_id": player_ids[3]})   
    reach_41 = []
    game = games.find_one({"_id": ObjectId(game_id)})
    win_score = game["win_score"]
    if (p1["score"] >= win_score and p3["score"] >= 0):
        reach_41.append(p1)
    elif(p3["score"] >= win_score and p1["score"] >= 0):
        reach_41.append(p3)
    if (p2["score"] >= win_score and p4["score"] >= 0):
        reach_41.append(p2)
    elif(p4["score"] >= win_score and p2["score"] >= 0):
        reach_41.append(p4)

    if len(reach_41) == 1: # one winner
        games.update_one({"_id": ObjectId(game_id)}, {"$set": {"gameOver":True}})
        return True, reach_41[0]["team_id"]
    elif len(reach_41) > 1: # tie to above 40 change win score
        games.update_one({"_id": ObjectId(game_id)}, {"$inc": {"win_score":10}})
    return False, None  

def dealHands(game_id):
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    deck = game["deck"]
    hands = {}
    for id in player_ids:
        hand = []
        while len(hand) < 13:
            hand.append(deck.pop(random.randint(0,len(deck)-1)))
        hand = sorted(hand,key=lambda x: x["rank"])
        hand = sorted(hand,key=lambda x: x["suit"])
        player = users.update_one({"_id": id}, {"$set": {"hand":hand}})
        player = users.find_one({"_id": id})
        hands[player["_id"]] = hand
    return hands

def start_game(player_names):
     Game(player_names[0],player_names[1],player_names[2],player_names[3])

#start_game(["algis","srihari","charlie","jayson"])


def reset_deck(game_id):
    deck = []
    for rank in range(2,11):
        for suit in ["Hearts","Spades","Clubs","Diamonds"]:
            deck.append({"name": f"{rank} of {suit}","suit":suit,"rank":rank})
    royals = ["Jack","Queen","King","Ace"]
    for i in range(len(royals)):
        for suit in ["Hearts","Spades","Clubs","Diamonds"]:
            deck.append({"name": f"{royals[i]} of {suit}","suit":suit,"rank":i+11})
    random.shuffle(deck)
    games.update_one({"_id": ObjectId(game_id)}, {"$set":{"deck":deck}})

@app.patch("/game/join")
def join_game():
    join_info = request.get_json()
    name = join_info["player_name"]
    game_code = join_info["game_code"]
    game = games.find_one({"code": game_code})
    if not game:
        return {"game":False}
    else:
        player = Player(name,team_id=None,game_id=game["_id"])
        games.update_one({"_id":game["_id"]}, {"$set": {"players": game["players"] + [player]}})

@app.patch("/round/start/<game_id>")
def start_round(game_id):
    reset_deck(game_id)
    dealHands(game_id)
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    for id in player_ids:
         users.update_many({"_id":ObjectId(id)},{"$set": {"card": None, "bet":0, "trick_count":0}}) # set card back to none for nest trick
    return game_id


@app.get("/hand/<player_id>")
def show_hand(player_id):
    player = users.find_one({"_id":ObjectId(player_id)})
    return {"hand": player["hand"]}


@app.patch("/get-set-round-starter/<game_id>")
def get_round_starter(game_id):
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    for i in range(len(player_ids)):
        id = player_ids[i]
        if game["round_starter_id"] == id:
            games.update_one({"_id":ObjectId(game_id)}, {"$set":{"round_starter": player_ids[i+1]}})
            break
    return {"round_starter_id": game["round_starter_id"]}


@app.patch("/make-bet/<player_id>")
def make_bet(player_id):
    bet = request.get_json()["bet"]
    if check_invalid_bet(bet,player_id):
        bet = "Invalid Bet"
    users.update_one({"_id":ObjectId(player_id)}, {"$set":{"bet":bet}})
    player = users.find_one({"_id": ObjectId(player_id)})
    return {"bet": player["bet"]}


@app.get("/get-trick-starter/<game_id>")
def get_trick_starter(game_id):
    game = games.find_one({"_id":ObjectId(game_id)})
    return {"trick_starter_id": game["trick_starter_id"]}


@app.patch("/play-card/<player_id>")
def play_card(player_id):
    card = request.get_json()
    player = users.find_one({"_id":ObjectId(player_id)})
    users.update_one({"_id":ObjectId(player_id)}, {"$set": {"card": None}})
    game_id = player["game_id"]
    valid = check_card_is_valid(card,game_id,player_id)
    if valid:
        users.update_one({"_id":ObjectId(player_id)}, {"$set":{"card":card}})
        player = users.find_one({"_id":ObjectId(player_id)})
        for i in range(len(player["hand"])):
            card_in_hand = player["hand"][i]
            if card_in_hand["name"] == card["name"]:
                del player["hand"][i]
                users.update_one({"_id":ObjectId(player_id)}, {"$set":{"hand":player["hand"]}})    
                break
    return {"card": player["card"], "valid":valid} # will be None or last card played, False if invalid


@app.patch("/trick/end/<game_id>")
def end_trick(game_id):  
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    cards = []
    for id in player_ids:
        player = users.find_one({"_id": ObjectId(id)})
        cards.append(player["card"])
    winning_card = check_trick_winner(cards)
    trick_counts = {}
    for id in player_ids:
        player = users.find_one({"_id": ObjectId(id)})
        if (player["card"]["name"] == winning_card["name"]):
            users.update_one({"_id":ObjectId(id)},{"$inc": {"trick_count": 1}})
            games.update_one({"_id":ObjectId(game_id)},{"$set": {"trick_starter_id": id}}) # set winner as next starter
       
        updated_player = users.find_one({"_id": ObjectId(id)})
        trick_counts[str(id)] = updated_player["trick_count"]
    
    return trick_counts   


@app.patch("/round/end/<game_id>")
def end_round(game_id):
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    scores = []
    for id in player_ids:
        player = users.find_one({"_id": ObjectId(id)})
        scores.append(player["score"])
    
    update_min_and_pass_bet(scores,player_ids,game_id)

    gameOver,team_id= check_game_over(scores,player_ids,game_id)
    if gameOver:
        for id in player_ids:
            users.delete_one({"_id":id})
        games.delete_one({"_id": game_id})
    return {"gameOver": gameOver, "team_id":team_id}


@app.patch("/update_scores/<game_id>")
def update_game_scores(game_id):
    game = games.find_one({"_id":ObjectId(game_id)})
    player_ids = [game["p1"],game["p2"],game["p3"],game["p4"]]
    updated_scores = {}
    for id in player_ids:
        player = users.find_one({"_id": ObjectId(id)})
        player_bet = player["bet"]
        player_trick_count = player["trick_count"]
        cur_score = player["score"]
        if player_trick_count < player_bet:
            users.update_one({"_id": ObjectId(id)}, {"$set": {"score": int(cur_score) - int(player_bet)}})
            updated_scores[player["_id"]] = int(cur_score) - int(player_bet)
        elif player_trick_count >= player_bet:
            users.update_one({"_id": ObjectId(id)}, {"$set": {"score": int(cur_score) + int(player_bet)}})
            updated_scores[player["_id"]] = int(cur_score) + int(player_bet)
    return updated_scores


@app.get("/player/get-info/<player_id>")
def get_player_info(player_id):
    return users.find_one({{"_id":ObjectId(player_id)}})


@app.get("/game/get-info/<game_id>")
def get_game_info(game_id):
    return games.find_one({{"_id":ObjectId(game_id)}})


@app.route("/")
def status():
    return {"status": "App is Online", "version": "0.0.1"}


if __name__ == "__main__":
    app.run()

