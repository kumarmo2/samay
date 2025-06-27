
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import React, { useCallback, useEffect, useState } from "react";
import { get, post } from "../../lib/utils/api";
import { goUpAdirectory } from "../../lib/utils/path";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import { CronExpression } from "../../CronComponent";
import type { Maybe, Result } from "../../lib/utils/result";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

const defaultPath = () => "/home/kumarmo2";
const defaultBackupDir = () => "/home/kumarmo2/temp"

const defaultChildOptions: () => string[] = () => [];

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

const initialDataRefValue = {
    isCronExpressionCorrect: true
}

function HomeComponent() {
    const [srcPath, setSrcPath] = useState(defaultPath);
    const [srcChildPathOptions, setSrcChildPathOptions] = useState(defaultChildOptions);
    const [destPath, setDestPath] = useState(defaultBackupDir);
    const [destChildPathOptions, setDestChildPathOptions] = useState(defaultChildOptions);
    const handleSrcPathChange = useCallback((newValue: string) => {
        handlePathChange(newValue, srcPath, setSrcPath);

    }, [srcPath])

    const dataRef = React.useRef(initialDataRefValue);
    const cronRef = React.useRef<Maybe<HTMLDivElement>>(null);

    const handleDestPathChange = useCallback((newValue: string) => {
        handlePathChange(newValue, destPath, setDestPath);

    }, [destPath])

    const [isFetching, setIsFetching] = useState(false);

    const onCronValueChange = useCallback((parseResult: Result<string, string>) => {
        console.log("parseResult: ", parseResult);
        dataRef.current.isCronExpressionCorrect = parseResult.type === "ok"

    }, [dataRef.current])

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    // const table = useReactTable({
    //     data: schedules,
    //     columns
    //
    // })

    // const table1 = useReactTable({
    //     columns,
    //     data: schedules,
    //     getCoreRowModel: getCoreRowModel()
    // });

    useEffect(() => {
        console.log("path changed: ", srcPath);
        const fn = async () => {
            const searchParams = new URLSearchParams({ "path": srcPath })
            setIsFetching(true);
            const res = await get<string[], any>(`/api/files?${searchParams.toString()}`)
            setIsFetching(false);
            console.log(res);
            if (!res.ok) {
                return;
            }

            if (srcPath !== "/") {
                res.ok.unshift("..");
            }
            setSrcChildPathOptions(res.ok);

        }
        fn();

    }, [srcPath]);

    useEffect(() => {
        console.log("path changed: ", destPath);
        const fn = async () => {
            const searchParams = new URLSearchParams({ "path": destPath })
            setIsFetching(true);
            const res = await get<string[], any>(`/api/files?${searchParams.toString()}`)
            setIsFetching(false);
            console.log(res);
            if (!res.ok) {
                return;
            }

            if (destPath !== "/") {
                res.ok.unshift("..");
            }
            setDestChildPathOptions(res.ok);

        }
        fn();

    }, [destPath]);


    useEffect(() => {
        const fn = async () => {
            const res = await get<Schedule[], string>("/api/backup/schedules");
            if (!res.ok) {
                return;
            }
            setSchedules(res.ok);
            console.log("res: ", res);

        }
        fn();


    }, []);

    const isSubmitDisabled = useCallback(() => {
        return !srcPath || srcPath === "/" || !destPath || destPath === "/"

    }, [srcPath, destPath]);

    const handleSubmitClick = async () => {
        if (!dataRef.current.isCronExpressionCorrect) {
            alert("Fix the cron expression");
            return
        }
        // TODO: code small because of using `as`. Is there a way to avoid this type coersion.
        const values = Array.from<HTMLInputElement>(cronRef.current?.children as Iterable<HTMLInputElement>).map(input => {
            if (input.value === "" || input.value === null) {
                console.log("returning placeholder: ", input.placeholder);
                return input.placeholder;
            }
            return input.value
        });


        console.log("values: ", values);
        const cronExpression = values.join(" ");
        console.log("cron expression: ", cronExpression);
        const requestBody: BackupScheduleRequest = {
            srcPath, destPath, cronExpression
        }
        await post<BackupScheduleRequest, any>("/api/backup", requestBody)
    }

    return (
        <>
            <div className="flex gap-4">
                <Path currPath={srcPath} onPathChange={handleSrcPathChange}
                    childPathOptions={srcChildPathOptions} isFetching={isFetching} />
                <Path currPath={destPath}
                    onPathChange={handleDestPathChange}
                    childPathOptions={destChildPathOptions}
                    isFetching={isFetching} />
                <Button className="mx-6 cursor-pointer" type="submit" onClick={handleSubmitClick} disabled={isSubmitDisabled()} >
                    Submit
                </Button>
            </div>
            <div className="mt-4">
                <CronExpression ref={cronRef} onValueChange={onCronValueChange} />
            </div>
            <div>
                <SchedulesTable schedules={schedules} />
            </div>
        </>
    )
}


const Path = ({ childPathOptions, currPath, onPathChange, isFetching }: {
    childPathOptions: string[], currPath: string,
    onPathChange: (val: string) => void,
    isFetching: boolean,
}) => {

    const [open, setOpen] = useState(false);

    const handleOpen = (val: boolean) => {
        console.log("open: ", val);
        setOpen(val);
    }

    const handleValueClick = (val: string) => {
        onPathChange(val);
    }

    return (

        <Select open={open} value={currPath} onOpenChange={handleOpen} >
            <Tooltip>
                <TooltipTrigger asChild>
                    <SelectTrigger className="w-[380px]">
                        <SelectValue placeholder="Theme" >
                            {currPath}
                        </SelectValue>
                    </SelectTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <div>
                        {currPath}
                    </div>
                </TooltipContent>
            </Tooltip>
            <SelectContent className={cn("p-0 ", isFetching && "h-[100px]")}>
                {
                    isFetching && <div className="flex flex-col items-center justify-center w-full h-full">
                        ...

                    </div>
                }
                {
                    !isFetching && childPathOptions.map(childPath => {
                        return <div className="px-1 py-1 cursor-pointer" key={childPath} onClick={() => handleValueClick(childPath)} >{childPath}</div>
                    })

                }
            </SelectContent>
        </Select>
    )

}



const SchedulesTable = ({ schedules }: { schedules: Schedule[] }) => {
    const clickHandler = (id: number) => {
        console.log("clicked: ", id);
    }
    return (
        <div className="flex flex-col">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Source Path</TableHead>
                        <TableHead>Destination Path</TableHead>
                        <TableHead>Cron Expression</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        schedules.map(schedule => {
                            return (
                                <TableRow onClick={() => clickHandler(schedule.id)} key={schedule.id}>
                                    <TableCell>{schedule.srcPath}</TableCell>
                                    <TableCell>{schedule.destPath}</TableCell>
                                    <TableCell>{schedule.cronExpression}</TableCell>
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
