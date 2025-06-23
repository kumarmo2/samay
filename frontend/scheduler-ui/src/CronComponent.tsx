import { useState } from "react";
import type { CronType } from "./App";
import { Input } from "./components/ui/input";

export default function CronComponent() {
}


type DailyCronType = "every"
const DailyCron = () => {

    return (
        <div>
            <h1>Daily Cron</h1>

        </div>
    )

}


export const CronExpression = ({ cronType, className }: { cronType: CronType, className?: string }) => {
    const [minute, setMinute] = useState("0");
    const [hour, setHour] = useState("0");
    const [day, setDay] = useState("*");
    const [month, setMonth] = useState("*");
    const [week, setWeek] = useState("*");

    const cron = `${cronType} ${minute} ${hour} ${day} ${month} ${week}`

    return <div>Cron expression
        <div className="flex gap-2">
            <Input value={minute} className="border-emerald-300 w-10" />
            <Input value={hour} className="border-emerald-300 w-10" />
            <Input value={day} disabled className="border-emerald-300 w-10" />
            <Input value={month} disabled className="border-emerald-300 w-10" />
            <Input value={week} disabled className="border-emerald-300 w-10" />
        </div>


    </div>
}


