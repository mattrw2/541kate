//get names later

// Use the names from the select element as labels

const labels = ["Corban", "Popster", "Kate", "Shannon", "James", "Santa", "Rudolph", "Frosty", "Gregg", "Buddy", "Jovie", "Walter", "Emily"];
const data = {
    labels: labels,
    datasets: [{
        data: [65, 59, 4, 81, 750, 150, 100, 600, 130, 3, 240, 160, 170],
        backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)'
        ],
        borderColor: [
            'rgb(255, 99, 132)',
            'rgb(255, 159, 64)',
            'rgb(255, 205, 86)',
            'rgb(75, 192, 192)',
            'rgb(54, 162, 235)',
            'rgb(153, 102, 255)',
            'rgb(201, 203, 207)'
        ],
        borderWidth: 1
    }]
};

// Render the chart
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('bar-chart').getContext('2d');
    const barChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false // Remove horizontal grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            scaleID: 'x',
                            value: 600,
                            borderColor: 'orange',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: '600'
                            }
                        }
                    }
                }
            }
        }
    })
})const getUsers = async () => {
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


