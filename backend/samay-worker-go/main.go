package main

import (
	"log"
	"samay-worker-go/cmd"
	"sync"
	"time"
)

func main() {
	worker, err := cmd.NewWorker(2)
	if err != nil {
		log.Fatal(err)
	}

	worker.Start()

	wg := &sync.WaitGroup{}

	wg.Add(1)

	go func() {
		counter := 0
		for {

			worker.Submit(func() {
				log.Println("hello: ", counter)
				counter++
			})
			time.Sleep(time.Second)
		}

	}()
	wg.Wait()

}
