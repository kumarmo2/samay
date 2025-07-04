import { Route, Routes } from "react-router";
import HomeComponent from "./pages/home/index";
import Edit from "./pages/edit";


export const hours = Array.from({ length: 24 }, (_, i) => i)
export const minutes = Array.from({ length: 60 }, (_, i) => i)

export type CronType = "oneshot" | "daily" | "hourly"

function App() {
    return (
        <div className="flex flex-col items-center h-screen py-10 mx-10 border-x">
            <Routes>
                <Route path="/" element={<HomeComponent />} />
                <Route path="/edit/:id" element={<Edit />} />
            </Routes>
        </div>
    )
}
export default App
