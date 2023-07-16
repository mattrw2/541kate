# Getting Started with 541kate.com

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Making content modifications

You can change the names of the navbar titles in `Shell.js` by changing the `name` property in the navigation array.
See the pages directory for page specific changes. I tried to put most of the content in editable objects at the top of the file.


## Creating a new page

* Start by adding a new file in the pages directory `<pageName>.js`
* Within that file, build a react component to render the page. 
* Add a new route to `App.js` (eg. `<Route exact path="/<pageName>" element={<<pageName> />} />`) don't forget to import the component to the `App.js` file.
* Configure the `navigation` array in `Shell.js` to ensure that the new page shows up in the navbar.

### Deploying new changes

Simply push your changes to the master branch, and they will auto-deploy using AWS Amplify.

### Learn More

- To learn React, check out the [React documentation](https://reactjs.org/).
- To learn Tailwind (used for styling), check out the [Tailwind documentation](https://tailwindcss.com/docs/installation).


