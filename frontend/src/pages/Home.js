import React from 'react'
// import kate image
import kate from '../kate.png'



const Home = () => {
    // display the image of kate that is located in the root directory
  return (
    <div>
        <img className='w-full' src={kate} alt="Kate" />
    </div>

  )
}

export default Home