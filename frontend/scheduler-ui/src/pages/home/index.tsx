
import { useEffect, useState } from "react";
import { get, post } from "../../lib/utils/api";
import { goUpAdirectory } from "../../lib/utils/path";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { Scheduler } from "@/components/custom/scheduler";


type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

type Schedule = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

const handlePathChange = (newValue: string, currValue: string, setPath: (value: string) => void) => {
    console.log("path value: ", newValue);
    if (newValue !== "..") {
        setPath(newValue);
        return;
    }
    console.log("path value: ", newValue);
    if (currValue === "/") {
        throw new Error("Already at root");
    }
    setPath(goUpAdirectory(currValue));
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

    return (
        <div className="flex flex-col">
            <Scheduler initSrcPath="/home/kumarmo2/dev" initDestPath="/home/kumarmo2/temp" initCronExpression="0 0 * * *" onSubmitClick={handleSubmitClick} />
            <SchedulesTable schedules={schedules} />
        </div>
    )
}



const SchedulesTable = ({ schedules }: { schedules: Schedule[] }) => {
    return (
        <div className="flex flex-col">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Source Path</TableHead>
                        <TableHead>Destination Path</TableHead>
                        <TableHead>Cron Expression</TableHead>
                        <TableHead>Edit</TableHead>
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
