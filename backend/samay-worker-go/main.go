package main

import (
	"bytes"
	"fmt"
	"io"
	"log"
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

	backupWork := &BackupWork{db: db}

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
				backupWork.backupWork(schedule)
			})
		}
		time.Sleep(time.Second * 60)
	}

}

func (bw *BackupWork) backupWork(schedule models.Schedule) {

	defer func() {
		if err := recover(); err != nil {
			log.Println("error: ", err)
		}
	}()
	var scheduledBackupRunType int
	var scheduledBackupRunStatus int
	var scheduledBackupRunTypeError error
	var scheduledBackupRunStatusError error

	wg := &sync.WaitGroup{}

	wg.Add(1)

	go func() {
		scheduledBackupRunTypeError = bw.db.Get(&scheduledBackupRunType, "select id from scheduler.backupruntype where name = 'scheduled'")
		wg.Done()
	}()

	wg.Add(1)

	go func() {
		scheduledBackupRunStatusError = bw.db.Get(&scheduledBackupRunStatus, "select id from scheduler.backuprunstatus where name = 'running'")
		wg.Done()
	}()

	wg.Wait()

	if scheduledBackupRunStatusError != nil {
		log.Println("error while getting backuprunstatus: ", scheduledBackupRunStatusError)
	}

	if scheduledBackupRunTypeError != nil {
		log.Println("error while getting backupruntype: ", scheduledBackupRunTypeError)
	}
	cmd := exec.Command("rsync", "-rPavh", schedule.SrcPath, schedule.DestPath)

	stdoutBuf := bytes.NewBuffer(make([]byte, 0))
	stdErrBuf := bytes.NewBuffer(make([]byte, 0))

	cmd.Stdout = stdoutBuf
	cmd.Stderr = stdErrBuf

	run := &models.BackupRun{
		ScheduleId:    &schedule.ID,
		Status:        scheduledBackupRunStatus,
		BackupRunType: scheduledBackupRunStatus,
		StartTime:     time.Now(),
	}
	err := bw.db.QueryRow("insert into scheduler.backupruns(scheduleid, status, backupruntype, starttime) values ($1, $2, $3, $4) returning id", run.ScheduleId, run.Status, run.BackupRunType, run.StartTime).Scan(&run.Id)
	if err != nil {
		log.Println("error while inserting backuprun: ", err)
		return
	}
	err = cmd.Start()
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
	set logs = $1, completedat = $2, exitcode = $3
	where id =  $4
	`
	_, err = bw.db.Exec(updateQuery, logStr, time.Now(), cmd.ProcessState.ExitCode(), run.Id)
	if err != nil {
		log.Println("error while updating backuprun: ", err)
		return
	}
	log.Println("backup success: ", schedule.SrcPath, " -> ", schedule.DestPath, " , exitcode: ", cmd.ProcessState.ExitCode())

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
