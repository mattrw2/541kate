const getUsers = async () => {
  const response = await fetch("http://localhost:8000/users")
  const data = await response.json()
  return data
}

const addUser = async (username) => {
  const response = await fetch("http://localhost:8000/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  })
  const data = await response.json()
  return data
}

const getUsersButton = document.getElementById("get-data-button")
const addUserButton = document.getElementById("add-user-button")


getUsersButton.addEventListener("click", async () => {
  const data = await getUsers()
  const list = document.getElementById("user-list")

  // clear any existing list items
  list.innerHTML = ""

  // add new list items to the page
  data.forEach((element) => {
    const listItem = document.createElement("li")
    listItem.id = element.id
    listItem.textContent = element.username
    list.appendChild(listItem)
  })
})

addUserButton.addEventListener("click", async (e) => {
  e.preventDefault()
  const username = document.getElementById("username-input").value
  await addUser(username)
  document.getElementById("username-input").value = ""
})


