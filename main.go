package main

import (
	"fmt"
	"encoding/json"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
)

type Player struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
}

type Game struct {
	mu      sync.Mutex
	Players []*Player `json:"players"`
	Msgs    []string  `json:"msgs"`
}
// type UserRequest struct {
// 	UserName string `json:"userName"`
	
// }
// type UserResponse struct {
// 	Id string `json:"id"`
// }

func (g *Game) nextPlayerId() int {
	var max int
	for _, player := range g.Players {
		if player.Id > max {
			max = player.Id
		}
	}
	return max + 1
}

func (g *Game) ClearMessages() {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.Msgs = g.Msgs[:0]
	g.dumpGame()
}

func (g *Game) AddPlayer(name string) (int) {
	g.mu.Lock()
	defer g.mu.Unlock()
	var id int;
	id = g.nextPlayerId()
	g.Players = append(g.Players, &Player{
		Id:   id,
		Name: name,
	})
	g.dumpGame()
	return id
}

func (g *Game) SendMessage(msg string) {
	g.mu.Lock()
	defer g.mu.Unlock()

	g.Msgs = append(g.Msgs, msg)
	g.dumpGame()
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
	g.dumpGame()
}

func (g *Game) dumpGame() {
	filename := "game.json"

	f, err := os.OpenFile(filename, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
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
	data, err := ioutil.ReadFile("game.json")
	if err != nil {
		panic(err)
	}
	globalGame = &Game{}
	err = json.Unmarshal(data, globalGame)
	if err != nil {
		panic(err)
	}
	return globalGame
}

func getGameHandler(w http.ResponseWriter, r *http.Request) {
	game := getGame()
	j, _ := json.Marshal(game)
	w.Write(j)
	game.ClearMessages()
}

func scoreHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "only POST requests allowed", http.StatusBadRequest)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}

	update := make(map[int]int)
	for key, values := range r.Form {
		if len(values) != 1 {
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}
		valueStr := values[0]
		value, err := strconv.Atoi(valueStr)
		if err != nil {
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}

		idStr := strings.TrimPrefix(key, "player_")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "bad form", http.StatusBadRequest)
			return
		}
		update[id] = value
	}
	game := getGame()
	game.UpdateScores(update)

	http.Redirect(w, r, "/taskmaster.html", http.StatusSeeOther)
}

func sendMsgHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "only POST requests allowed", http.StatusBadRequest)
		return
	}
	msg, err := io.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	game := getGame()
	game.SendMessage(string(msg))
}

func addPlayerHandler(w http.ResponseWriter, r *http.Request) {
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
	for key, values := range r.Form {
		fmt.Println("here")
		fmt.Println(key, "and ", values)
	}
	names, ok := r.Form["userName"]
	fmt.Println(ok)
	if !ok || len(names) != 1 {
		fmt.Println("/api/addplayer: too many names or empty")
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	name := names[0 ]

	game := getGame()
	var id int;
	id = game.AddPlayer(name)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(strconv.Itoa(id)))
	
}

func main() {
	// http.Handle("/", http.FileServer(http.Dir("./www")))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "www/build/index.html")
    })

    fs := http.FileServer(http.Dir("www/build/static/"))
    http.Handle("/static/", http.StripPrefix("/static", fs))

	http.HandleFunc("/api/getgame", getGameHandler)
	http.HandleFunc("/api/score", scoreHandler)
	http.HandleFunc("/api/sendmsg", sendMsgHandler)
	http.HandleFunc("/api/addplayer", addPlayerHandler)
	http.ListenAndServe(":8080", nil)
}
