package main

import (
	"log"
	"os"
	"os/exec"
	"samay-worker-go/cmd"
	"samay-worker-go/models"
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
			log.Println(err)
			continue
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
		log.Println("error while running rsync: ", err)
		return
	}
	err = cmd.Wait()
	if err != nil {
		log.Println("error while running rsync: ", err)
		return
	}
	log.Println("backup success: ", schedule.SrcPath, " -> ", schedule.DestPath, " , exitcode: ", cmd.ProcessState.ExitCode())
}
