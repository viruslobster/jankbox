#!/usr/bin/bash

function cleanup() {
    kill $pid1 $pid2
    echo
    echo "Stopped client and server"
}
trap cleanup INT

npx webpack --watch --mode development &
pid1=$!

cd ./server && go build -o ../ && cd ../
./jankbox &
pid2=$!

wait $pid1
wait $pid2
