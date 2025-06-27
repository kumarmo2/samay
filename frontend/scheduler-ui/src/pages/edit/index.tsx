import { useParams } from "react-router"

const Edit = () => {
    let { id } = useParams()
    const idInt = +(id || 0)

    return <div>Edit {+idInt}</div>

}

export default Edit
