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
import { cn } from "@/lib/utils";


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

const OverflowText = ({ value, className }: { value?: string | number | null, className?: string }) => {
    // const text = value === null || value === undefined || value === "" ? "-" : String(value);
    const text = !value ? "-" : String(value);
    const textRef = React.useRef<HTMLSpanElement>(null);
    const [title, setTitle] = useState("");

    const handleMouseEnter = useCallback(() => {
        const el = textRef.current;
        if (!el) {
            return;
        }
        const isOverflowing = el.scrollWidth > el.clientWidth;
        setTitle(isOverflowing ? text : "");
    }, [text]);

    return (
        <span
            ref={textRef}
            title={title}
            onMouseEnter={handleMouseEnter}
            className={cn("block min-w-0 truncate", className)}
        >
            {text}
        </span>
    );
};

export type ScheduleDashoardItem = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
    enabled: boolean;
    lastCompletedAt?: string;
    lastStartTime?: string;
    exitCode?: number;
    latestRunId?: number;
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
        <div className="flex w-full flex-col gap-8">
            {
                isLoading && <FullPageLoader />
            }
            <Dialog open={showModal} onOpenChange={() => setShowModal(!showModal)}>
                <DialogContent>
                    <div className="px-1 text-center flex flex-col gap-2">
                        <DialogTitle className="text-xl font-bold">Are you sure you want to delete this schedule?</DialogTitle>
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-around">
                            <Button onClick={handleDeleteConfirm} variant="destructive" className="w-full sm:w-auto">Delete</Button>
                            <Button className="w-full sm:w-auto">Cancel</Button>
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
        <div className="flex w-full flex-col gap-4 relative">
            {isLoading &&
                <div className="bg-transparent z-10 backdrop-blur-xs absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
                    <Loader className="animate-spin" />
                </div>
            }
            <div className="w-full overflow-x-auto rounded-lg border border-border">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="whitespace-nowrap">Run Now</TableHead>
                            <TableHead className="sm:hidden">Schedule</TableHead>
                            <TableHead className="hidden sm:table-cell">Source Path</TableHead>
                            <TableHead className="hidden sm:table-cell">Destination Path</TableHead>
                            <TableHead className="hidden md:table-cell whitespace-nowrap">Cron Expression</TableHead>
                            <TableHead className="hidden lg:table-cell whitespace-nowrap">Last Completed At</TableHead>
                            <TableHead className="hidden lg:table-cell whitespace-nowrap">Last Start Time</TableHead>
                            <TableHead className="hidden lg:table-cell">Exit Code</TableHead>
                            <TableHead className="hidden sm:table-cell">Edit</TableHead>
                            <TableHead className="hidden sm:table-cell">Delete</TableHead>
                            <TableHead className="hidden sm:table-cell">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            schedules.map(schedule => {
                                const { latestRunId, lastCompletedAt } = schedule;
                                const shouldEnableRunNowButton = (latestRunId && lastCompletedAt) || (!latestRunId);

                                return (
                                    <TableRow key={schedule.id}>
                                        <TableCell className="whitespace-nowrap">
                                            <Button
                                                variant="secondary"
                                                disabled={!shouldEnableRunNowButton}
                                                className="hover:cursor-pointer"
                                                onClick={() => handleRunNowClick(schedule)}
                                            >
                                                Run Now
                                            </Button>
                                        </TableCell>
                                        <TableCell className="sm:hidden">
                                            <div className="flex flex-col gap-2 text-sm">
                                                <div className="min-w-0">
                                                    <p className="text-xs uppercase text-muted-foreground">Source</p>
                                                    <OverflowText value={schedule.srcPath} className="font-medium" />
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Destination</p>
                                                    <OverflowText value={schedule.destPath} />
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    <div>
                                                        <p className="text-xs uppercase text-muted-foreground">Cron</p>
                                                        <OverflowText value={schedule.cronExpression} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase text-muted-foreground">Exit</p>
                                                        <OverflowText value={schedule.exitCode} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    <div>
                                                        <p className="text-xs uppercase text-muted-foreground">Last completed</p>
                                                        <OverflowText value={schedule.lastCompletedAt} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase text-muted-foreground">Last start</p>
                                                        <OverflowText value={schedule.lastStartTime} />
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <Link className="text-sm font-medium underline" to={`/edit/${schedule.id}`}>Edit</Link>
                                                    <Button variant="destructive" onClick={() => onDeleteClick(schedule.id)}>Delete</Button>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs uppercase text-muted-foreground">Enabled</span>
                                                        <Checkbox onCheckedChange={(checked) => handleCheckClick(schedule.id, checked)} checked={schedule.enabled} />
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell max-w-[220px]">
                                            <OverflowText value={schedule.srcPath} className="max-w-[220px]" />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell max-w-[220px]">
                                            <OverflowText value={schedule.destPath} className="max-w-[220px]" />
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell max-w-[180px]">
                                            <OverflowText value={schedule.cronExpression} className="max-w-[180px]" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell max-w-[180px]">
                                            <OverflowText value={schedule.lastCompletedAt} className="max-w-[180px]" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell max-w-[180px]">
                                            <OverflowText value={schedule.lastStartTime} className="max-w-[180px]" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell max-w-[100px]">
                                            <OverflowText value={schedule.exitCode} className="max-w-[100px]" />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Link className="text-sm underline" to={`/edit/${schedule.id}`}>Edit</Link>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Button variant="destructive" onClick={() => onDeleteClick(schedule.id)}>Delete</Button>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Checkbox onCheckedChange={(checked) => handleCheckClick(schedule.id, checked)} checked={schedule.enabled} />
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default HomeComponent
