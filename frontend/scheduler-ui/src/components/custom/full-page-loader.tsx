import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

type FullPageLoaderProps = React.PropsWithChildren & {
    className?: string;

}

export default function FullPageLoader({ className }: FullPageLoaderProps) {
    return (
        <div className={cn("fixed top-0 left-0 right-0 bottom-0 z-10 bg-transparent backdrop-blur-xs w-full h-full flex items-center justify-center", className)}>
            <div>
                <Loader className="animate-spin" />

            </div>
        </div>
    )

}
