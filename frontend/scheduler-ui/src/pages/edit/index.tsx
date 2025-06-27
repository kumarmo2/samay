import { useEffect, useState } from "react"
import { useParams } from "react-router"
import type { Schedule } from "../home"
import { get, put } from "@/lib/utils/api"
import type { Maybe } from "@/lib/utils"
import { Scheduler } from "@/components/custom/scheduler"

const Edit = () => {
    let { id } = useParams()
    const idInt = +(id || 0)
    const [schedule, setSchedule] = useState<Maybe<Schedule>>(null)

    useEffect(() => {
        const fn = async () => {

            const res = await get<Schedule, string>(`/api/backup/schedules/${idInt}`);
            if (!res.ok) {
                return;
            }
            console.log("res: ", res);
            setSchedule(res.ok);
        }
        fn();
    }, [idInt])


    const handleSubmitClick = async ({ srcPath, destPath, cronExpression }: { srcPath: string, destPath: string, cronExpression: string }) => {
        const requestBody: Schedule = {
            id: idInt, srcPath, destPath, cronExpression
        }
        console.log("edit request body: ", requestBody);
        const res = await put<Schedule, any>(`/api/backup/schedules/${idInt}`, requestBody)
        if (!res.ok) {
            alert(res.err || "Internal server error");
            return;
        }
        setSchedule({ cronExpression, srcPath, destPath, id: idInt });
        alert("Successfully updated the schedule.");
    }

    return <div className="flex flex-col">
        {

            schedule && <Scheduler initSrcPath={schedule.srcPath} initDestPath={schedule.destPath}
                initCronExpression={schedule.cronExpression} onSubmitClick={handleSubmitClick} />
        }
    </div>

}

export default Edit
