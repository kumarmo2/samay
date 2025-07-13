package models

import "time"

type Schedule struct {
	ID             int     `db:"id" json:"id"`
	Name           *string `db:"name" json:"name,omitempty"` // nullable in DB
	SrcPath        string  `db:"srcpath" json:"srcPath"`
	DestPath       string  `db:"destpath" json:"destPath"`
	CronExpression string  `db:"cronexpression" json:"cronExpression"`
	Enabled        bool    `db:"enabled" json:"enabled"`
}

type BackupRun struct {
	Id            int        `db:"id" json:"id"`
	ScheduleId    *int       `db:"scheduleid" json:"scheduleId"`
	BackupRunType int        `db:"backupruntype" json:"backupRunType"`
	Status        int        `db:"status" json:"status"`
	StartTime     time.Time  `db:"starttime" json:"startTime"`
	CompletedAt   *time.Time `db:"completedat" json:"completedAt"`
	ExitCode      *int       `db:"exitcode" json:"exitCode"`
	Logs          *string    `db:"logs" json:"logs"`
}
