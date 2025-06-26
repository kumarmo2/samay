package cmd

import (
	"errors"
	"log"
)

type WorkerPool struct {
	parallelism int
	ch          chan func()
}

func NewWorker(parallelism int) (*WorkerPool, error) {
	if parallelism <= 0 {
		return nil, errors.New("parallelism must be greater than 0")
	}
	ch := make(chan func())
	return &WorkerPool{parallelism, ch}, nil
}

func (w *WorkerPool) Start() {
	go func() {
		for range w.parallelism {
			go func() {
				log.Println("worker started")
				// TODO: think of cancellation also. not very urgent though
				for f := range w.ch {
					log.Println("worker got an item ")
					f()
				}

			}()
		}
	}()
}

func (w *WorkerPool) Submit(f func()) {
	w.ch <- f
}
