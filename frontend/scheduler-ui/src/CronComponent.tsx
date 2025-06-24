import React from "react";
import { Input } from "./components/ui/input";
import { cronParser } from "./lib/utils/cron";
import { cn } from "./lib/utils";
import type { Result } from "./lib/utils/result";


export const CronExpression = React.forwardRef(({ onValueChange }: { onValueChange?: (parseResult: Result<string, string>) => void }, ref?: React.ForwardedRef<HTMLDivElement>) => {

    const minuteRef = React.useRef<HTMLInputElement>(null);
    const hourRef = React.useRef<HTMLInputElement>(null);
    const [hasError, setHasError] = React.useState(false);

    const handleOnBlur = () => {
        const minuteValue = minuteRef.current?.value || "0";
        const hourValue = hourRef.current?.value || "0";
        console.log("blurred: ", "minuteValue: ", minuteValue, "hourValue: ", hourValue);
        const parseResult = cronParser(`${minuteValue} ${hourValue} * * *`);
        if (parseResult.type !== "ok") {
            console.log("error: ", parseResult.val);
            setHasError(true);
            onValueChange && onValueChange(parseResult)
            return
        }
        setHasError(false);
        const humanReadableForm = parseResult.val;
        console.log("tokens: ", humanReadableForm);
        onValueChange && onValueChange(parseResult)
    }

    return <div>Cron expression
        <div ref={ref} className={cn("flex gap-2", hasError && " [&>*]:border-red-900")}>
            <Input defaultValue={0} ref={minuteRef} placeholder="0" onBlur={handleOnBlur} className="border-emerald-300 w-12" />
            <Input defaultValue={0} ref={hourRef} placeholder="0" onBlur={handleOnBlur} className="border-emerald-300 w-12" />
            <Input type="text" defaultValue="*" placeholder="*" disabled className="border-emerald-300 w-12" />
            <Input type="text" defaultValue="*" placeholder="*" disabled className="border-emerald-300 w-12" />
            <Input defaultValue="*" placeholder="*" disabled className="border-emerald-300 w-12" />
        </div>
    </div>
})


