
//This is the data for the bar chart
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
})
    const getUsers = async () => {
  const response = await fetch("https://five41kate.onrender.com/users")
  const data = await response.json()
  return data
}

const addUser = async (username) => {
  const response = await fetch("https://five41kate.onrender.com/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  })
  const data = await response.json()
  return data
}
const addUserButton = document.getElementById("add-user-button")

//this loads all the users
const loadUserOptions = async () => {
  const data = await getUsers()
  const selectElement = document.getElementById("select-name")

  // clear any existing list items
  selectElement.innerHTML = ""

  // Create and append the default empty option
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select an option";
  selectElement.appendChild(defaultOption);

  // add new list items to the page
  data.forEach((element) => {
    const optionItem = document.createElement("option")
    optionItem.id = element.id
    optionItem.textContent = element.username
    selectElement.appendChild(optionItem)
  })
}
//load users on select on load
document.onload = loadUserOptions()

// add new user
addUserButton.addEventListener("click", async (e) => {
  e.preventDefault()
  const username = document.getElementById("username-input").value
  await addUser(username)
  document.getElementById("username-input").value = ""
})


// eslint-disable-next-line no-unused-vars
const getUsersByDuration = async () => {
  const response = await fetch("https://five41kate.onrender.com/users/duration")
  const data = await response.json()
  return data
}

// eslint-disable-next-line no-unused-vars
const addActivity = async (user_id, duration, date, memo) => {
  const response = await fetch("https://five41kate.onrender.com/activities",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id, duration, date, memo }),
    })
  const data = await response.json()
  return data
}

const SaveButton = document.getElementById("save-button")
SaveButton.addEventListener("click", async (e) => {
  const user_id = document.getElementById("select-name").value
  const duration = document.getElementById("select-time").value
  const date = document.getElementById("select-date").value
  const memo = document.getElementById("write-description").value
  addActivity(user_id, duration, date, memo)

  // Reset the form fields
  document.getElementById("select-name").value = "";
  document.getElementById("select-time").value = "";
  document.getElementById("select-date").value = "";
  document.getElementById("write-description").value = "";

  // Hide the form
  document.getElementById("exercise-input").style.display = "none";})

//this expands the add exercise form
const getAddButton = document.getElementById("add-button");
getAddButton.addEventListener("click", () => {
  const form = document.getElementById("exercise-input");

  if (form.style.display === "block") {
    form.style.display = "none";
  } else {
    form.style.display = "block";
  }
});
// This expands the add user feature
document.getElementById("expand-user-button").addEventListener("click", () => {
    const dataFetching = document.getElementById("data-fetching");
    if (dataFetching.style.display === "block") {
      dataFetching.style.display = "none";
    } else {
      dataFetching.style.display = "block";
    }
  });

 