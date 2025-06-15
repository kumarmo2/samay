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

const defaultPath = () => "/";
const defaultChildOptions: () => string[] = () => [];

type BackupScheduleRequest = {
    srcPath: string;
    destPath: string;
}

//TODO:add check on same src and dest.

const handlePathChange = (newValue: string, currValue: string, setPath: (value: string) => void) => {
    if (newValue !== "..") {
        setPath(newValue);
        return;
    }
    console.log("path value: ", newValue);
    if (currValue === "/") {
        throw new Error("Already at root");
    }
    console.log("new path: ", goUpAdirectory(currValue));
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



    useEffect(() => {
        console.log("path changed: ", srcPath);
        const fn = async () => {
            const searchParams = new URLSearchParams({ "path": srcPath })
            const res = await get<string[], any>(`/api/files?${searchParams.toString()}`)
            console.log(res);
            if (!res.ok) {
                return;
            }

            if (srcPath !== "/") {
                res.ok.push("..");
            }
            setSrcChildPathOptions(res.ok);

        }
        fn();

    }, [srcPath]);

    useEffect(() => {
        console.log("path changed: ", destPath);
        const fn = async () => {
            const searchParams = new URLSearchParams({ "path": destPath })
            const res = await get<string[], any>(`/api/files?${searchParams.toString()}`)
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
                <Path currPath={srcPath} onPathChange={handleSrcPathChange} childPathOptions={srcChildPathOptions} />
                <Path currPath={destPath} onPathChange={handleDestPathChange} childPathOptions={destChildPathOptions} />
                <Button type="submit" onClick={handleSubmitClick} disabled={isSubmitDisabled()} >
                    Submit
                </Button>
            </div>
        </div>
    )
}


const Path = ({ childPathOptions, currPath, onPathChange }: { childPathOptions: string[], currPath: string, onPathChange: (val: string) => void }) => {
    return (

        <Select value={currPath} onValueChange={onPathChange}>
            <SelectTrigger className="w-[180px] bg-red-100">
                <SelectValue placeholder="Theme" >
                    {currPath}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {
                    childPathOptions.map(childPath => {
                        return <SelectItem key={childPath} value={childPath}>{childPath}</SelectItem>

                    })
                }
            </SelectContent>
        </Select >
    )

}

export default App
