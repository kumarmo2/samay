import { useCallback, useEffect, useState } from "react";
import { deleteRequest, get, post, put } from "../../lib/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Link } from "react-router";
import { Scheduler } from "@/components/custom/scheduler";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import React from "react";
import FullPageLoader from "@/components/custom/full-page-loader";
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Loader } from "lucide-react";


type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
    cronExpression: string;
}

type BackupSchedulePartialUpdateRequest = {
    enabled?: boolean;
}

const defaultSrcPath = import.meta.env.VITE_DEFAULT_SRC_PATH || "/home/kumarmo2/dev";
const defaultDestPath = import.meta.env.VITE_DEFAULT_DEST_PATH || "/media/kumarmo2/kumarmo2-hdd-1/backups";

export type ScheduleDashoardItem = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
    enabled: boolean;
    lastCompletedAt?: string;
    lastStartTime?: string;
    exitCode?: number;
}

function HomeComponent() {
    const [schedules, setSchedules] = useState<ScheduleDashoardItem[]>([]);
    const [showModal, setShowModal] = useState(false);
    const deleteRef = React.useRef<number>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isFetching, setIsFetching] = React.useState(false);


    const fetchSchedules = async () => {
        setIsFetching(true);
        const res = await get<ScheduleDashoardItem[], string>("/api/backup/schedules");
        setIsFetching(false);
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

    const handleEnableCheck = useCallback(async (id: number, checked: boolean) => {
        const requestBody: BackupSchedulePartialUpdateRequest = {
            enabled: checked
        }
        setIsLoading(true);
        try {
            const res = await put<any, string>(`/api/backup/schedules/${id}/update`, requestBody)
            setIsLoading(false);
            if (!res.ok) {
                alert(res.err || "Internal server error");
                return;
            }
            const newSchedules = schedules.map(schedule => {
                if (schedule.id !== id) {
                    return schedule;
                }
                const newSchedule = { ...schedule, enabled: checked };
                return newSchedule;
            })
            setSchedules(newSchedules);
        } catch (e) {
            console.log("error: ", e);
            setIsLoading(false);
        }
    }, [schedules, setSchedules])

    const handleRunNowClick = useCallback(async (schedule: ScheduleDashoardItem) => {
        try {
            setIsFetching(true)
            const res = await post<ScheduleDashoardItem, string>(`/api/backup/schedules/${schedule.id}/run`)
            setIsFetching(false)
            if (!res.ok) {
                alert(res.err || "Internal server error");
                return;
            }
            const newSchedules = schedules.map(s => {
                if (s.id !== schedule.id) {
                    return s;
                }
                const newSchedule = {
                    ...s,
                    ...res.ok,
                };
                return newSchedule;
            });

            setSchedules(newSchedules);
        } catch (e) {
            console.log("error: ", e);
            setIsFetching(false);
        }

    }, [isFetching, setIsFetching]);



    return (
        <div className="flex flex-col">
            {
                isLoading && <FullPageLoader />
            }
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
            <SchedulesTable isLoading={isFetching}
                handleToggleEnabled={handleEnableCheck}
                schedules={schedules}
                onDeleteClick={handleDeleteClick}
                handleRunNowClick={handleRunNowClick} />
        </div >
    )
}

type SchedulesTableProps = {
    handleToggleEnabled: (id: number, checked: boolean) => void;
    schedules: ScheduleDashoardItem[];
    onDeleteClick: (id: number) => void;
    isLoading?: boolean;
    handleRunNowClick: (schedule: ScheduleDashoardItem) => void;
}

const SchedulesTable = ({ handleRunNowClick, isLoading, handleToggleEnabled, schedules, onDeleteClick }: SchedulesTableProps) => {
    const handleCheckClick = (id: number, checked: CheckedState) => {
        if (checked === "indeterminate") {
            return;
        }
        if (checked == true) {
        }
        handleToggleEnabled(id, checked);
    }

    return (
        <div className="flex flex-col relative">
            {isLoading &&
                <div className="bg-transparent z-10 backdrop-blur-xs absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
                    <Loader className="animate-spin" />
                </div>
            }
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Run Now</TableHead>
                        <TableHead>Source Path</TableHead>
                        <TableHead>Destination Path</TableHead>
                        <TableHead>Cron Expression</TableHead>
                        <TableHead>Edit</TableHead>
                        <TableHead>Delete</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead>Last Completed At</TableHead>
                        <TableHead>Last Start Time</TableHead>
                        <TableHead>Exit Code</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        schedules.map(schedule => {
                            return (
                                <TableRow key={schedule.id}>
                                    <TableCell><Button variant="secondary"
                                        disabled={!schedule.lastCompletedAt && !!schedule.lastStartTime} className="hover:cursor-pointer" onClick={() => handleRunNowClick(schedule)}>Run Now</Button>
                                    </TableCell>
                                    <TableCell>{schedule.srcPath}</TableCell>
                                    <TableCell>{schedule.destPath}</TableCell>
                                    <TableCell>{schedule.cronExpression}</TableCell>
                                    <TableCell><Link to={`/edit/${schedule.id}`}>Edit</Link></TableCell>
                                    <TableCell><Button variant="destructive" onClick={() => onDeleteClick(schedule.id)}>Delete</Button></TableCell>
                                    <TableCell><Checkbox onCheckedChange={(checked) => handleCheckClick(schedule.id, checked)} checked={schedule.enabled} /></TableCell>
                                    <TableCell>{schedule.lastCompletedAt}</TableCell>
                                    <TableCell>{schedule.lastStartTime}</TableCell>
                                    <TableCell>{schedule.exitCode}</TableCell>
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
