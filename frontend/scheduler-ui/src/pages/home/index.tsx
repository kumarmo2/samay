import { useEffect, useState } from "react";
import { deleteRequest, get, post } from "../../lib/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { Scheduler } from "@/components/custom/scheduler";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React from "react";


type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

const defaultSrcPath = import.meta.env.VITE_DEFAULT_SRC_PATH || "/home/kumarmo2/dev";
const defaultDestPath = import.meta.env.VITE_DEFAULT_DEST_PATH || "/media/kumarmo2/kumarmo2-hdd-1/backups";

export type Schedule = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

function HomeComponent() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [showModal, setShowModal] = useState(false);
    const deleteRef = React.useRef<number>(null);


    const fetchSchedules = async () => {
        const res = await get<Schedule[], string>("/api/backup/schedules");
        if (!res.ok) {
            return;
        }
        setSchedules(res.ok);
    }
    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleSubmitClick = async ({ srcPath, destPath, cronExpression }: { srcPath: string, destPath: string, cronExpression: string }) => {
        const requestBody: BackupScheduleRequest = {
            srcPath, destPath, cronExpression
        }
        console.log("request body: ", requestBody);
        const res = await post<number, any>("/api/backup", requestBody)
        if (!res.ok) {
            alert(res.err || "Internal server error");
            return;
        }
        fetchSchedules();
        alert("Successfully created the schedule.");
    }

    const handleDeleteClick = async (id: number) => {
        deleteRef.current = id;
        console.log("deleteRef.current: ", deleteRef.current);
        setShowModal(true);
    }

    const handleDelete = async (id: number) => {
        const res = await deleteRequest<string, any>(`/api/backup/schedules/${id}`);
        if (!res.ok) {
            alert(res.err || "Internal server error");
            return;
        }
        const newSchedules = schedules.filter(schedule => schedule.id !== id);
        setSchedules(newSchedules);
        setShowModal(false);
        alert("Successfully deleted the schedule.");
    }

    const handleDeleteConfirm = async () => {
        const id = deleteRef.current;
        console.log("id: ", id);
        if (!id) {
            return;
        }
        await handleDelete(id);
    }

    return (
        <div className="flex flex-col">
            <Dialog open={showModal} onOpenChange={() => setShowModal(!showModal)}>
                <DialogContent>
                    <div className="px-1 text-center flex flex-col gap-2">
                        <DialogTitle className="text-xl font-bold">Are you sure you want to delete this schedule?</DialogTitle>
                        <div className="flex justify-around">
                            <Button onClick={handleDeleteConfirm} variant="destructive">Delete</Button>
                            <Button>Cancel</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Scheduler initSrcPath={defaultSrcPath} initDestPath={defaultDestPath} initCronExpression="0 0 * * *" onSubmitClick={handleSubmitClick} />
            <SchedulesTable schedules={schedules} onDeleteClick={handleDeleteClick} />
        </div >
    )
}

const SchedulesTable = ({ schedules, onDeleteClick }: { schedules: Schedule[], onDeleteClick: (id: number) => void }) => {
    return (
        <div className="flex flex-col">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Source Path</TableHead>
                        <TableHead>Destination Path</TableHead>
                        <TableHead>Cron Expression</TableHead>
                        <TableHead>Edit</TableHead>
                        <TableHead>Delete</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        schedules.map(schedule => {
                            return (
                                <TableRow key={schedule.id}>
                                    <TableCell>{schedule.srcPath}</TableCell>
                                    <TableCell>{schedule.destPath}</TableCell>
                                    <TableCell>{schedule.cronExpression}</TableCell>
                                    <TableCell><Link to={`/edit/${schedule.id}`}>Edit</Link></TableCell>
                                    <TableCell><Button variant="destructive" onClick={() => onDeleteClick(schedule.id)}>Delete</Button></TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default HomeComponent
