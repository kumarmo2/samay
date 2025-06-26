package models

type Schedule struct {
	ID             int     `db:"id" json:"id"`
	Name           *string `db:"name" json:"name,omitempty"` // nullable in DB
	SrcPath        string  `db:"srcpath" json:"srcPath"`
	DestPath       string  `db:"destpath" json:"destPath"`
	CronExpression string  `db:"cronexpression" json:"cronExpression"`
}
