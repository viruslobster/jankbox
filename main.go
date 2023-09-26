package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
	"github.com/viruslobster/jankbox/quiplash"
)

const backupGameFile = "/tmp/game.json"
const (
	HostBetView    = "HostBetView"
	HostScoresView = "HostScoresView"
	PlayerBetView  = "BetView"
)

func playersChangedEvent(players []*Player) *Event {
	playerNames := make([]string, len(players))
	for i, player := range players {
		playerNames[i] = player.Name
	}
	return &Event{
		Name: "PlayersChanged",
		Data: map[string]any{"players": playerNames},
	}
}

func setViewEvent(name string) *Event {
	return &Event{
		Name: "SetView",
		Data: map[string]any{"name": name},
	}
}

type Event struct {
	Name string
	Data map[string]any
}

func (e *Event) Marshal() (string, error) {
	buff := bytes.NewBuffer([]byte{})
	encoder := json.NewEncoder(buff)
	err := encoder.Encode(e.Data)
	if err != nil {
		return "", err
	}
	sb := strings.Builder{}
	sb.WriteString(fmt.Sprintf("event: %s\n", e.Name))
	sb.WriteString(fmt.Sprintf("data: %v\n", buff.String()))
	return sb.String(), nil
}

type Player struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
	View  string `json:"view"`

	events chan *Event
}

func (p *Player) SetView(view string) {
	p.View = view
	if p.events != nil {
		p.events <- setViewEvent(view)
	}
}

func newBetGame() BetGame {
	return BetGame{
		BetsById: make(map[int]int),
	}
}

type BetGame struct {
	BetsById map[int]int
}

type Game struct {
	mu         sync.Mutex
	hostEvents chan *Event

	HostView string    `json:"hostView"`
	Players  []*Player `json:"players"`
	BetGame  BetGame   `json:"betGame"`
}

func (g *Game) setHostView(view string) {
	g.HostView = view
	if g.hostEvents != nil {
		g.hostEvents <- setViewEvent(view)
	}
}

func (g *Game) Play() {
	fmt.Println("Waiting for players and host to connect...")
	ticker := time.NewTicker(1 * time.Second)
	for range ticker.C {
		if len(g.Players) >= 2 {
			ticker.Stop()
			break
		}
	}

	fmt.Println("Starting game")
	for {
		fmt.Println("Placing bets")
		g.setHostView(HostBetView)

		for _, player := range g.Players {
			player.SetView(PlayerBetView)
		}
		g.BetGame = newBetGame()

		ticker = time.NewTicker(1 * time.Second)
		timer := time.NewTimer(10 * time.Second)

	loop:
		for {
			select {
			case <-ticker.C:
				for _, player := range g.Players {
					_, ok := g.BetGame.BetsById[player.Id]
					if !ok {
						continue loop
					}
				}
				fmt.Println("all bets are in")
				break loop
			case <-timer.C:
				for _, player := range g.Players {
					_, ok := g.BetGame.BetsById[player.Id]
					if !ok {
						g.BetGame.BetsById[player.Id] = 0
					}
				}
				fmt.Println("time for betting is up")
				break loop
			}
		}
		fmt.Println("Bets placed")

		for _, player := range g.Players {
			if g.BetGame.BetsById[player.Id] == 50 {
				player.Score++
			}
		}
		g.setHostView(HostScoresView)

		time.Sleep(10 * time.Second)
	}

}

func (g *Game) nextPlayerId() int {
	var max int
	for _, player := range g.Players {
		if player.Id > max {
			max = player.Id
		}
	}
	return max + 1
}

func (g *Game) playerById(id int) *Player {
	for _, player := range g.Players {
		if player.Id == id {
			return player
		}
	}
	return nil
}

func (g *Game) PlaceBet(playerId, bet int) {
	g.BetGame.BetsById[playerId] = bet
	go g.dumpGame()
}

func (g *Game) ConnectHost() chan *Event {
	if g.hostEvents != nil {
		close(g.hostEvents)
	}
	g.hostEvents = make(chan *Event, 1)
	g.hostEvents <- playersChangedEvent(g.Players)
	return g.hostEvents
}

func (g *Game) ConnectPlayer(id int) (chan *Event, error) {
	player := g.playerById(id)
	if player == nil {
		return nil, fmt.Errorf("Invalid player id: %d", id)
	}
	if player.events != nil {
		close(player.events)
	}
	player.events = make(chan *Event, 1)
	return player.events, nil
}

func (g *Game) AddPlayer(name string) int {
	g.mu.Lock()
	defer g.mu.Unlock()
	var id int
	id = g.nextPlayerId()
	g.Players = append(g.Players, &Player{
		Id:   id,
		Name: name,
	})
	go func() {
		g.dumpGame()
		g.hostEvents <- playersChangedEvent(g.Players)
	}()
	return id
}

