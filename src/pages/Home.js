import React from 'react'
//use require to import kate
const kate = require('../kate.jpeg')


const Home = () => {
    // display the image of kate that is located in the root directory
  return (
    <div>
        <img className='w-full' src={kate} alt="Kate" />
    </div>

  )
}

export default Home