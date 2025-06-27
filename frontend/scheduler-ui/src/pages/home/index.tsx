import { useEffect, useState } from "react";
import { deleteRequest, get, post } from "../../lib/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { Scheduler } from "@/components/custom/scheduler";
import { Button } from "@/components/ui/button";


type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

const defaultSrcPath = import.meta.env.VITE_DEFAULT_SRC_PATH || "/home/kumarmo2/dev";
const defaultDestPath = import.meta.env.VITE_DEFAULT_DEST_PATH || "/home/kumarmo2/temp";

export type Schedule = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

function HomeComponent() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);


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

    const handleDelete = async (id: number) => {
        const res = await deleteRequest<string, any>(`/api/backup/schedules/${id}`);
        if (!res.ok) {
            alert(res.err || "Internal server error");
            return;
        }
        const newSchedules = schedules.filter(schedule => schedule.id !== id);
        setSchedules(newSchedules);
        alert("Successfully deleted the schedule.");
    }

    return (
        <div className="flex flex-col">
            <Scheduler initSrcPath={defaultSrcPath} initDestPath={defaultDestPath} initCronExpression="0 0 * * *" onSubmitClick={handleSubmitClick} />
            <SchedulesTable schedules={schedules} onDeleteClick={handleDelete} />
        </div>
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
