import { createContext, useContext, useState } from "react"

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const stored = localStorage.getItem("currentUser")
  const [currentUser, setCurrentUserState] = useState(stored ? JSON.parse(stored) : null)

  const setCurrentUser = (user) => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user))
    } else {
      localStorage.removeItem("currentUser")
    }
    setCurrentUserState(user)
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useCurrentUser = () => useContext(UserContext)
