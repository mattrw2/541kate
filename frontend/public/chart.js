// eslint-disable-next-line no-unused-vars
const getUsersByDuration = async () => {
  const response = await fetch("https://five41kate.onrender.com/users/duration")
  const data = await response.json()
  return data
}

let barChart = null;

//This is the data for the bar chart
const chartLabels = async () => {
    // Call the function and await its result
  const durationArray = await getUsersByDuration();


  const labels = durationArray.map(user => user.username);
  const data = {
      labels: labels,
      datasets: [{
          data: durationArray.map(user => user.total_duration),
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
    

  }



  const ctx = document.getElementById('bar-chart').getContext('2d');

  if (barChart) {
      barChart.destroy();
  }
  
  barChart = new Chart(ctx, {
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

};

chartLabels()  
// Render the chart

    const getUsers = async () => {
  const response = await fetch("https://five41kate.onrender.com/users")
  const data = await response.json()
  return data
}

const addUser = async (username) => {
    // Fetch the list of existing usernames
    const existingUsersResponse = await fetch("https://five41kate.onrender.com/users");
    const existingUsers = await existingUsersResponse.json();
    const existingUsernames = existingUsers.map(user => user.username);
  
    // Check if the username is unique
    if (existingUsernames.includes(username)) {
      const usernameInput = document.getElementById("username-input");
      showTooltip("User already exists.", usernameInput);
      return;
    }
  
  const response = await fetch("https://five41kate.onrender.com/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: username }),
  })
  const data = await response.json()
  
  
  //reload the users
  await loadUserOptions()
  document.getElementById("select-name").value = data.id; // Set the newly added user as the selected option


  // Hide the data-fetching div
  document.getElementById("data-fetching").style.display = "none";
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
    optionItem.value = element.id
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




// gets an array of username and total_duration. For making the bar chart
const getActivities = async () => {
  const response = await fetch("https://five41kate.onrender.com/activities/list")
  const data = await response.json()
  return data
}

//input data into the chart --> try just changing the input to getActivities
/* const inputChartData = async () => {
  const data = await getUsersByDuration()
  document.getElementById("bar-chart").data = data */


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

function showTooltip(message, element) {
  const tooltip = document.getElementById("tooltip");
  tooltip.textContent = message;
  tooltip.classList.remove("hidden");

  // Calculate the position of the element
  const rect = element.getBoundingClientRect();
  const tooltipHeight = tooltip.offsetHeight;

  // Position the tooltip relative to the element
  tooltip.style.top = `${rect.bottom + window.scrollY}px`; // 5px below the element
  tooltip.style.left = `${rect.left + window.scrollX}px`; // Align to the left of the element

  // Hide the tooltip after 3 seconds
  setTimeout(() => {
    tooltip.classList.add("hidden");
  }, 3000);
}

// Validate the form
const validateForm = (user_id, duration, date, memo) => {
  const userSelect = document.getElementById("select-name");
  const durationInput = document.getElementById("select-time");
  const dateInput = document.getElementById("select-date");

  if (user_id === "Select an option" || user_id === "") {
    showTooltip("Please select a user.", userSelect);
    return false;
  }
  if (date === "") {
    showTooltip("Please enter a date.", dateInput);
    return false;}
  if (duration === "" || duration < 0) {
    showTooltip("Please enter a valid time.", durationInput);
    return false;
  }
  return true;
}
//What happens when you click the save button
const SaveButton = document.getElementById("save-button")
SaveButton.addEventListener("click", async (e) => {
  const user_id = document.getElementById("select-name").value
  const duration = document.getElementById("select-time").value
  const date = document.getElementById("select-date").value
  const memo = document.getElementById("write-description").value

  if (!validateForm(user_id, duration, date, memo))
    return;
  await addActivity(user_id, duration, date, memo)

  //load the list data
  renderListActivities()
  chartLabels()

  // Reset the form fields
  document.getElementById("select-name").value = "";
  document.getElementById("select-time").value = "";
  document.getElementById("select-date").value = "";
  document.getElementById("write-description").value = "";

  // Hide the form
  document.getElementById("exercise-input").style.display = "none";})



//render the list of activities
const renderListActivities = async () => {
  const activityList = document.getElementById("activity-list")
  activityList.innerHTML = ""
  const activities = await getActivities()

  activities.forEach((activity) => {
    const activityItem = document.createElement("li")
    activityItem.className = "font-extralight text-sm grid justify-items-start grid-cols-[auto,1fr,auto] px-2 px-y gap-2 rounded-md border-x border-t last:border-b border-x-yellow-600 border-t-yellow-600 last:border-b-yellow-600 items-center mx-4 max-w-[500px]"
    const dateContainer = document.createElement("div")
    dateContainer.className = "flex flex-col items-center w-12"
    const dateContainerSpan = document.createElement("span")
    const [year, month, day] = activity.date.split("-")
    const date = new Date(year, month - 1, day);
    const options = { month: 'short', day: 'numeric' };
    dateContainerSpan.textContent = date.toLocaleDateString('en-US', options);    dateContainer.appendChild(dateContainerSpan)
    activityItem.appendChild(dateContainer)

    const descriptionContainer = document.createElement("div")
    
    const descriptionContainerSpan = document.createElement("span")
    descriptionContainerSpan.className = "text-xs text-yellow-600"
    descriptionContainerSpan.textContent = activity.memo
    const descriptionContainerSpan2 = document.createElement("span")
    descriptionContainerSpan2.className = "flex flex-col text-left w-full"
    descriptionContainerSpan2.textContent = activity.username

    descriptionContainer.appendChild(descriptionContainerSpan2)
    descriptionContainer.appendChild(descriptionContainerSpan)
    activityItem.appendChild(descriptionContainer)

    const durationContainer = document.createElement("span")
    durationContainer.textContent = activity.duration+" min"
    activityItem.appendChild(durationContainer)

    activityList.appendChild(activityItem)
  })}

document.onload = renderListActivities()


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

 //to do 
 /* 
 - Add in the total minutes (also in the chart--need structure)
 - Prevent bad data saving
- add auto date of today

 - Sort the data by date (Matt to do)
 - Add filter functionality*/