func (g *Game) UpdateScores(update map[int]int) {
	g.mu.Lock()
	defer g.mu.Unlock()

	for id, delta := range update {
		for _, player := range g.Players {
			if player.Id == id {
				player.Score += delta
				break
			}
		}
	}
	go g.dumpGame()
}

func (g *Game) dumpGame() {
	g.mu.Lock()
	defer g.mu.Unlock()

	f, err := os.OpenFile(backupGameFile, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	data, err := json.MarshalIndent(g, "", "\t")
	if err != nil {
		panic(err)
	}
	f.Write(data)
}

var globalGame *Game

func getGame() *Game {
	if globalGame != nil {
		return globalGame
	}
	globalGame = &Game{}
	data, err := ioutil.ReadFile(backupGameFile)
	if err != nil {
		fmt.Printf("could not read file at %s\n", backupGameFile)
		return globalGame
	}
	err = json.Unmarshal(data, globalGame)
	if err != nil {
		panic(err)
	}
	return globalGame
}

func addPlayerHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("addPlayerHandler")
	if r.Method != "POST" {
		http.Error(w, "only POST requests allowed", http.StatusBadRequest)
		return
	}
	if err := r.ParseForm(); err != nil {
		fmt.Println("/api/addplayer: could not parse form")
		fmt.Println(err)
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	names, ok := r.Form["userName"]
	if !ok || len(names) != 1 {
		fmt.Println("/api/addplayer: too many names or empty")
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	name := names[0]

	game := getGame()
	var id int
	id = game.AddPlayer(name)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(strconv.Itoa(id)))
}

// Parses a GET request url that looks like "/api/connect/player/{player_id}"
func parsePlayerId(url string) (int, error) {
	parts := strings.Split(url, "/")
	if len(parts) < 5 || parts[4] == "" {
		return 0, fmt.Errorf("Bad url: %s", url)
	}
	playerIdStr := parts[4]
	playerId, err := strconv.Atoi(playerIdStr)
	if err != nil {
		return 0, fmt.Errorf("Bad player id: %s", playerIdStr)
	}
	return playerId, nil
}

func connectPlayerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Server side events not supported", http.StatusInternalServerError)
		return
	}
	playerId, err := parsePlayerId(r.URL.Path)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	playerEvents, err := getGame().ConnectPlayer(playerId)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	fmt.Printf("Connected player %d\n", playerId)

	for event := range playerEvents {
		payload, err := event.Marshal()
		if err != nil {
			fmt.Println(err)
			break
		}
		_, err = fmt.Fprint(w, payload)
		if err != nil {
			break
		}
		flusher.Flush()
	}
}

func connectHostHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Server side events not supported", http.StatusInternalServerError)
		return
	}
	flusher.Flush()

	hostEvents := getGame().ConnectHost()
	fmt.Println("Connected Host")
	for event := range hostEvents {
		payload, err := event.Marshal()
		if err != nil {
			fmt.Println(err)
			break
		}
		_, err = fmt.Fprint(w, payload)
		if err != nil {
			fmt.Println(err)
			break
		}
		flusher.Flush()
	}
}

type PlayerBetRequest struct {
	PlayerId int `json:"playerId"`
	Bet      int `json:"bet"`
}

func playerBetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "only POST requests allowed", http.StatusBadRequest)
		return
	}
	decoder := json.NewDecoder(r.Body)
	var request PlayerBetRequest
	err := decoder.Decode(&request)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	getGame().PlaceBet(request.PlayerId, request.Bet)
}

func playerScoresHandler(w http.ResponseWriter, r *http.Request) {
	scores := make(map[string]int)
	for _, player := range getGame().Players {
		scores[player.Name] = player.Score
	}
	payload, err := json.Marshal(scores)
	if err != nil {
		panic(err)
	}
	w.WriteHeader(http.StatusOK)
	w.Write(payload)
}

func main() {
	go getGame().Play()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "www/build/index.html")
	})

	fs := http.FileServer(http.Dir("www/build/static/"))
	http.Handle("/static/", http.StripPrefix("/static", fs))

	http.HandleFunc("/api/connect/player/", connectPlayerHandler)
	http.HandleFunc("/api/connect/host", connectHostHandler)
	http.HandleFunc("/api/addplayer", addPlayerHandler)
	http.HandleFunc("/api/player/bet", playerBetHandler)
	http.HandleFunc("/api/player/scores", playerScoresHandler)
	
	http.HandleFunc("/quiplash/player/episodeCreateAddPrompt", quiplash.AddEpisodeIdeaToListHandler)
	http.ListenAndServe(":8080", nil)
}
