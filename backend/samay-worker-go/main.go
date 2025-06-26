package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"samay-worker-go/cmd"
	"samay-worker-go/models"
	"sync"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"github.com/robfig/cron/v3"
)

func main() {
	db, err := sqlx.Connect("postgres", "host=192.168.29.206 user=postgres password=admin dbname=homelab sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	cronParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	wp, err := cmd.NewWorkerPool(2)
	if err != nil {
		log.Fatal(err)
	}
	wp.Start()

	query := "select * from scheduler.schedules"
	schedules := []models.Schedule{}
	for {
		now := time.Now()
		err = db.Select(&schedules, query)
		if err != nil {
			log.Fatal(err)
		}

		for _, schedule := range schedules {
			sch, err := cronParser.Parse(schedule.CronExpression)
			if err != nil {
				log.Println(err)
				continue
			}

			next := sch.Next(now.Add(time.Second * -60)) // TODO: fix this
			if next.Year() != now.Year() {
				continue
			}
			if next.Month() != now.Month() {
				continue
			}
			if next.Day() != now.Day() {
				continue
			}
			if next.Hour() != now.Hour() {
				continue
			}
			if next.Minute() != now.Minute() {
				continue
			}
			log.Println("will execute schedule: ", schedule.CronExpression)
			wp.Submit(func() {
				backupWork(schedule)
			})
		}
		time.Sleep(time.Second * 60)
	}

}

func backupWork(schedule models.Schedule) {
	cmd := exec.Command("rsync", "-rPavh", schedule.SrcPath, schedule.DestPath)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Start()
	if err != nil {
		log.Fatal(err)
	}
	err = cmd.Wait()
	if err != nil {
		log.Println("error while running rsync: ", err)
		return
	}
	log.Println("backup success: ", schedule.SrcPath, " -> ", schedule.DestPath, " , exitcode: ", cmd.ProcessState.ExitCode())
}

func worker3() {

	cronParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)

	schedule, err := cronParser.Parse("35 20 * * *")
	if err != nil {
		log.Fatal(err)
	}
	t, err := time.Parse(time.RFC3339, "2025-06-24T20:35:59+05:30")
	if err != nil {
		log.Fatal(err)
	}
	t = t.Add(time.Second * -60) // TODO: fix this
	next := schedule.Next(t)
	fmt.Println(next)

}

func worker2() {
}

func worker() {
	worker, err := cmd.NewWorkerPool(2)
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
