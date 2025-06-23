import React from "react";
import { Input } from "./components/ui/input";
import { cronParser } from "./lib/utils/cron";
import { cn } from "./lib/utils";


export const CronExpression = () => {

    const minuteRef = React.useRef<HTMLInputElement>(null);
    const hourRef = React.useRef<HTMLInputElement>(null);
    const [hasError, setHasError] = React.useState(false);

    const handleOnBlur = () => {
        const minuteValue = minuteRef.current?.value || "*";
        const hourValue = hourRef.current?.value || "*";
        console.log("blurred: ", "minuteValue: ", minuteValue, "hourValue: ", hourValue);
        const parseResult = cronParser(`${minuteValue} ${hourValue} * * *`);
        if (parseResult.type !== "ok") {
            console.log("error: ", parseResult.val);
            setHasError(true);
            return
        }
        setHasError(false);
        const humanReadableForm = parseResult.val;
        console.log("tokens: ", humanReadableForm);
    }

    return <div>Cron expression
        <div className={cn("flex gap-2", hasError && " [&>*]:border-red-900")}>
            <Input ref={minuteRef} placeholder="*" onBlur={handleOnBlur} className="border-emerald-300 w-10" />
            <Input ref={hourRef} placeholder="*" onBlur={handleOnBlur} className="border-emerald-300 w-10" />
            <Input placeholder="*" disabled className="border-emerald-300 w-10" />
            <Input placeholder="*" disabled className="border-emerald-300 w-10" />
            <Input placeholder="*" disabled className="border-emerald-300 w-10" />
        </div>
    </div>
}


