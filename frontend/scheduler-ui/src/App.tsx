import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCallback, useEffect, useState } from "react";
import { get, post } from "./lib/utils/api";
import { goUpAdirectory } from "./lib/utils/path";
import { Button } from "./components/ui/button";
import Cron from "./cron";
import { cn } from "./lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip";

const defaultPath = () => "/";
const defaultChildOptions: () => string[] = () => [];

type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
}

//TODO:add check on same src and dest.

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
        console.log("submit clicked");
        const req: BackupScheduleRequest = {
            srcPath,
            destPath
        }
        await post<void, void>("/api/backup", req)
    }


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
                <Cron />
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

export default App
