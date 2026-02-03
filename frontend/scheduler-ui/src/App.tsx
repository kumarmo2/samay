import { Route, Routes } from "react-router";
import HomeComponent from "./pages/home/index";
import Edit from "./pages/edit";


export const hours = Array.from({ length: 24 }, (_, i) => i)
export const minutes = Array.from({ length: 60 }, (_, i) => i)

export type CronType = "oneshot" | "daily" | "hourly"

function App() {
    return (
        <div className="min-h-screen w-full bg-background">
            <div className="mx-auto flex min-h-screen w-full flex-col px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:border-x border-border">
                <Routes>
                    <Route path="/" element={<HomeComponent />} />
                    <Route path="/edit/:id" element={<Edit />} />
                </Routes>
            </div>
        </div>
    )
}
export default App
