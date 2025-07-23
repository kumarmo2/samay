package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"samay-worker-go/cmd"
	"samay-worker-go/dtos"
	"samay-worker-go/models"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/robfig/cron/v3"
)

const runningBackupRunStatus int = 1
const completedBackupRunStatus int = 2

const scheduledBackupRunType = 1
const adhocBackupRunType int = 2

func doCronWork(backupWork *BackupWork) {
	cronParser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow)
	wp, err := cmd.NewWorkerPool(2)
	if err != nil {
		log.Fatal(err)
	}
	wp.Start()

	db := backupWork.db
	query := "select * from scheduler.schedules where enabled = true"
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
				resultChan := make(chan int)
				run := &models.BackupRun{
					ScheduleId:    &schedule.ID,
					Status:        runningBackupRunStatus,
					BackupRunType: scheduledBackupRunType,
					StartTime:     &now,
				}
				err := backupWork.db.QueryRow("insert into scheduler.backupruns(scheduleid, status, backupruntype, starttime) values ($1, $2, $3, $4) returning id", run.ScheduleId, run.Status, run.BackupRunType, run.StartTime).Scan(&run.Id)
				if err != nil {
					log.Println("error while inserting backuprun: ", err)
					return
				}
				go backupWork.backupWork(schedule, run.Id, resultChan)
				_ = <-resultChan

			})
		}
		time.Sleep(time.Second * 60)
	}
}

func main() {
	db, err := sqlx.Connect("postgres", "host=192.168.29.206 user=postgres password=admin dbname=homelab sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	foreverChan := make(chan struct{})
	backupWork := &BackupWork{db: db}
	go doCronWork(backupWork)

	go doAdhocBackupWork(backupWork)

	<-foreverChan
}

func doAdhocBackupWork(backupWork *BackupWork) {
	rabbit_conn_str := os.Getenv("RABBITMQ_CONN_STR")
	if rabbit_conn_str == "" {
		log.Println("RABBITMQ_CONN_STR is not set, using default amqp://user:password@192.168.29.81:5672")
		rabbit_conn_str = "amqp://user:password@192.168.29.81:5672"
	}
	amqpConn, err := amqp.Dial(rabbit_conn_str)
	if err != nil {
		log.Fatal(err)
	}
	log.Println("connected to rabbitmq")
	defer amqpConn.Close()

	ch, err := amqpConn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()
	log.Println("opened channel")
	q, err := ch.QueueDeclare(
		"adhoc-backups", // name
		true,            // durable
		false,           // delete when unused
		false,           // exclusive
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		log.Fatal(err)
	}

	db := backupWork.db

	for {
		msgs, err := ch.Consume(
			q.Name, // queue
			"",     // consumer
			false,  // auto-ack
			false,  // exclusive
			false,  // no-local
			false,  // no-wait
			nil,    // args
		)
		notifyChan := make(chan *amqp.Error)
		notifyChan = ch.NotifyClose(notifyChan)

		go func() {
			err, ok := <-notifyChan
			if !ok {
				log.Println("channel closed")
				return
			}
			if err != nil {
				log.Println("channel closed, err; ", err)
				return

			}
		}()

		if err != nil {
			log.Fatal(err)
		}

		for msg := range msgs {
			// log.Println("failing on purpose")
			// continue
			log.Printf("Received a message: %s", msg.Body)
			var event dtos.BackupRunEvent
			json.Unmarshal(msg.Body, &event)
			log.Printf("event: %+v\n", event)
			query := "select * from scheduler.backupruns where id = $1"
			var backupRun models.BackupRun
			err = db.Get(&backupRun, query, event.RunId)

			if err != nil {
				log.Println("error while getting backuprun: ", err)
				msg.Ack(false)
				continue
			}
			log.Printf("backupRun: %+v\n", backupRun)
			var schedule models.Schedule
			query = "select * from scheduler.schedules where id = $1"
			err = db.Get(&schedule, query, backupRun.ScheduleId)
			if err != nil {
				log.Println("error while getting schedule: ", err)
				continue
			}
			log.Printf("schedule: %+v\n", schedule)
			const submittedBackupRunStatus = 3
			query = "update scheduler.backupruns set status = $1 where id = $2"
			_, err = db.Exec(query, 3, event.RunId)
			if err != nil {
				log.Println("error while updating backuprun: ", err)
				continue
			}
			log.Println("updated the status")
			err, exitCode := backupWork.doAdhocBackupWork(event.RunId, &schedule)
			if err != nil {
				log.Println("error while doing adhoc backup work: ", err)
				continue
			}
			log.Println("exitCode: ", exitCode)
			if exitCode == 0 {
				msg.Ack(false)
			} else {
				msg.Nack(false, false)
			}
		}
	}
}

func (bw *BackupWork) doAdhocBackupWork(runId int, schedule *models.Schedule) (error, int) {
	doneChan := make(chan int)
	now := time.Now()
	updateQuery := `
	update scheduler.backupruns
	set status = $1, starttime = $3
	where id =  $2
	`
	_, err := bw.db.Exec(updateQuery, runningBackupRunStatus, runId, now)
	if err != nil {
		log.Println("error while updating backuprun: ", err)
		return err, 1
	}

	go bw.backupWork(*schedule, runId, doneChan)
	exitCode := <-doneChan
	return nil, exitCode
	// DO work.

}

func (bw *BackupWork) backupWork(schedule models.Schedule, runId int, resultChan chan<- int) {

	defer func() {
		if err := recover(); err != nil {
			log.Println("error: ", err)
		}
	}()
	cmd := exec.Command("rsync", "-rPavh", schedule.SrcPath, schedule.DestPath)

	stdoutBuf := bytes.NewBuffer(make([]byte, 0))
	stdErrBuf := bytes.NewBuffer(make([]byte, 0))

	cmd.Stdout = stdoutBuf
	cmd.Stderr = stdErrBuf

	err := cmd.Start()
	if err != nil {
		// TODO: i need to log this entry as well.
		log.Println("error while running rsync: ", err)
		return
	}
	err = cmd.Wait()
	logStr := createLogEntry(stdoutBuf, stdErrBuf, cmd.ProcessState.ExitCode(), err)
	// TODO: set status to completed
	updateQuery := `
	update scheduler.backupruns
	set logs = $1, completedat = $2, exitcode = $3, status = $5
	where id =  $4
	`
	_, err = bw.db.Exec(updateQuery, logStr, time.Now(), cmd.ProcessState.ExitCode(), runId, completedBackupRunStatus)
	if err != nil {
		log.Println("error while updating backuprun: ", err)
		return
	}
	log.Println("backup success: ", schedule.SrcPath, " -> ", schedule.DestPath, " , exitcode: ", cmd.ProcessState.ExitCode())
	resultChan <- cmd.ProcessState.ExitCode()

}

func createLogEntry(stdoutBuf *bytes.Buffer, stderrBuf *bytes.Buffer, exitCode int, err error) string {
	stdoutBytes, err := io.ReadAll(stdoutBuf)
	if err != nil {
		log.Println("error while reading stdout: ", err)
		stdoutBytes = []byte{}
	}
	stdoutStr := string(stdoutBytes)
	stderrBytes, err := io.ReadAll(stderrBuf)
	if err != nil {
		log.Println("error while reading stderr: ", err)
		stderrBytes = []byte{}
	}
	stderrStr := string(stderrBytes)
	return fmt.Sprintf("stdout: %s\n, stderr: %s\n, exitcode: %d\n, error: %s", stdoutStr, stderrStr, exitCode, err)
}

type BackupWork struct {
	db *sqlx.DB
}
