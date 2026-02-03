import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { get, put } from "@/lib/utils/api"
import type { Maybe } from "@/lib/utils"
import { Scheduler } from "@/components/custom/scheduler"

export type ScheduleDetails = {
    id: number;
    srcPath: string;
    destPath: string;
    cronExpression: string;
    enabled: boolean;
}
const Edit = () => {
    let { id } = useParams()
    const idInt = +(id || 0)
    const [schedule, setSchedule] = useState<Maybe<ScheduleDetails>>(null)

    useEffect(() => {
        const fn = async () => {

            const res = await get<ScheduleDetails, string>(`/api/backup/schedules/${idInt}`);
            if (!res.ok) {
                return;
            }
            console.log("res: ", res);
            setSchedule(res.ok);
        }
        fn();
    }, [idInt])


    const handleSubmitClick = async ({ srcPath, destPath, cronExpression }: { srcPath: string, destPath: string, cronExpression: string }) => {
        const enabled = schedule?.enabled || true;
        const requestBody: ScheduleDetails = {
            id: idInt, srcPath, destPath, cronExpression, enabled
        }
        console.log("edit request body: ", requestBody);
        const res = await put<ScheduleDetails, any>(`/api/backup/schedules/${idInt}`, requestBody)
        if (!res.ok) {
            alert(res.err || "Internal server error");
            return;
        }
        setSchedule({ cronExpression, srcPath, destPath, id: idInt, enabled });
        alert("Successfully updated the schedule.");
    }

    return <div className="flex w-full flex-col gap-6">
        {
            schedule && <Scheduler initSrcPath={schedule.srcPath} initDestPath={schedule.destPath}
                initCronExpression={schedule.cronExpression} onSubmitClick={handleSubmitClick} />
        }
    </div>

}

export default Edit
