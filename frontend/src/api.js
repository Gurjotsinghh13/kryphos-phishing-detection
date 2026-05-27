import axios from "axios"

const base = import.meta.env.VITE_API_URL || ""

export default axios.create({
  baseURL: base
})