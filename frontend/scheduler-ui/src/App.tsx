import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCallback, useEffect, useState } from "react";
import { get, post } from "./lib/utils/api";
import { goUpAdirectory } from "./lib/utils/path";
import { Button } from "./components/ui/button";
import { cn } from "./lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";
import { CronExpression } from "./CronComponent";

const defaultPath = () => "/";
const defaultChildOptions: () => string[] = () => [];

type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
}

export const hours = Array.from({ length: 24 }, (_, i) => i)
export const minutes = Array.from({ length: 60 }, (_, i) => i)

export type CronType = "oneshot" | "daily" | "hourly"
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

function App() {
    const [srcPath, setSrcPath] = useState(defaultPath());
    const [srcChildPathOptions, setSrcChildPathOptions] = useState(defaultChildOptions);
    const [destPath, setDestPath] = useState(defaultPath());
    const [destChildPathOptions, setDestChildPathOptions] = useState(defaultChildOptions);
    const handleSrcPathChange = useCallback((newValue: string) => {
        handlePathChange(newValue, srcPath, setSrcPath);

    }, [srcPath])

    const handleDestPathChange = useCallback((newValue: string) => {
        handlePathChange(newValue, destPath, setDestPath);

    }, [srcPath])

    const [isFetching, setIsFetching] = useState(false);
    const [hour, setHour] = useState<number>(0);
    const [minute, setMinute] = useState<number>(0);
    const [cronType] = useState<CronType>("daily");




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
                res.ok.push("..");
            }
            setDestChildPathOptions(res.ok);

        }
        fn();

    }, [destPath]);

    const isSubmitDisabled = useCallback(() => {
        return !srcPath || srcPath === "/" || !destPath || destPath === "/"

    }, [srcPath, destPath]);

    const handleSubmitClick = async () => {
        console.log("submit clicked", { srcPath, destPath, hour, minute, cronType });
        // const req: BackupScheduleRequest = {
        //     srcPath,
        //     destPath
        // }
        // await post<void, void>("/api/backup", req)
    }

    const handleHourSelect = useCallback((hour: number) => {
        setHour(hour)
    }, []);

    const handleMinuteSelect = useCallback((minute: number) => {
        setMinute(minute)
    }, [])


    return (
        <div>
            <h1> hello </h1>
            <div className="flex">
                <Path currPath={srcPath} onPathChange={handleSrcPathChange}
                    childPathOptions={srcChildPathOptions} isFetching={isFetching} />
                <Path currPath={destPath}
                    onPathChange={handleDestPathChange}
                    childPathOptions={destChildPathOptions}
                    isFetching={isFetching} />
                <Button className="mx-6" type="submit" onClick={handleSubmitClick} disabled={isSubmitDisabled()} >
                    Submit
                </Button>
            </div>
            <div>
                <Cron minute={minute} handleMinuteSelect={handleMinuteSelect} cronType={cronType} hour={hour} handleHourSelect={handleHourSelect} />
            </div>
            <div>
                <CronExpression cronType={cronType} />
            </div>
        </div>
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
                    <SelectTrigger className="w-[180px]">
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
            <SelectContent className={cn("p-0 bg-red-300", isFetching && "h-[100px]")}>
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

function Cron({ hour, handleHourSelect, cronType, minute, handleMinuteSelect }: {
    cronType: CronType,
    hour: number,
    minute: number,
    handleMinuteSelect: (val: number) => void,
    handleHourSelect: (val: number) => void,
}) {
    return <div>
        '{cronType}' Cron
        <div className="flex">
            {cronType !== "oneshot" && cronType !== "hourly" && <Hours hour={hour} handleHourSelect={handleHourSelect} />}
            <Minutes minute={minute} handleMinuteSelect={handleMinuteSelect} />
        </div>
    </div>
}


const Hours = ({ hour, handleHourSelect }: { hour: number, handleHourSelect: (val: number) => void }) => {
    return (
        <Select value={hour.toString()} onValueChange={(val) => handleHourSelect(+val)}>
            <SelectTrigger className="w-[100px] bg-red-100">
                <SelectValue placeholder="hours" >
                    {hour}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="h-[200px]">
                {
                    hours.map(h => {

                        return <SelectItem key={h} value={h.toString()}>{h}</SelectItem>

                    })
                }
            </SelectContent>
        </Select >
    )
}

const Minutes = ({ minute, handleMinuteSelect }: { minute: number, handleMinuteSelect: (val: number) => void }) => {
    return (

        <Select value={`${minute}`} onValueChange={(val) => handleMinuteSelect(+val)}>
            <SelectTrigger className="w-[100px] bg-red-100">
                <SelectValue placeholder="mins" >
                    {minute}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="h-[200px]">
                {
                    minutes.map(h => {

                        return <SelectItem key={h} value={h.toString()}>{h}</SelectItem>

                    })
                }
            </SelectContent>
        </Select >
    )
}

export default App
