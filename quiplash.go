package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

const episodeFile = "/tmp/episode.json"

type PlayerEpisodeCreateRequest struct {
	PlayerId   int `json:"playerId"`
	PromptIdea int `json:"prompt"`
}

func AddEpisodeIdeaToListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "only POST requests allowed", http.StatusBadRequest)
		return
	}
	decoder := json.NewDecoder(r.Body)
	var request PlayerEpisodeCreateRequest
	err := decoder.Decode(&request)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	fmt.Println(request.PromptIdea)
	writeEpisode(request)
	w.WriteHeader(http.StatusOK)

}
func writeEpisode(episode PlayerEpisodeCreateRequest) {

	f, err := os.OpenFile(episodeFile, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0755)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	data, err := json.MarshalIndent(episode, "", "\t")
	if err != nil {
		panic(err)
	}
	f.Write(data)
}
